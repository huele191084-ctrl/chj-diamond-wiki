import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const secret = () => {
  const s = process.env.TOKEN_SECRET;
  if (!s || s.length < 16) throw new Error('TOKEN_SECRET chua duoc cau hinh');
  return s;
};

const sign = (payload) => createHmac('sha256', secret()).update(payload).digest('base64url');

// id = khoá lead trong Blobs (lead_<sđt>); token chứng minh khách đã được ghi nhận.
export const issueToken = (id) => {
  const payload = Buffer.from(JSON.stringify({ id, exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
};

// Trả về payload { id, exp } nếu token hợp lệ, ngược lại null.
export const readToken = (token) => {
  if (typeof token !== 'string') return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const p = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return p.exp > Date.now() ? p : null;
  } catch {
    return null;
  }
};

export const verifyToken = (token) => readToken(token) !== null;

// Gọi Apps Script ghi Google Sheet. Trả về true nếu sheet xác nhận đã ghi.
export const sheetsConfigured = () => Boolean(process.env.SHEETS_WEBHOOK_URL && process.env.SHEETS_WEBHOOK_SECRET);

export const sheetsPost = async (payload) => {
  if (!sheetsConfigured()) return false;
  try {
    const res = await fetch(process.env.SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...payload, secret: process.env.SHEETS_WEBHOOK_SECRET }),
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    return data.ok === true;
  } catch (err) {
    console.error('Google Sheets webhook that bai:', err);
    return false;
  }
};
