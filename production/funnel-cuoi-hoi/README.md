# FUNNEL CƯỚI HỎI → NHẪN KIM CƯƠNG CHJ DIAMOND

Phễu thông tin tiếng Việt, tái sử dụng khung từ 2 bộ PLR trong `raw/CƯỚI HỎI/`, Việt hóa và đấu nối vào sản phẩm nhẫn kim cương của CHJ Diamond.

## Sơ đồ phễu

```
Quảng cáo / bài viết  →  Squeeze page  →  Tải cẩm nang (email)  →  Chuỗi 7 email  →  Tư vấn / mua nhẫn CHJ
   (traffic)              (bắt lead)        (lead magnet)          (nuôi dưỡng)         (chốt)
```

## Cấu trúc thư mục

| Thư mục | Nội dung | Trạng thái |
|---|---|---|
| `01-lead-magnet/cam-nang-chon-nhan-cau-hon.md` | Nội dung nguồn cẩm nang | XONG |
| `01-lead-magnet/CAM-NANG-CHON-NHAN-CAU-HON-CHJ.pdf` | **File PDF hoàn chỉnh có bìa** (để tặng khách) | XONG — 4 trang, sẵn sàng gửi |
| `01-lead-magnet/build_pdf.py` | Script tạo lại PDF khi sửa nội dung | XONG |
| `02-squeeze-page/index.html` | Trang bắt lead, **logo + bìa nhúng sẵn (self-contained)** | XONG — chỉ cần nối form |
| `03-email-series/chuoi-email-autoresponder.md` | 7 email nuôi dưỡng | XONG — chỉ cần thay link thật |

## Đã hoàn thành tự động (không cần chị làm)

- [x] Viết nội dung cẩm nang (7 điều) + xuất **PDF có bìa thương hiệu**, chữ CHJ DIAMOND màu GOLD, bảng đẹp.
- [x] Ảnh bìa ebook — dùng chính trang bìa PDF, **nhúng base64** vào squeeze page (hiện ở mọi nơi).
- [x] Logo CHJ nhúng base64 vào squeeze page.
- [x] Squeeze page gói thành **1 file HTML tự chứa** — copy đi đâu cũng chạy.
- [x] Chuỗi 7 email viết xong, đúng brand voice (không emoji, biến `{full_name}`).

## Còn lại — CẦN CHỊ (vì phải đăng nhập tài khoản / có link thật)

1. **Dựng squeeze page lên Pancake** — mở `02-squeeze-page/index.html`, copy toàn bộ, dán vào trang landing Pancake. Nối `form action` (hiện để `#`) tới nơi thu lead của chị. GA4/Clarity/Pixel đã cài sẵn.
2. **Đưa file PDF lên nơi lưu trữ** (Google Drive/Pancake) để lấy link tải → dán vào email thay `[LINK TẢI CẨM NANG]`.
3. **Điền link đặt lịch tư vấn / số điện thoại / link nhắn tin** vào Email 7 (chỗ `[LINK / SỐ ĐIỆN THOẠI / NHẮN TIN]`).
4. **Nạp 7 email vào autoresponder** — lịch gửi: ngay → +1 → +2 → +2 → +2 → +3 → +3 ngày.

## Kéo traffic về squeeze page — `04-traffic-content/` (XONG)

Lưu ý: 20 bài PLR trong bộ 001 là về **chụp ảnh cưới** — sai ngách, KHÔNG dùng. Repo đã có sẵn 22+ bài blog kim cương (`blogs/`, `content/blog/`). Việc "làm chuẩn" là nối cụm blog đó vào phễu:

- `04-traffic-content/facebook-posts.md` — **7 bài Facebook** kéo traffic (mỗi bài 1 miếng giá trị + CTA tải cẩm nang). Thay `[LINK SQUEEZE PAGE]`.
- `04-traffic-content/blog-cta-leadmagnet.md` — khối CTA chuẩn (bản dài/ngắn) để tái sử dụng.
- **Đã chèn** khối CTA "Tải cẩm nang miễn phí" vào cuối **23 bài** `blogs/*.md` (trên mục "Bài viết liên quan"). Chỉ còn thay `[LINK SQUEEZE PAGE]` bằng URL thật khi dựng xong Pancake.

## Sửa lại PDF khi cần

Sửa nội dung trong `cam-nang-chon-nhan-cau-hon.md`, rồi chạy:
```
cd production/funnel-cuoi-hoi/01-lead-magnet && python build_pdf.py
```
PDF sẽ được tạo lại với bìa và brand giữ nguyên.

## Quy tắc thương hiệu (bắt buộc)

- Chữ **CHJ DIAMOND** luôn màu **GOLD `#C9A84C`** — không trắng, không màu khác.
- Brand line: `chunghieudiamond.com | CHJ DIAMOND` — cũng GOLD.
- **Không dùng emoji** trong email/tin nhắn gửi khách.
- Cá nhân hóa tên khách bằng `{full_name}` (ngoặc nhọn).

## Nguồn gốc

Tái sử dụng khung từ:
- `raw/CƯỚI HỎI/cuoi-hoi/001_wedding_photography.zip` (khung funnel đầy đủ)
- `raw/CƯỚI HỎI/cuoi-hoi/002_budget_wedding_planning.zip` (squeeze + report + email series)

Lưu ý: nội dung gốc là PLR tiếng Anh về chụp ảnh cưới / kế hoạch cưới. Phễu này **không dịch nguyên văn** mà chỉ mượn cấu trúc, viết mới toàn bộ nội dung cho nghề kim cương CHJ.
