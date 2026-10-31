# Website bảng giá kim cương GIA – CHJ Diamond

Trang tĩnh (xuất bản bằng GitHub Pages, như các landing cũ) + Google Apps Script làm toàn bộ phần xử lý dữ liệu. Không dùng Netlify.

```
site/            Website (index.html, app.js, config.js, images/)
apps-script/     Code.gs – backend dán vào Google Sheets
tools/           verify.mjs (kiểm tra thật) và publish.mjs (xuất bản có khóa)
docs/bang-gia-kim-cuong/   Bản công khai; CHỈ được tạo bởi publish.mjs
```

## Luồng khách hàng
Xem giá dễ hiểu → để lại thông tin (email bắt buộc) → **chuyển ngay sang trang cảm ơn `thanks.html`** → bảng giá gửi qua email và hiện sẵn trên trang → chọn viên → nhắn Zalo (tin nhắn soạn sẵn) → mua hàng.
- Email nhận bảng giá: Apps Script gửi thư HTML ngay khi lưu (tối đa 40 viên đúng kích thước khách chọn, giá thấp đến cao, kèm link kiểm tra GIA và nút về website). Kết quả ghi ở cột **Email bảng giá** của tab Khách hàng. Trang cảm ơn chỉ nói "đã gửi" khi thư thật sự gửi được; lỗi thì báo thẳng và vẫn hiện bảng giá. Một địa chỉ email chỉ nhận 1 thư mỗi 30 phút (chống lợi dụng form để gửi thư rác). Tài khoản Gmail thường gửi tối đa khoảng 100 thư/ngày, Google Workspace khoảng 1.500.
- Bảng giá KHÔNG nằm trong HTML. Chỉ Apps Script trả về khi form đã được ghi vào Sheet (kèm token ký số, hạn 24 giờ).
- Mỗi thẻ viên có nút tải ảnh PNG (1080×1350) để lưu hoặc gửi; trên điện thoại mở bảng chia sẻ.
- Không có dữ liệu mẫu: kho lấy 100% từ Google Sheet. Chưa điền `API_URL` thì web hiện thông báo chưa kết nối và không mở bảng giá.

## Thiết lập Google (làm 1 lần, khoảng 15 phút)
1. **Tạo Sheet kho**: vào Google Sheets, Tệp → Nhập → tải lên `raw/BẢNG GIÁ KIM CƯƠNG GIA - CHJ DIAMOND.xlsx`, chọn "Tạo bảng tính mới". Giữ nguyên các tab và 12 cột (STT … Giá bán).
2. **Dán script**: Tiện ích mở rộng → Apps Script → xóa mã mẫu, dán toàn bộ `apps-script/Code.gs`, lưu.
3. **Chạy `setup()`**: chọn hàm `setup` → Chạy → cấp quyền (Nâng cao → Đi tới dự án). Xem **Nhật ký thực thi**, chép `ADMIN_KEY` cất riêng (chỉ để chạy kiểm tra, không dán lên web). Lần đầu chạy sẽ hỏi quyền gửi email (MailApp); nếu sau này cập nhật `Code.gs`, chạy lại `setup()` để cấp quyền mới. `setup()` tạo tab **Khách hàng**, tab **Tổng quan tồn kho**, thêm 3 cột kho (Trạng thái, Giữ đến, Ghi chú nội bộ) và lịch làm mới hằng ngày.
4. **Làm sạch kho**: tải lại Sheet → menu **CHJ → Ẩn các dòng kho bị trùng**. (File Excel hiện tại có nhiều khối bảng lặp lại cùng một viên; web luôn chỉ hiện mỗi viên một lần, và bước kiểm tra sẽ không đạt cho đến khi hết trùng. Dòng trùng nhưng khác giá được giữ lại để chị quyết định.) Xem tab *Tổng quan tồn kho* để chắc số liệu đúng.
5. **Triển khai Web app**: Triển khai → Tùy chọn triển khai mới → loại *Ứng dụng web* → Thực thi với tư cách **Tôi**, Quyền truy cập **Bất kỳ ai** → Triển khai → chép URL kết thúc bằng `/exec`.
6. **Link trong email (tuỳ chọn)**: sau khi có link website, vào Cài đặt dự án → Thuộc tính tập lệnh → thêm `SITE_URL` = link trang chủ để thư có nút "Xem đầy đủ bảng giá".
7. **Quyền riêng tư**: không chia sẻ/xuất bản Sheet ra công khai; chỉ cấp quyền cho nhân viên CHJ. Web truy cập qua Apps Script nên không cần mở Sheet. Mỗi lần sửa `Code.gs` phải *Triển khai → Quản lý triển khai → Phiên bản mới*.

## Kiểm soát tồn kho (trong Sheet)
Cột **Trạng thái** của mỗi viên:
| Giá trị | Trên web |
|---|---|
| (trống) / Còn hàng | Hiện bình thường |
| Đang giữ (+ cột Giữ đến) | Hiện nhãn "Đang có khách giữ"; quá ngày Giữ đến tự thành Còn hàng |
| Đã bán, Ẩn | Không hiện |

Khi bán/giữ một viên chỉ cần đổi cột Trạng thái; web cập nhật ngay ở lần tải bảng giá kế tiếp. Tab *Tổng quan tồn kho* đếm theo trạng thái và liệt kê dòng trùng/thiếu dữ liệu.

## Quản lý khách hàng
Tab **Khách hàng**: thời gian, họ tên, SĐT, email, kích thước, ngân sách, mục đích, viên đã bấm tư vấn, nguồn/UTM, trạng thái chăm sóc (danh sách chọn), nhân viên phụ trách. Cùng SĐT thì cập nhật dòng cũ. Chống spam: ô ẩn cho bot, kiểm tra dữ liệu ở server, chặn gửi dồn cùng số, trần số lượt toàn hệ thống mỗi 10 phút. Web không bao giờ ghi đè hai cột Trạng thái chăm sóc và Nhân viên phụ trách.

## Kiểm tra và xuất bản (website chỉ công khai sau khi đạt)
1. Mở `site/config.js`, điền `API_URL` = URL `/exec`.
2. Chạy kiểm tra trên hệ thống thật (PowerShell):
   ```powershell
   $env:CHJ_ADMIN_KEY = "<ADMIN_KEY>"; $env:CHJ_TEST_EMAIL = "<email của chị>"; node tools/verify.mjs
   ```
   Công cụ gửi 1 thư thử tới email của chị và thử toàn bộ quy trình: kết nối, kho có viên thật và không trùng, bảng giá bị khóa khi thiếu token, form sai/bot bị chặn, thiếu email thì bị từ chối, lưu lead → thư gửi đi → nhận token → mở bảng giá, ghi viên quan tâm, chống trùng/dồn. Dòng test (tên bắt đầu `ZZ TEST`) được tự xóa. Đạt hết mới tạo `.verified.json`.
3. Xuất bản: `node tools/publish.mjs` – từ chối nếu chưa kết nối, chưa kiểm tra, hoặc file trong `site/` đã đổi sau lần kiểm tra. Đạt thì chép vào `docs/bang-gia-kim-cuong/`.
4. Commit và push `docs/bang-gia-kim-cuong` lên GitHub (bật Pages từ thư mục `/docs`). Link: `https://<tài-khoản>.github.io/<repo>/bang-gia-kim-cuong/`.
5. Mở link thật bằng điện thoại, tự điền một lần bằng số của chị để thử, rồi xóa dòng thử trong tab Khách hàng.
