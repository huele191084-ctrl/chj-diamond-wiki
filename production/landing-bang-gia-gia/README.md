# Website bảng giá kim cương GIA – CHJ Diamond

Trang tĩnh xuất bản bằng GitHub Pages (như các landing cũ) + Google Apps Script xử lý dữ liệu. Không dùng Netlify, không gửi email.

```
site/            Website: index.html (form), thanks.html (cảm ơn + bảng giá), app.js, config.js, images/
apps-script/     Code.gs – dán vào Google Sheet RIÊNG của CHJ để lưu khách
tools/           verify.mjs (kiểm tra thật) và publish.mjs (xuất bản có khóa)
docs/bang-gia-kim-cuong/   Bản công khai; CHỈ được tạo bởi publish.mjs
```

## Luồng khách hàng
Xem giá dễ hiểu → điền form → **trang cảm ơn kèm bảng giá** → bấm vào BẤT KỲ viên nào → cửa sổ mời **vào nhóm Zalo CHJ** gặp nhân viên tư vấn (nút vào nhóm + mã QR; thông tin viên được sao chép sẵn để dán vào nhóm) → mua hàng.
- Bảng giá KHÔNG nằm trong HTML: Apps Script chỉ trả khi form đã ghi vào Sheet (token ký số, 24 giờ).
- Link nhóm Zalo (`ZALO_GROUP_URL` trong `site/config.js`) lấy từ mã QR của ảnh mời vào nhóm; chị kiểm tra lại bằng cách mở link.
- Mỗi viên có nút tải ảnh thẻ PNG.

## Kho kim cương: đọc từ sheet "CÁC VIÊN KIM CƯƠNG GIA CÓ SẴN TẠI CHJ"
Web đọc trực tiếp (không sửa gì trong sheet đó) và cập nhật theo sheet:
- Chỉ đọc các tab kích thước `3.6LY … 6LY` và `K PHẢI TRÒN`. Tab `KIM TẤM` (giá nhập) và cột `NGƯỜI BÁN` KHÔNG bao giờ lên web.
- Viên có tên trong cột **NGƯỜI BÁN** hoặc có ngày/chữ "bán" trong cột ghi chú → tự ẩn. Viên có chữ "giữ" hoặc "cọc" → hiện nhãn "Đang có khách giữ".
- Viên thiếu mã GIA 10 số không lên web (vì CHJ bán kim cương GIA).
- Cột A: màu, hoặc `4,75 - H` (kích thước - màu); tab 4.6–4.9LY nên luôn ghi kích thước từng viên.
- Nhân viên vẫn làm việc trong sheet như cũ. Muốn một viên biến mất khỏi web: ghi tên người bán vào cột NGƯỜI BÁN.

## Thiết lập Google (làm 1 lần)
1. **Tạo Sheet khách hàng riêng**: Google Sheets → tạo bảng tính mới tên "CHJ – Khách hàng" (dữ liệu khách không nên nằm trong sheet kho của người khác).
2. **Dán script**: Tiện ích mở rộng → Apps Script → dán toàn bộ `apps-script/Code.gs` → lưu.
3. **Chạy `setup()`** → cấp quyền (cần quyền đọc sheet kho: tài khoản đang dùng phải xem được sheet kho). Xem Nhật ký thực thi: phải hiện "Đọc được kho: N viên" và `ADMIN_KEY` (cất riêng, không dán lên web). `setup()` tạo tab **Khách hàng**, **Tổng quan tồn kho** (đếm theo tab, báo ô TỔNG CÒN bị lệch, dòng cần xem lại) và lịch làm mới hằng ngày.
4. **Triển khai Web app**: Triển khai → Tùy chọn triển khai mới → Ứng dụng web → Thực thi với tư cách **Tôi**, quyền truy cập **Bất kỳ ai** → chép URL `/exec`. (Sửa `Code.gs` sau này: Quản lý triển khai → Phiên bản mới.)
5. Không chia sẻ/xuất bản Sheet khách hàng ra công khai.

## Kiểm tra và xuất bản (website chỉ công khai sau khi đạt)
1. `site/config.js`: điền `API_URL` = URL `/exec`.
2. Chạy kiểm tra trên hệ thống thật:
   ```powershell
   $env:CHJ_ADMIN_KEY = "<ADMIN_KEY>"; node tools/verify.mjs
   ```
   Thử toàn bộ quy trình: kết nối, đọc được kho thật, bảng giá bị khóa khi thiếu token, form sai/bot bị chặn, lưu lead → token → mở bảng giá, không lộ người bán/giá nhập, ghi viên quan tâm, chống trùng/dồn. Dòng test (`ZZ TEST`) tự xóa. In kèm các **LƯU Ý** về sheet kho để chị sửa. Đạt hết mới tạo `.verified.json`.
3. `node tools/publish.mjs` → chép vào `docs/bang-gia-kim-cuong/` (từ chối nếu chưa kết nối/chưa kiểm tra/file đã đổi sau kiểm tra).
4. Commit và push `docs/bang-gia-kim-cuong` (GitHub Pages thư mục `/docs`). Link gửi khách: `https://<tài-khoản>.github.io/<repo>/bang-gia-kim-cuong/`.
5. Mở link thật bằng điện thoại, tự điền thử một lần, rồi xóa dòng thử trong tab Khách hàng.
