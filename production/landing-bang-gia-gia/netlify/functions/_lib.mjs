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

export const issueToken = (leadId) => {
  const payload = Buffer.from(JSON.stringify({ id: leadId, exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
};

export const verifyToken = (token) => {
  if (typeof token !== 'string') return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now();
  } catch {
    return false;
  }
};
