---
title: Thư viện Thử nghiệm (Testing Library) — VPC
type: concept
tags: [vpc, testing, thu-nghiem, experiments, mvp, kiem-tra]
sources: [THIẾT KẾ GIẢI PHÁP GIÁ TRỊ]
created: 2026-05-21
updated: 2026-05-21
---

# Thư viện Thử nghiệm (Testing Library)

> *"Thử Nghiệm: Một quy trình để phê duyệt hay bác bỏ một giải pháp giá trị hay một mô hình kinh doanh bằng những bằng chứng."*

**Thuộc Phần 3.3** của [[source-thiet-ke-giai-phap-gia-tri]].
Mục tiêu: Tạo bằng chứng thực tế để kiểm tra giả thuyết trong [[ban-do-gia-tri-vpc]] và [[ho-so-khach-hang-vpc]].

---

## Nguyên tắc Kiểm tra

### Chọn một Hỗn hợp Thử nghiệm
- Mỗi thử nghiệm có **điểm mạnh** và **điểm yếu** riêng
- Kết hợp nhiều thử nghiệm để có bằng chứng toàn diện
- Bắt đầu từ thử nghiệm **nhanh và rẻ** → tiến đến **chắc chắn nhưng tốn kém** hơn

### Yêu cầu Hành động (CTA — Call to Action)
**Định nghĩa:** Thúc đẩy một đối tượng thực hiện một hành động; sử dụng trong một thử nghiệm để kiểm tra một hay nhiều giả thuyết.

> *"Mục đích của một trang đích MVP là phê chuẩn một hay nhiều giả thuyết, chứ không phải thu thập e-mail hay dàn hàng bán, dù rằng đó là một sản phẩm phải sinh tồn từ cuộc thử nghiệm."*

**Các CTA phổ biến:**
- Mua sản phẩm / Đặt cọc
- Đăng ký e-mail
- Nhấn vào một cái nút
- Thực hiện khảo sát
- Hoàn thành bài tập nghiệm vào nơi khác

---

## Thư viện 9 Thử nghiệm chính

### 1. Theo dõi Quảng cáo (Ad Tracking)

**Là gì:** Dùng phần mềm theo dõi quảng cáo để khám phá những việc cần làm, đau đớn và lợi ích của một giải pháp giá trị mới.

**Cách dùng — Google AdWords / Facebook Ads:**
1. Chọn từ khóa đại diện cho Việc cần làm, Đau đớn, Lợi ích
2. Thiết kế nhiều mẫu quảng cáo/kiểm tra → mỗi mẫu test một giả thuyết
3. Triển khai và quan sát: click-through rate, cost per click
4. Đánh giá từng người nhấp chuột → xem họ có quan tâm không

**Ứng dụng CHJ Diamond:**
- Test nhiều message: "GIA thật" vs "thu đổi 90%" vs "tư vấn miễn phí"
- Test với từ khóa: "nhẫn cầu hôn GIA Hà Nội" vs "nhẫn kim cương giá tốt"
- Đo CPL (Cost per Lead) theo từng nhóm KH

---

### 2. Trang đích — MVP (Landing Page)

**Là gì:** Một trang web đơn nhất, mô tả một Giải pháp Giá trị mà bạn dự định sẽ thiết lập.

**Đặc điểm trang đích tốt:**
- **Lượng truy cập:** Phải được tìm thấy dễ dàng (SEO/Ads)
- **Tiêu đề:** Mô tả ngắn gọn giá trị cốt lõi
- **Giải pháp giá trị:** Trình bày rõ Sản phẩm + Thuốc giảm đau + Yếu tố tạo lợi ích
- **Yêu cầu Hành động (CTA):** Nút rõ ràng — Đăng ký / Mua ngay / Nhận báo giá
- **Bằng chứng xã hội:** Review, feedback, case study
- **Hành động Tiếp theo:** Đưa KH vào phễu (email, Zalo, tư vấn)

**Ứng dụng CHJ Diamond:**
- Landing page bảng giá GIA (đã có) — test xem KH quan tâm đến size nào
- Landing page nhẫn cầu hôn: test message "Khoảnh khắc hoàn hảo" vs "Kim cương GIA xác thực"
- Landing page nhẫn CHJ cao cấp 120M → test cho phân khúc phụ nữ doanh nhân

---

### 3. Kiểm tra So sánh A/B (A/B Testing)

**Là gì:** Giao cùng một lượng người đến nhận diện những gì đã thay đổi tốt hơn một trong các lựa chọn khác nhau của một trang hay giải pháp giá trị.

**Yếu tố có thể kiểm tra:**
- Giá (ví dụ: 29M vs 35M)
- Tiêu đề
- Màu sắc / Layout nút CTA
- Nội dung bài viết
- Ảnh sản phẩm
- Bảo hành

**Ví dụ A/B Testing CHJ:**
- Version A: CTA "Nhận tư vấn miễn phí" → 8% click
- Version B: CTA "Xem bảng giá GIA ngay" → 20% click
- → Version B tốt hơn 2.5x → dùng Version B cho tất cả trang

---

### 4. Trò chơi Cải tiến (Improvement Game)

**Là gì:** Phương pháp phát triển bởi Luke Hohmann — giúp thiết kế giải pháp giá trị tốt hơn bằng cách tận dụng thông tin ẩn (tiềm năng) từ khách hàng.

**3 trò chơi chính:**

| Trò chơi | Mục tiêu |
|---------|---------|
| **Mua một tính năng** | Hiểu tính năng nào KH thực sự muốn trả tiền |
| **Hộp sản phẩm** | Hiểu những việc cần làm, đau đớn, lợi ích quan trọng nhất |
| **Thuyền sắp chìm** | Hiểu tính năng nào KH sẵn sàng bỏ đi nếu phải chọn |

