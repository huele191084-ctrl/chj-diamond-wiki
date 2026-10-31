// Đưa website vào docs/bang-gia-kim-cuong/ (GitHub Pages) — CHỈ khi đã kết nối dữ liệu và verify.mjs đạt cho đúng phiên bản hiện tại.
import { cpSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, SITE, STAMP, apiUrl, siteHash } from './lib.mjs';

const fail = (m) => { console.error('TỪ CHỐI XUẤT BẢN: ' + m); process.exit(1); };

if (!apiUrl()) fail('site/config.js chưa có API_URL (website chưa kết nối dữ liệu).');
if (!existsSync(STAMP)) fail('chưa chạy tools/verify.mjs (hoặc chưa đạt).');
const stamp = JSON.parse(readFileSync(STAMP, 'utf8'));
if (stamp.url !== apiUrl()) fail('API_URL đã đổi sau lần kiểm tra. Chạy lại verify.mjs.');
if (stamp.hash !== siteHash()) fail('mã nguồn trong site/ đã thay đổi sau lần kiểm tra. Chạy lại verify.mjs.');

const dest = join(ROOT, '..', '..', 'docs', 'bang-gia-kim-cuong');
rmSync(dest, { recursive: true, force: true });
cpSync(SITE, dest, { recursive: true });
console.log(`Đã xuất bản vào ${dest}\nBước tiếp theo: git add docs/bang-gia-kim-cuong && git commit && git push (GitHub Pages sẽ tự cập nhật).`);
