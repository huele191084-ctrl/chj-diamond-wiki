import backup from '../../data/stock.json' with { type: 'json' };

const CACHE_MS = 5 * 60 * 1000;
let cache = null;

const valid = (x) =>
  x && typeof x.id === 'string' && typeof x.ly === 'number' && typeof x.ct === 'number' && typeof x.price === 'number' && x.price > 0 && x.color && x.clarity;

// Kho kim cương lấy trực tiếp từ Google Sheet (qua Apps Script). Lỗi hoặc chưa cấu hình thì dùng bản dự phòng đóng gói sẵn.
export const loadStock = async () => {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache;
  const base = process.env.SHEETS_WEBHOOK_URL;
  const secret = process.env.SHEETS_WEBHOOK_SECRET;
  if (base && secret) {
    try {
      const url = `${base}${base.includes('?') ? '&' : '?'}action=stock&secret=${encodeURIComponent(secret)}`;
      const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(8000) });
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items.filter(valid) : [];
      if (data.ok && items.length) {
        cache = { at: Date.now(), items, source: 'sheet' };
        return cache;
      }
      console.error('Kho tu Google Sheet rong/khong hop le');
    } catch (err) {
      console.error('Doc kho tu Google Sheet that bai:', err);
    }
  }
  cache = { at: Date.now() - CACHE_MS + 30 * 1000, items: backup, source: 'backup' };
  return cache;
};
