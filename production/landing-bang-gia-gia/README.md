# Landing bảng giá kim cương GIA – CHJ Diamond

Trang tĩnh + 3 Netlify Functions. Bảng giá KHÔNG nằm trong HTML: chỉ trả về khi lead đã được lưu và có token hợp lệ (24 giờ).

## Triển khai Netlify
1. Netlify → Add new site → Import from Git (hoặc `netlify deploy --prod`), **Base directory** = `production/landing-bang-gia-gia`.
2. Site settings → Environment variables:
   - `TOKEN_SECRET` (bắt buộc): chuỗi ngẫu nhiên ≥ 16 ký tự, ký token xem bảng giá.
   - `ADMIN_KEY` (bắt buộc để xuất lead): chuỗi ngẫu nhiên ≥ 16 ký tự.
   - `LEAD_WEBHOOK_URL` (tuỳ chọn): URL Apps Script `/exec` để ghi thêm vào Google Sheet; lỗi webhook không làm mất lead.
3. Lead lưu trong Netlify Blobs (store `leads`). Xuất CSV:
   `curl -H "x-admin-key: <ADMIN_KEY>" https://<site>/.netlify/functions/export-leads -o leads.csv`

## Cập nhật kho kim cương
Sửa `data/stock.json` (sinh từ `raw/BẢNG GIÁ KIM CƯƠNG GIA - CHJ DIAMOND.xlsx`) rồi deploy lại. Nếu đổi khoảng giá 5 ly, sửa luôn khối `#range5` trong `index.html`.
