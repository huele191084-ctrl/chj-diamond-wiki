import { getStore } from '@netlify/blobs';
import { json, readToken, sheetsPost } from './_lib.mjs';
import { loadStock } from './_stock.mjs';

const describe = (x) => `${x.ly.toFixed(1)} ly ${x.color} ${x.clarity} GIA ${x.gia_no} ${x.price.toLocaleString('vi-VN')}đ`;

// Ghi nhận viên khách bấm "Tư vấn qua Zalo" vào hồ sơ khách và Google Sheet.
export default async (req) => {
  if (req.method !== 'POST') return json(405, { ok: false });
  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false });
  }
  const tok = readToken(body.token);
  if (!tok) return json(401, { ok: false });

  const { items } = await loadStock();
  const item = items.find((i) => i.id === String(body.itemId));
  if (!item) return json(404, { ok: false });

  try {
    const store = getStore({ name: 'leads', consistency: 'strong' });
    const lead = await store.get(tok.id, { type: 'json' });
    if (!lead) return json(404, { ok: false });
    const text = describe(item);
    if (!lead.interests.includes(text)) {
      lead.interests.push(text);
      lead.updatedAt = new Date().toISOString();
      await store.setJSON(tok.id, lead);
      lead.sheetSynced = (await sheetsPost({ action: 'interest', leadKey: tok.id, phone: lead.phone, interest: text })) && lead.sheetSynced;
    }
    return json(200, { ok: true });
  } catch (err) {
    console.error('Ghi nhan quan tam that bai:', err);
    return json(500, { ok: false });
  }
};
