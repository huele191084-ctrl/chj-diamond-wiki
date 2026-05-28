# Schema Wiki — NÃO CỦA HUẾ 1

Đây là tài liệu cấu hình cho LLM (Claude Code). Nó định nghĩa cấu trúc wiki, quy ước, và các quy trình làm việc cần tuân theo.

---

## Cấu trúc thư mục

```
raw/          ← Tài liệu nguồn gốc (BẤT BIẾN — chỉ đọc, không bao giờ sửa)
  assets/     ← Ảnh và tệp đính kèm tải về từ bài viết
wiki/         ← Các trang wiki do LLM tạo và duy trì
  index.md    ← Danh mục toàn bộ wiki (LLM cập nhật mỗi lần ingest)
  log.md      ← Nhật ký thời gian (append-only)
CLAUDE.md     ← File schema này (bạn và LLM cùng phát triển)
```

---

## Quy ước trang wiki

### Tên file
- Dùng dấu gạch nối thay khoảng trắng: `ho-chi-minh.md`, `chien-tranh-viet-nam.md`
- Tên file = slug của tiêu đề trang
- Tiếng Việt có dấu được chấp nhận trong tiêu đề, nhưng slug dùng không dấu

### Frontmatter YAML (bắt buộc cho mọi trang wiki)
```yaml
---
title: Tiêu đề trang
type: entity | concept | source | comparison | analysis | overview
tags: [tag1, tag2]
sources: [ten-file-nguon.md]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

### Các loại trang (`type`)
- `entity` — Trang về một người, tổ chức, địa điểm cụ thể
- `concept` — Trang về một khái niệm, chủ đề, ý tưởng
- `source` — Tóm tắt một tài liệu nguồn cụ thể
- `comparison` — So sánh nhiều thực thể hoặc khái niệm
- `analysis` — Phân tích sâu, phát sinh từ query
- `overview` — Tổng quan toàn bộ lĩnh vực (thường chỉ có 1 trang)

### Liên kết nội bộ
- Dùng cú pháp Obsidian: `[[ten-trang]]` hoặc `[[ten-trang|Nhãn hiển thị]]`
- Luôn tạo liên kết khi đề cập đến thực thể/khái niệm đã có trang riêng
- Khi tạo trang mới, kiểm tra `index.md` để tìm các trang hiện có cần liên kết tới

---

## Quy trình: Ingest (Nạp nguồn mới)

Khi người dùng yêu cầu nạp một tài liệu nguồn mới:

1. **Đọc tài liệu** trong `raw/` (và xem ảnh nếu có)
2. **Thảo luận** các điểm chính với người dùng nếu cần
3. **Tạo trang source** trong `wiki/` với tóm tắt, các điểm chính, trích dẫn quan trọng
4. **Cập nhật các trang liên quan** — entity và concept pages liên quan đến tài liệu này
5. **Cập nhật `wiki/index.md`** — thêm trang source mới và các trang đã cập nhật
6. **Ghi vào `wiki/log.md`** — entry với định dạng `## [YYYY-MM-DD] ingest | Tên tài liệu`

Một lần ingest thường chạm tới 5–15 trang wiki.

---

## Quy trình: Query (Trả lời câu hỏi)

Khi người dùng đặt câu hỏi:

1. **Đọc `wiki/index.md`** để tìm các trang liên quan
2. **Đọc các trang liên quan** trong `wiki/`
3. **Tổng hợp câu trả lời** với trích dẫn rõ ràng (link tới trang wiki)
4. **Lưu câu trả lời có giá trị** — nếu phân tích hoặc so sánh đáng giữ lại, tạo trang `analysis` hoặc `comparison` mới trong wiki và ghi log

---

## Quy trình: Lint (Kiểm tra sức khỏe wiki)

Định kỳ hoặc khi người dùng yêu cầu:

1. Đọc `wiki/index.md` để có danh sách toàn bộ trang
2. Kiểm tra từng vấn đề:
   - **Mâu thuẫn** — trang A và trang B nói khác nhau về cùng một sự kiện
   - **Thông tin lỗi thời** — nguồn mới đã bác bỏ khẳng định cũ
   - **Trang mồ côi** — trang không có trang nào liên kết tới
   - **Khái niệm thiếu trang** — được đề cập nhiều nhưng chưa có trang riêng
   - **Liên kết thiếu** — hai trang liên quan nhưng chưa liên kết nhau
3. Báo cáo danh sách vấn đề và đề xuất hành động
4. Ghi vào log: `## [YYYY-MM-DD] lint | Kết quả`

---

## Ghi chú quan trọng

- `raw/` là nguồn sự thật — **không bao giờ sửa đổi** tệp trong đó
- `wiki/` thuộc về LLM — LLM tạo, cập nhật, duy trì toàn bộ
- Khi không chắc về cấu trúc hoặc quy ước, hỏi người dùng và cập nhật file này
- File này cần được đọc đầu tiên trong mỗi phiên làm việc mới
