// Kiểm tra toàn bộ quy trình trên hệ thống THẬT (Apps Script + Google Sheet) trước khi xuất bản.
// Chạy:  CHJ_ADMIN_KEY=<ADMIN_KEY> CHJ_TEST_EMAIL=<email của chị> node tools/verify.mjs
import { writeFileSync } from 'node:fs';
import { STAMP, apiUrl, siteHash, post, get } from './lib.mjs';

const url = apiUrl();
const adminKey = process.env.CHJ_ADMIN_KEY || '';
const testEmail = process.env.CHJ_TEST_EMAIL || '';
const results = [];
let failed = false;
const check = (name, ok, detail = '') => {
  results.push(ok);
  if (!ok) failed = true;
  console.log(`${ok ? 'ĐẠT  ' : 'LỖI  '} ${name}${detail ? ' – ' + detail : ''}`);
};

if (!url) { console.error('Chưa điền API_URL trong site/config.js'); process.exit(1); }
if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(testEmail)) { console.error('Thiếu CHJ_TEST_EMAIL: email của chị để nhận 1 thư thử (bước kiểm tra gửi bảng giá qua email)'); process.exit(1); }
if (adminKey.length < 16) { console.error('Thiếu biến môi trường CHJ_ADMIN_KEY (ADMIN_KEY in ra khi chạy setup() trong Apps Script)'); process.exit(1); }

const validLead = (phone, extra = {}) => ({
  action: 'test_lead', adminKey, name: 'ZZ TEST Kiểm tra', phone, email: testEmail, size: '5 ly', budget: '20–30 triệu',
  purpose: 'Nhẫn cầu hôn', consent: true, website: '', utm: { utm_source: 'verify' }, ...extra,
});

try {
  // 1. Hệ thống sẵn sàng
  const ping = await get(url, 'action=ping');
  check('Apps Script trả lời và đã chạy setup()', ping.ok && ping.ready);

  // 2. Dữ liệu kho là dữ liệu thật từ Sheet
  const diag = await post(url, { action: 'diag', adminKey });
  check('Khóa quản trị đúng', diag.ok === true);
  check('Kho có viên còn hàng', diag.available > 0, `${diag.available} viên`);
  check('Không có mã GIA + kích thước trùng', !diag.dupes?.length, diag.dupes?.slice(0, 3).join('; '));
  check('Không có dòng thiếu giá/màu/độ sạch', !diag.bad?.length, diag.bad?.slice(0, 3).join('; '));

  // 3. Bảng giá bị khóa khi chưa có token
  const locked = await post(url, { action: 'stock', token: 'x.y' });
  check('Bảng giá không mở khi thiếu/giả token', locked.ok === false && !locked.items);

  // 4. Dữ liệu sai bị từ chối
  const bad = await post(url, { action: 'lead', name: 'A', phone: '123', consent: false });
  check('Form sai bị từ chối', bad.ok === false && bad.errors?.phone && bad.errors?.consent);
  const bot = await post(url, validLead('0900000001', { action: 'lead', website: 'spam.com' }));
  check('Bot (ô ẩn) bị chặn', bot.ok === false && !bot.token);
  const noMail = await post(url, validLead('0900000001', { email: '' }));
  check('Thiếu email thì không lưu', noMail.ok === false && !!noMail.errors?.email);
  const noConsent = await post(url, validLead('0900000001', { consent: false }));
  check('Không đồng ý thì không lưu', noConsent.ok === false);

  // 5. Lưu lead hợp lệ -> có token -> xem được bảng giá
  const l1 = await post(url, validLead('0900000001'));
  check('Lưu lead hợp lệ, nhận token', l1.ok === true && !!l1.token);
  check('Bảng giá đã được gửi qua email ngay', l1.emailStatus === 'sent', `trạng thái: ${l1.emailStatus} (kiểm tra hộp thư ${testEmail})`);
  const stock = await post(url, { action: 'stock', token: l1.token });
  check('Có token thì mở được bảng giá', stock.ok === true && stock.items?.length > 0, `${stock.items?.length} viên`);
  check('Bảng giá khớp số viên kho', stock.items?.length === diag.available);
  check('Mỗi viên có giá > 0 và đủ thông số', stock.items?.every((x) => x.price > 0 && x.color && x.clarity && x.gia_no && x.ct > 0));
  check('Không có viên Đã bán/Ẩn lọt ra web', stock.items?.every((x) => x.st === 'ok' || x.st === 'hold'));

  // 6. Ghi nhận viên quan tâm
  const pick = stock.items.find((x) => x.st === 'ok') || stock.items[0];
  const it = await post(url, { action: 'interest', token: l1.token, itemId: pick.id });
  check('Ghi nhận viên khách bấm tư vấn', it.ok === true);
  const fake = await post(url, { action: 'interest', token: 'x.y', itemId: pick.id });
  check('Token giả không ghi được quan tâm', fake.ok === false);

  // 7. Trùng số điện thoại: không tạo thêm dòng
  const l2 = await post(url, validLead('0900000001', { phone: '+84900000001' }));
  check('Gửi lại cùng SĐT vẫn thành công (cập nhật hồ sơ)', l2.ok === true);
  check('Không gửi lặp email trong thời gian chờ', l2.emailStatus === 'recent');

  // 8. Chống gửi dồn cùng một số (không dùng đường test_lead)
  const a = await post(url, { ...validLead('0900000002'), action: 'lead' });
  const b = await post(url, { ...validLead('0900000002'), action: 'lead' });
  check('Chống gửi dồn cùng một số trong vài giây', a.ok === true && b.ok === false);
} catch (err) {
  check('Gọi Apps Script không lỗi', false, String(err));
} finally {
  try {
    const del = await post(url, { action: 'delete_tests', adminKey });
    check('Dọn dòng test khỏi tab Khách hàng', del.ok === true, `${del.removed} dòng`);
    if (del.removed !== 2) console.log('LƯU Ý: kỳ vọng xóa 2 dòng test (0900000001, 0900000002)');
    if (del.removed !== 2) failed = true;
  } catch (err) {
    check('Dọn dòng test', false, String(err));
  }
}

if (failed) {
  console.error('\nKHÔNG ĐẠT. Chưa được xuất bản. Sửa lỗi ở trên rồi chạy lại.');
  process.exit(1);
}
writeFileSync(STAMP, JSON.stringify({ hash: siteHash(), url, at: new Date().toISOString() }, null, 2));
console.log(`\nTất cả ${results.length} bước ĐẠT. Đã ghi .verified.json. Chạy: node tools/publish.mjs`);
