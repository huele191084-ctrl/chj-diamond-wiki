import { timingSafeEqual } from 'node:crypto';
import { getStore } from '@netlify/blobs';

const COLS = ['createdAt', 'updatedAt', 'name', 'phone', 'email', 'size', 'budget', 'purpose', 'interests', 'utm', 'status', 'submissions', 'consent', 'sheetSynced'];
// Tiền tố ' chặn công thức Excel (=, +, -, @) trong dữ liệu khách nhập.
const csvCell = (v) => `"${String(Array.isArray(v) ? v.join('; ') : v ?? '').replace(/"/g, '""').replace(/^([=+\-@])/, "'$1")}"`;

// GET /.netlify/functions/export-leads với header x-admin-key: <ADMIN_KEY>
export default async (req) => {
  const key = process.env.ADMIN_KEY || '';
  const given = req.headers.get('x-admin-key') || '';
  const ok = key.length >= 16 && given.length === key.length && timingSafeEqual(Buffer.from(given), Buffer.from(key));
  if (!ok) return new Response('Unauthorized', { status: 401 });

  const store = getStore({ name: 'leads', consistency: 'strong' });
  const { blobs } = await store.list();
  const rows = (await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })))).filter(Boolean);
  rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const csv = '﻿' + [COLS.join(','), ...rows.map((r) => COLS.map((c) => csvCell(r[c])).join(','))].join('\r\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="leads-chj.csv"',
      'Cache-Control': 'no-store',
    },
  });
};
