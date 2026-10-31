import { randomUUID } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { json, issueToken } from './_lib.mjs';

const SIZES = ['3.6 ly', '4 ly', '4.5 ly', '4.6–4.9 ly', '5 ly', '5.4 ly', '5.8 ly', '6 ly', 'Khác'];
const BUDGETS = ['Dưới 10 triệu', '10–20 triệu', '20–30 triệu', '30–50 triệu', '50–100 triệu', 'Trên 100 triệu'];
const PURPOSES = ['Nhẫn cầu hôn', 'Nhẫn đeo hằng ngày', 'Bông tai', 'Viên kim cương rời', 'Quà tặng', 'Nhu cầu khác'];
const PHONE_RE = /^(0|\+?84)(3|5|7|8|9)\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);

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
  const phone = clean(body.phone, 20).replace(/[\s.\-()]/g, '');
  const email = clean(body.email, 120);
  const size = clean(body.size, 30);
  const budget = clean(body.budget, 30);
  const purpose = clean(body.purpose, 40);

  const errors = {};
  if (name.length < 2) errors.name = 'Vui lòng nhập họ và tên.';
  if (!PHONE_RE.test(phone)) errors.phone = 'Số điện thoại chưa đúng (VD: 0912 345 678).';
  if (email && !EMAIL_RE.test(email)) errors.email = 'Email chưa đúng định dạng.';
  if (!SIZES.includes(size)) errors.size = 'Vui lòng chọn kích thước.';
  if (!BUDGETS.includes(budget)) errors.budget = 'Vui lòng chọn ngân sách.';
  if (!PURPOSES.includes(purpose)) errors.purpose = 'Vui lòng chọn mục đích.';
  if (body.consent !== true) errors.consent = 'Vui lòng đồng ý để CHJ liên hệ tư vấn.';
  if (Object.keys(errors).length) return json(422, { ok: false, errors });

  const id = randomUUID();
  const lead = {
    id,
    createdAt: new Date().toISOString(),
    name, phone, email, size, budget, purpose,
    consent: true,
    consentText: clean(body.consentText, 400),
    source: clean(body.source, 200),
    userAgent: clean(req.headers.get('user-agent'), 200),
  };

  try {
    await getStore({ name: 'leads', consistency: 'strong' }).setJSON(`${lead.createdAt}_${id}`, lead);
  } catch (err) {
    console.error('Luu lead that bai:', err);
    return json(500, { ok: false, error: 'Chưa lưu được thông tin. Vui lòng thử lại hoặc nhắn Zalo 0912 268 667.' });
  }

  // Bản sao tuỳ chọn sang Google Sheet / webhook; lỗi ở đây không ảnh hưởng việc lead đã được lưu.
  const hook = process.env.LEAD_WEBHOOK_URL;
  if (hook) {
    try {
      await fetch(hook, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(lead),
        redirect: 'follow',
        signal: AbortSignal.timeout(5000),
      });
    } catch (err) {
      console.error('Webhook that bai:', err);
    }
  }

  return json(200, { ok: true, token: issueToken(id) });
};
