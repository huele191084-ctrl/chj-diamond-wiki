# Hướng dẫn cho chị Huế: đưa link bảng giá kim cương lên để gửi khách

Làm lần lượt từng ô. Xong ô nào chị đánh dấu [x]. Khoảng 20 phút, chỉ làm một lần.

## Phần A. Việc chị làm trên Google (không cần biết code)

- [ ] **A1. Kiểm tra sheet kho** (nhờ nhân viên cùng xem): mở sheet "CÁC VIÊN KIM CƯƠNG GIA CÓ SẴN TẠI CHJ".
  - Viên PEAR 6,6LI: điền mã GIA vào cột THÔNG SỐ (chưa có mã thì viên này không lên web).
  - Ô "TỔNG CÒN" các tab 4.5LY, 4.6–4.9LY, 5LY, K PHẢI TRÒN đang ghi sai số: sửa lại cho đúng.
  - Hỏi nhân viên "gắn vỏ nhẫn" (tab 4LY) và "VIÊN SX 2020" (tab 4.5LY) là gì. Nếu viên đã bán thì ghi tên người bán vào cột NGƯỜI BÁN.
  - Quy tắc dễ nhớ: **viên đã bán thì ghi tên người bán, web tự ẩn viên đó.**
- [ ] **A2. Tạo Sheet quản lý khách**: vào sheets.google.com → bấm dấu + (bảng tính trống) → đặt tên **CHJ – Khách hàng**.
- [ ] **A3. Dán chương trình**: trong Sheet vừa tạo, menu **Tiện ích mở rộng → Apps Script**. Xóa hết chữ có sẵn, mở file `apps-script/Code.gs` (cùng thư mục này), chép toàn bộ rồi dán vào, bấm biểu tượng lưu.
- [ ] **A4. Chạy cài đặt**: ở thanh công cụ chọn hàm **setup** → bấm **Chạy** → làm theo hướng dẫn cấp quyền (Nâng cao → Đi tới dự án → Cho phép). Mở **Nhật ký thực thi** phải thấy dòng "Đọc được kho: 19 viên đang bán". Chép dòng **ADMIN_KEY = …** gửi riêng cho em (đây là chìa khóa kiểm tra, không đưa cho ai khác).
  - Nếu báo lỗi không mở được sheet kho: nghĩa là tài khoản Google chị đang dùng chưa có quyền xem sheet kho. Chị đổi sang đúng tài khoản được chia sẻ sheet.
- [ ] **A5. Mở cho website gọi**: **Triển khai → Tùy chọn triển khai mới →** loại **Ứng dụng web** → "Thực thi với tư cách": **Tôi** → "Ai có quyền truy cập": **Bất kỳ ai** → **Triển khai**. Chép **URL ứng dụng web** (kết thúc bằng `/exec`) gửi em.

## Phần B. Việc của em (sau khi chị gửi ADMIN_KEY và URL)

1. Điền URL vào website.
2. Chạy bài kiểm tra tự động trên hệ thống thật (19 bước: kho, form, khóa bảng giá, ẩn người bán, trùng, spam...). Chỉ khi **đạt hết** mới được đưa lên mạng.
3. Đưa lên GitHub Pages và gửi chị link.

## Phần C. Chị thử lần cuối bằng điện thoại

- [ ] Mở link, bấm "XEM BẢNG GIÁ KIM CƯƠNG GIA MIỄN PHÍ", điền thử bằng số của chị.
- [ ] Trang cảm ơn hiện bảng giá, bấm vào một viên → hiện mời vào nhóm Zalo.
- [ ] Mở tab **Khách hàng** trong Sheet: thấy dòng của chị, cột "Viên kim đã bấm tư vấn" có viên vừa bấm. Xóa dòng thử đó.
- [ ] Gửi link cho khách.

## Hằng ngày
- Bán một viên: ghi tên người bán vào cột NGƯỜI BÁN trong sheet kho. Web tự ẩn viên đó (chậm nhất vài phút).
- Xem khách mới: mở tab **Khách hàng**, cột "Trạng thái chăm sóc" chọn Mới / Đã gọi / Đang tư vấn / Hẹn xem hàng / Đã chốt, cột "Nhân viên phụ trách" nhân viên tự điền.
- Xem số liệu kho và các dòng cần sửa: tab **Tổng quan tồn kho** (menu CHJ → Làm mới).