---

### 5. Mô phỏng bán hàng (Sales Simulation)

**Là gì:** Kiểm tra sự quan tâm thực sự của KH bằng cách thực hiện một màn bán hàng — mục tiêu là xem liệu KH có thực sự mua hay không.

**2 kênh:**

**Trực tuyến:**
- Đưa KH đến trang web để theo dõi thông tin của họ
- Dùng bảng "bằng chứng" để thể hiện giải pháp giá trị
- Dùng slide quan sát về lợi ích xung quanh trang web KH

**Thế giới vật chất:**
- Thực nghiệm: dẫn đến một phòng trình bày thực tế → 3 bước

**Ứng dụng CHJ:**
- Gọi điện tư vấn thực tế → đo tỷ lệ đặt cọc sau cuộc gọi
- Livestream giới thiệu nhẫn mới → đo số tin nhắn "hỏi giá"
- Đem mẫu nhẫn đến gặp trực tiếp nhóm KH tiềm năng

---

### 6. Danh mục MVP (MVP Catalogue)

**Là gì:** MVP (Minimum Viable Product) — Sản phẩm khả dụng tối thiểu. Dùng để kiểm tra giả thuyết với chi phí thấp nhất có thể.

**3 loại MVP đơn giản nhất:**

| Loại | Mô tả | Yêu cầu |
|------|-------|---------|
| **Bằng Dữ liệu** | Các đặc điểm của giải pháp giá trị được mô tả ngắn gọn | May thế |
| **Tài liệu Quảng cáo** | Bình họa giải pháp giá trị bằng cách sử dụng tài liệu quảng cáo | Máy ảnh tốt |
| **Bản Phân cảnh** | Minh họa kịch bản KH trong một loạt ảnh | Nghệ sĩ phác họa |

---

### 7. Các thử nghiệm đời thực (Real-world Experiments)

**Là gì:** Hãy yêu cầu KH tương tác với các nguyên mẫu và các bản sao đời thực có những nguyên tắc kỹ thuật, lợi.

**Ví dụ:** Lit Motors — sử dụng CTA để xác nhận sự quan tâm của KH, yêu cầu đặt cọc 250$ trước khi xe hoàn tất → nhận được 1,150 đặt cọc.

**Ứng dụng CHJ:**
- Yêu cầu KH comment "SIZE" để nhận báo giá → đo số KH quan tâm
- Nhận đặt cọc 1M cho nhẫn thiết kế riêng trước khi chế tác
- Pre-order nhẫn CHJ phiên bản giới hạn → đo nhu cầu thực

---

### 8. Hộp sản phẩm (Product Box)

**Dùng trong Trò chơi Cải tiến.** Yêu cầu KH thiết kế hộp sản phẩm đại diện cho giải pháp giá trị mà họ muốn mua nhất.

**3 bước:**
1. **Thiết kế:** Mời KH tham gia vào hội đồng và yêu cầu thiết kế một hộp sản phẩm đại diện cho giải pháp giá trị họ muốn mua
2. **Thuyết phục nhóm:** Yêu cầu KH trình bày thiết kế hộp, đóng vai nhân viên bán hàng nhiệt tình
3. **Nắm bắt:** Quan sát và ghi lại những thông điệp chính, tính năng quan trọng, lợi ích quan trọng, các yêu cầu khác

---

### 9. Minh họa, Bản Phân cảnh và Kịch bản

**Là gì:** Dùng để mô tả tầm nhìn về các giải pháp giá trị cho nhiều nhóm: nội bộ, KH, đối tác.

**3 bước:**
1. **Thiết kế mô hình giải pháp giá trị** — 1-2 trang, dễ chia sẻ
2. **Xác định các kịch bản** — trường hợp sử dụng điển hình của sản phẩm
3. **Tạo ra những hình ảnh hấp dẫn** — ảnh đẹp, cảm xúc

---

## Quy trình Kiểm tra Chuẩn

```
1. XÁC ĐỊNH giả thuyết cần kiểm tra
      ↓
2. CHỌN thử nghiệm phù hợp (từ thư viện)
      ↓
3. THIẾT KẾ thử nghiệm (CTA, KPI)
      ↓
4. CHẠY thử nghiệm
      ↓
5. ĐO LƯỜNG kết quả
      ↓
6. HỌC và QUYẾT ĐỊNH (tiếp tục / xoay / dừng)
      ↓
7. LẶP LẠI
```

---

## Bảng Tiến bộ (Progress Board)

Dùng để theo dõi toàn bộ quá trình kiểm tra:

| Câu hỏi | Nội dung |
|---------|---------|
| Tôi đã kiểm tra những gì? | Liệt kê thử nghiệm đã chạy |
| Tôi đang kiểm tra cái gì và tôi đã học được gì? | Thử nghiệm đang chạy + bài học |
| Tôi đã tiến bộ thế nào? | So sánh với mục tiêu ban đầu |

---

## Liên kết

- [[khung-giai-phap-gia-tri]] — Framework cần kiểm tra
- [[ban-do-gia-tri-vpc]] — Giả thuyết cần được kiểm tra
- [[ho-so-khach-hang-vpc]] — Hồ sơ KH cần được xác nhận
- [[phu-hop-vpc]] — Đạt Phù hợp thông qua kiểm tra
- [[landing-pages-chj]] — Landing pages CHJ đang dùng
- [[email-sequence-lead-magnet]] — Email sequence CHJ đang dùng
