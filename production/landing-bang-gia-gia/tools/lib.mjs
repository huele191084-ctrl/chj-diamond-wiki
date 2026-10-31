import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SITE = join(ROOT, 'site');
export const STAMP = join(ROOT, '.verified.json');

export const apiUrl = () => {
  const m = readFileSync(join(SITE, 'config.js'), 'utf8').match(/API_URL:\s*'([^']*)'/);
  return m ? m[1].trim() : '';
};

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

// Dấu vân tay của toàn bộ thư mục site/: đổi bất kỳ file nào thì kết quả kiểm tra cũ mất hiệu lực.
export const siteHash = () => {
  const h = createHash('sha256');
  for (const p of walk(SITE).sort()) h.update(relative(SITE, p).replace(/\\/g, '/')).update(readFileSync(p));
  return h.digest('hex');
};

// Gọi Apps Script giống trình duyệt: POST text/plain, theo redirect.
export const post = async (url, body) => {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), redirect: 'follow' });
  return r.json();
};
export const get = async (url, qs) => (await fetch(`${url}?${qs}`, { redirect: 'follow' })).json();
