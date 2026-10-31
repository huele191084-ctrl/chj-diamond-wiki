# Landing bảng giá kim cương GIA – CHJ Diamond

Trang tĩnh + Netlify Functions. Bảng giá KHÔNG nằm trong HTML: chỉ trả về khi lead đã được lưu và có token hợp lệ (24 giờ).

## Luồng dữ liệu
- Form → `submit-lead` → lưu Netlify Blobs (bản ghi gốc) → đồng bộ Google Sheet → trả token → `get-stock` trả bảng giá.
- Kho kim cương đọc trực tiếp từ Google Sheet (cache 5 phút). Sheet lỗi hoặc chưa cấu hình thì dùng `data/stock.json` dự phòng.
- Khách bấm "Tư vấn qua Zalo" → `track-interest` ghi viên đó vào cột "Viên kim đã bấm tư vấn".
- Chống spam/trùng: ô ẩn cho bot, tối đa 6 lần gửi/IP/giờ, kiểm tra dữ liệu phía server, cùng số điện thoại thì cập nhật dòng cũ (không tạo dòng mới).

## 1. Google Sheet (làm 1 lần)
1. Tải file Excel kho (`raw/BẢNG GIÁ KIM CƯƠNG GIA - CHJ DIAMOND.xlsx`) lên Google Sheets, giữ nguyên các tab và cột.
2. Tiện ích mở rộng → Apps Script → dán `google-apps-script/chj-sheets.gs`.
3. Chạy `setup()`, cấp quyền, lấy `WEBHOOK_SECRET` trong Nhật ký thực thi. Hàm này tạo tab **Khách hàng** (đủ cột, danh sách trạng thái chăm sóc).
4. Triển khai → Ứng dụng web → chạy với tư cách "Tôi", quyền truy cập "Bất kỳ ai" → chép URL `/exec`.
5. Không chia sẻ hoặc xuất bản công khai file Sheet; chỉ nhân viên CHJ được cấp quyền. Website truy cập qua secret, không cần mở Sheet.

## 2. Netlify
Base directory = `production/landing-bang-gia-gia`. Biến môi trường:
- `TOKEN_SECRET`, `ADMIN_KEY`: chuỗi ngẫu nhiên ≥ 16 ký tự (bắt buộc).
- `SHEETS_WEBHOOK_URL`: URL `/exec` ở bước 4; `SHEETS_WEBHOOK_SECRET`: `WEBHOOK_SECRET` ở bước 3.

Xuất CSV dự phòng (có cột `sheetSynced` cho biết lead nào chưa lên Sheet):
`curl -H "x-admin-key: <ADMIN_KEY>" https://<site>/.netlify/functions/export-leads -o leads.csv`

## Cập nhật kho
Sửa giá, thêm hoặc xóa viên trực tiếp trong Google Sheet. Nếu đổi khoảng giá 5 ly, sửa khối `#range5` trong `index.html`.
