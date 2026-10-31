import { createHash, randomUUID } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { json, issueToken, sheetsPost } from './_lib.mjs';

const SIZES = ['3.6 ly', '4 ly', '4.5 ly', '4.6–4.9 ly', '5 ly', '5.4 ly', '5.8 ly', '6 ly', 'Khác'];
const BUDGETS = ['Dưới 10 triệu', '10–20 triệu', '20–30 triệu', '30–50 triệu', '50–100 triệu', 'Trên 100 triệu'];
const PURPOSES = ['Nhẫn cầu hôn', 'Nhẫn đeo hằng ngày', 'Bông tai', 'Viên kim cương rời', 'Quà tặng', 'Nhu cầu khác'];
const PHONE_RE = /^(0|\+?84)(3|5|7|8|9)\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_PER_IP_PER_HOUR = 6;
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
const normPhone = (p) => p.replace(/^\+?84/, '0');

const utmString = (u = {}) =>
  [...UTM_KEYS.map((k) => (u[k] ? `${k}=${clean(u[k], 80)}` : '')), u.referrer ? `ref=${clean(u.referrer, 120)}` : '']
    .filter(Boolean)
    .join(' | ');

// Chống spam theo IP: tối đa N lần gửi mỗi giờ.
const overLimit = async (req) => {
  const ip = req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'unknown';
  const key = `${createHash('sha256').update(ip).digest('hex').slice(0, 24)}_${Math.floor(Date.now() / 3600000)}`;
  const store = getStore({ name: 'ratelimit', consistency: 'strong' });
  const n = (await store.get(key, { type: 'json' })) || 0;
  if (n >= MAX_PER_IP_PER_HOUR) return true;
  await store.setJSON(key, n + 1);
  return false;
};

export default async (req) => {
  if (req.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, error: 'Dữ liệu không hợp lệ.' });
  }

  // Ô ẩn dành cho bot: người thật không điền.
  if (clean(body.website, 50)) return json(400, { ok: false, error: 'Dữ liệu không hợp lệ.' });

  const name = clean(body.name, 100);
  const phoneRaw = clean(body.phone, 20).replace(/[\s.\-()]/g, '');
  const email = clean(body.email, 120);
  const size = clean(body.size, 30);
  const budget = clean(body.budget, 30);
  const purpose = clean(body.purpose, 40);

  const errors = {};
  if (name.length < 2) errors.name = 'Vui lòng nhập họ và tên.';
  if (!PHONE_RE.test(phoneRaw)) errors.phone = 'Số điện thoại chưa đúng (VD: 0912 345 678).';
  if (email && !EMAIL_RE.test(email)) errors.email = 'Email chưa đúng định dạng.';
  if (!SIZES.includes(size)) errors.size = 'Vui lòng chọn kích thước.';
  if (!BUDGETS.includes(budget)) errors.budget = 'Vui lòng chọn ngân sách.';
  if (!PURPOSES.includes(purpose)) errors.purpose = 'Vui lòng chọn mục đích.';
  if (body.consent !== true) errors.consent = 'Vui lòng đồng ý để CHJ liên hệ tư vấn.';
  if (Object.keys(errors).length) return json(422, { ok: false, errors });

  const phone = normPhone(phoneRaw);
  const key = `lead_${phone}`;
  const now = new Date().toISOString();

  try {
    if (await overLimit(req)) {
      return json(429, { ok: false, error: 'Bạn gửi quá nhiều lần. Vui lòng thử lại sau hoặc nhắn Zalo 0912 268 667.' });
    }

    // Cùng số điện thoại: cập nhật hồ sơ cũ thay vì tạo bản ghi trùng.
    const store = getStore({ name: 'leads', consistency: 'strong' });
    const old = await store.get(key, { type: 'json' });
    const lead = {
      id: old?.id || randomUUID(),
      key,
      createdAt: old?.createdAt || now,
      updatedAt: now,
      submissions: (old?.submissions || 0) + 1,
      name, phone,
      email: email || old?.email || '',
      size, budget, purpose,
      consent: true,
      consentText: clean(body.consentText, 400),
      utm: old?.utm || utmString(body.utm) || '',
      source: old?.source || clean(body.source, 200),
      interests: old?.interests || [],
      status: old?.status || 'Mới',
      sheetSynced: false,
    };
    await store.setJSON(key, lead);

    // Đồng bộ Google Sheet. Lead đã nằm an toàn trong Blobs; cờ sheetSynced giúp phát hiện bản chưa đồng bộ.
    lead.sheetSynced = await sheetsPost({ action: 'lead', lead });
    if (lead.sheetSynced) await store.setJSON(key, lead);

    return json(200, { ok: true, token: issueToken(key) });
  } catch (err) {
    console.error('Luu lead that bai:', err);
    return json(500, { ok: false, error: 'Chưa lưu được thông tin. Vui lòng thử lại hoặc nhắn Zalo 0912 268 667.' });
  }
};
