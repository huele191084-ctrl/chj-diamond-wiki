import { json, verifyToken } from './_lib.mjs';
import { loadStock } from './_stock.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });
  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, error: 'Dữ liệu không hợp lệ.' });
  }
  if (!verifyToken(body.token)) return json(401, { ok: false, error: 'Phiên xem bảng giá đã hết hạn. Vui lòng nhập lại thông tin.' });
  const { items } = await loadStock();
  return json(200, { ok: true, items });
};
