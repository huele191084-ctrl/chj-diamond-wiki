---
title: Landing Pages CHJ — Tổng Quan
type: concept
tags:
  - landing-page
  - pancake
  - marketing
  - lead-capture
  - chuyen-doi
sources:
  - bang-gia-kim-cuong-gia-36-72-ly.pke
  - bang-gia-kim-cuong-theo-size.pke
  - kien-thuc-and-sach-03.pke
  - nhan-36-li.pke
  - hop-dung-trang-suc-cao-cap.pke
created: 2026-05-05
updated: 2026-05-05
aliases:
---

# Landing Pages CHJ — Tổng Quan

[[chj-diamond]] sử dụng **Pancake.vn** để xây dựng landing pages. File định dạng `.pke` = Base64 encode của MessagePack binary — có thể decode để đọc/chỉnh sửa cấu trúc trang.

---

## Bộ 5 Landing Pages

| Trang | Mục tiêu | Loại |
|-------|----------|------|
| [[source-lp-bang-gia-gia-36-72-ly\|Bảng Giá GIA 3.6–7.2 LY]] | Lead capture → gửi bảng giá qua email | Lead magnet |
| [[source-lp-bang-gia-theo-size\|Bảng Giá Theo Size]] | Lead capture → gửi bảng giá (đầy đủ hơn, đến 8.1 LY) | Lead magnet |
| [[source-lp-kien-thuc-sach\|Kiến Thức & Sách]] | Lead capture → gửi ebook kiến thức mua kim cương | Content marketing |
| [[source-lp-nhan-36-li\|Nhẫn 3.6 LI]] | Bán hàng trực tiếp — nhẫn kim cương vàng trắng 14K | Product page |
| [[source-lp-hop-dung-trang-suc\|Hộp Đựng Trang Sức]] | Bán hàng trực tiếp — hộp quà + nhẫn vàng 999 | Product page |

---

## Cấu trúc kỹ thuật chung

```
.pke file
└── Base64 decode
    └── MessagePack decode
        └── source{}
            ├── settings{}  — title, tracking codes (FB/TikTok), thumbnail
            ├── popup{}     — popup lead form (Default_Popup)
            ├── page[]      — mảng section → group → element
            └── options{}   — versionID (UUID), currency: VND
```

**Element types có trong các trang:**
`section` · `group` · `text-block` · `button` · `form` · `input` · `checkbox-group` · `radio` · `image-block` · `video` · `rectangle` · `line`

---

## Form Lead Capture — Chuẩn CHJ

**Fields phổ biến nhất (3/5 trang):**
1. Họ và tên (`full_name`)
2. Email (`email`) — với regex validate
3. Số điện thoại (`phone_number`) — với validate SĐT VN

**Form bán hàng** (nhan-36-li, hop-dung) thêm: địa chỉ, số lượng, màu sắc.

---

## Giá trị Anchor (nhất quán trên tất cả trang)

| Thông tin | Giá trị |
|-----------|---------|
| SĐT | **0868.785.394** |
| Email | chunghieudiamond@gmail.com |
| Địa chỉ | KĐT Paml Manor, LK25/05 Khu Thuận Quý, Phường Việt Trì, Tỉnh Phú Thọ |
| Pháp nhân | CÔNG TY TNHH CHUNG HIẾU JEWELRY |

---

## Tracking Tích Hợp

- **Facebook Pixel:** `CompleteRegistration` event với giá trị 10.000 VND
- **TikTok Pixel:** Conversion event tương tự

---

## Sizes Kim Cương Được Đề Cập

| Size | Trang 3.6–7.2 | Trang Theo Size |
|------|:---:|:---:|
| 3.6 LY | ✓ | ✓ |
| 4.0 LY | ✓ | ✓ |
| 4.5 LY | ✓ | ✓ |
| 5.0 LY | ✓ | ✓ |
| 5.4 LY | ✓ | ✓ |
| 6.0 LY | ✓ | ✓ |
| 6.3 LY | ✓ | ✓ |
| 7.0 LY | ✓ | ✓ |
| 7.2 LY | ✓ | ✓ |
| 8.0 LY |   | ✓ |
| 8.1 LY |   | ✓ |

---

## Liên kết wiki

- [[chj-diamond]] — thương hiệu CHJ
- [[bang-gia-kim-cuong-gia]] — bảng giá chi tiết từ Excel tồn kho
- [[tu-duy-co-van-ban-nhan]] — tư duy cố vấn liên quan đến nội dung ebook
