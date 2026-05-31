# -*- coding: utf-8 -*-
# Xóa và tạo lại 21 email với video links + landing page
import urllib.request, json

API_KEY = "jws743opqynugsj786mrojhfm58yna22"
CAMPAIGN_ID = "CsodV"
FROM_FIELD_ID = "q7OXH"
LANDING = "https://huele191084-ctrl.github.io/chj-diamond-wiki/nhan-kim-cuong.html"
YT = "https://youtube.com/watch?v="
YT_CH = "https://www.youtube.com/@ChungHieuJewelry"
TT = "https://www.tiktok.com/@chunghieujewelry"
FB = "https://www.facebook.com/chunghieudiamond"
ZALO = "https://zalo.me/0912268667"

# IDs cần xóa (tạo từ script trước)
OLD_IDS = ['5LNzN','5LNQP','5LNMV','5LN53','5LNZr','5LNiv','5LNfF',
           '5LNu4','5LNO0','5LNF5','5LNGb','5LNC7','5LNIy','5LN9x',
           '5LNwL','5LNlE','5LNtw','5LN2o','5LN01','5LNJO','5LNxn']

SOCIAL_BLOCK = f"""
📱 Theo dõi CHJ Diamond:
▶ YouTube: {YT_CH}
🎵 TikTok: {TT}
📘 Facebook: {FB}"""

EMAILS = [
    {
        "day": 1,
        "name": "NGAY 1 - CAM NANG",
        "subject": "❌ 80% người mua kim cương mắc sai lầm này — bạn có đang mắc không?",
        "plain": f"""Chào [[name]],

Hôm qua bạn nhận được cẩm nang rồi — hôm nay Huế muốn kể cho bạn nghe câu chuyện thật.

Một chị khách nhắn Huế: "Em mua nhẫn ở chỗ khác, họ nói nước D, sạch VVS, nhưng sao nhìn không sáng?"

Huế hỏi: "Chị có giấy GIA không?" → Im lặng.

Đó là sai lầm số 1: mua kim cương không có giấy GIA.

Không có GIA = không có bằng chứng = bạn đang tin vào lời người bán.

Ngày mai Huế sẽ giải thích tại sao 4C quan trọng hơn bạn nghĩ.

▶ Xem ngay: 5 Sai Lầm Phổ Biến Khi Mua Nhẫn Cầu Hôn
{YT}oT7t5Z7H9vY

— Kim Huế
chunghieudiamond.com | Zalo: 0912.268.667"""
    },
    {
        "day": 2,
        "name": "NGAY 2 - CAM NANG",
        "subject": "4C kim cương — nghe nhiều nhưng thật ra chỉ cần nhớ 1 điều này",
        "plain": f"""Chào [[name]],

Cut. Color. Clarity. Carat.

Bạn đã nghe 4C rồi. Nhưng nếu Huế chỉ được nói 1 điều: Cut (giác cắt) quan trọng hơn tất cả.

Một viên D màu VVS nhưng cut kém → tối và chết.
Một viên G màu VS2 nhưng cut Excellent → sáng rực, ai cũng khen.

Bí quyết tiết kiệm 30% mà vẫn đẹp hơn:
- Cut: Excellent (không thương lượng)
- Color: G hoặc H
- Clarity: VS2 hoặc SI1
- Carat: điều chỉnh theo ngân sách còn lại

▶ Xem ngay: Chọn Nhẫn Cầu Hôn Đẹp, Tối Ưu Ngân Sách
{YT}XTzpDKmaEec

— Kim Huế
chunghieudiamond.com | Zalo: 0912.268.667"""
    },
    {
        "day": 3,
        "name": "NGAY 3 - CAM NANG",
        "subject": "Huế chia sẻ bạn 1 kỹ năng quan trọng — kiểm tra GIA thật/giả trong 30 giây",
        "plain": f"""Chào [[name]],

Hôm nay Huế muốn chia sẻ với bạn 1 kỹ năng quan trọng: kiểm tra GIA ngay tại chỗ — trước khi trả tiền.

Vào gia.edu/report-check → nhập số report trên giấy → thông tin phải khớp 100%.

Nếu người bán nói "hệ thống đang lỗi" hoặc "để về nhà kiểm tra" → đó là dấu hiệu đỏ.

Kỹ năng này mất 30 giây — nhưng có thể giúp bạn tránh mất vài chục triệu đồng.

▶ Xem ngay: 5 Bước Chọn Nhẫn Cầu Hôn Hoàn Hảo Từ Chuyên Gia
{YT}Bc45uvcoPFg

— Kim Huế
chunghieudiamond.com | Zalo: 0912.268.667"""
    },
    {
        "day": 4,
        "name": "NGAY 4 - CAM NANG",
        "subject": "Fluorescence là gì? Tại sao có viên kim cương rẻ hơn 15% mà vẫn đẹp hơn",
        "plain": f"""Chào [[name]],

Ít người biết điều này: Fluorescence (huỳnh quang) có thể là lợi thế nếu dùng đúng.

Viên G-H + Fluorescence Medium → trông trắng hơn dưới ánh đèn tự nhiên → giá rẻ hơn 10-15%.

Nhưng viên D-F + Strong Fluorescence → đôi khi trông "sữa" → nên tránh.

Kiến thức nhỏ này có thể giúp bạn tiết kiệm vài triệu đồng cho cùng một vẻ đẹp.

▶ Xem ngay: 3 Mẹo Mua Kim Cương Tiết Kiệm
{YT}4MWWQMcwYg0

— Kim Huế
chunghieudiamond.com | Zalo: 0912.268.667"""
    },
    {
        "day": 5,
        "name": "NGAY 5 - CAM NANG",
        "subject": "Huế bắt đầu từ tiệm bạc nhỏ năm 2006 — câu chuyện Huế chưa kể công khai",
        "plain": f"""Chào [[name]],

Năm 2006, Huế bắt đầu kinh doanh trang sức. Lúc đó tiệm chỉ có trang sức bạc — nhỏ thôi, nhưng Huế yêu nghề từ hồi đó.

Dần dần, Huế chuyển lên vàng, rồi bén duyên với kim cương — không phải vì kinh doanh mà vì mê vẻ đẹp và năng lượng của kim.

Hồi đầu dùng viên nhỏ 4-5 ly, chưa biết GIA. Cứ thấy lấp lánh là thích. Nhưng qua năm tháng, Huế phát hiện: không phải viên kim nào cũng đẹp như nhau. Kim cương cần được chọn đúng mới mang lại cảm xúc và năng lượng thật sự.

Đó là lý do Huế tặng miễn phí cẩm nang này cho bạn.

▶ Xem ngay: Vì Sao Kim Cương Là Biểu Tượng Vĩnh Cửu Của Tình Yêu
{YT}eQnjm8TlecI
{SOCIAL_BLOCK}

— Kim Huế, Chung Hiếu Jewelry"""
    },
    {
        "day": 6,
        "name": "NGAY 6 - CAM NANG",
        "subject": "\"Em không ngờ cùng ngân sách lại chọn được viên đẹp như vậy…\"",
        "plain": f"""Chào [[name]],

Chị Lan (Hà Nội) nhắn Huế sau khi mua nhẫn cầu hôn:

"Lúc đầu em chỉ có 15 triệu, sợ không đủ mua viên đẹp. Sau khi đọc cẩm nang và tư vấn với chị Huế, em chọn được viên G-VS2-Excellent, đẹp hơn cả viên D mà bạn em mua gấp đôi tiền."

Đây không phải may mắn — đây là kiến thức.

▶ Xem ngay: Nhẫn Kim Cương Đẹp Với Ngân Sách Vừa Phải
{YT}I7zEMrpvBps

— Kim Huế
chunghieudiamond.com | Zalo: 0912.268.667"""
    },
    {
        "day": 7,
        "name": "NGAY 7 - CAM NANG",
        "subject": "Đo size nhẫn tại nhà chuẩn xác — đừng để bị chỉnh đi chỉnh lại",
        "plain": f"""Chào [[name]],

Mẹo nhỏ nhưng quan trọng: đo size vào buổi chiều, không phải buổi sáng.

Cách đo: quấn sợi chỉ quanh ngón áp út → đo chiều dài → chia cho 3.14 = đường kính (mm).

Size 6 = 16.5mm | Size 7 = 17.3mm | Size 8 = 18.2mm

Nếu không chắc → chọn size to hơn — dễ chỉnh nhỏ lại hơn chỉnh to ra.

▶ Xem ngay: Điều Quan Trọng Khi Chọn Nhẫn Cầu Hôn
{YT}E-zAFJwF7PY

— Kim Huế
chunghieudiamond.com | Zalo: 0912.268.667"""
    },
    {
        "day": 8,
        "name": "NGAY 8 - CAM NANG",
        "subject": "Điều gì xảy ra khi bạn vào cửa hàng mà không chuẩn bị gì?",
        "plain": f"""Chào [[name]],

Người bán hàng giỏi biết ngay khi bạn chưa có kiến thức. Và họ có thể — không phải cố ý — dẫn bạn đến viên kim cương phù hợp với hoa hồng của họ, không phải túi tiền của bạn.

10 câu hỏi trong cẩm nang chính là "giáp" của bạn. Hỏi đúng → người bán biết bạn am hiểu → tự nhiên tư vấn thật hơn.

▶ Xem ngay: 3 Bí Quyết Mua Nhẫn Kim Cương Từ Chuyên Gia
{YT}qC_7objN0k8

💍 Xem bộ sưu tập nhẫn kim cương CHJ:
{LANDING}

— Kim Huế
chunghieudiamond.com | Zalo: 0912.268.667"""
    },
    {
        "day": 9,
        "name": "NGAY 9 - CAM NANG",
        "subject": "3 câu hỏi Huế hay nhận nhất — trả lời thẳng",
        "plain": f"""Chào [[name]],

Câu 1: "Kim cương lab có nên mua không?"
→ Đẹp như tự nhiên, giá rẻ hơn 50-70%, nhưng giá trị lưu giữ thấp hơn.

Câu 2: "Mua online có tin được không?"
→ Được, nếu có GIA và chính sách đổi trả rõ ràng.

Câu 3: "Ngân sách bao nhiêu là đủ cho nhẫn cầu hôn?"
→ Không có con số đúng. Quan trọng là viên đó ý nghĩa với hai người.

Bạn còn câu hỏi nào khác? Reply email này, Huế đọc và trả lời hết.

▶ Xem ngay: 5 Sự Thật Về Trang Sức Kim Cương
{YT}1dyLovDLd3w

💍 Xem bộ sưu tập nhẫn kim cương CHJ:
{LANDING}

— Kim Huế
chunghieudiamond.com | Zalo: 0912.268.667"""
    },
    {
        "day": 10,
        "name": "NGAY 10 - CAM NANG",
        "subject": "Anh Minh cầu hôn thành công — câu chuyện khiến Huế nhớ mãi",
        "plain": f"""Chào [[name]],

Anh Minh (TP.HCM) nhắn Huế lúc 11 giờ đêm: "Chị ơi em cầu hôn xong rồi, cô ấy khóc và nói đây là chiếc nhẫn đẹp nhất cô ấy từng thấy."

Ngân sách 20 triệu. Viên 0.5ct, G, VS1, Excellent. Đơn giản nhưng sáng.

Không phải viên đắt nhất — nhưng là viên đúng nhất.

▶ Xem ngay: Hướng Dẫn Chọn Nhẫn Cầu Hôn Hoàn Hảo
{YT}mV6vXTkzRJg

💍 Xem bộ sưu tập nhẫn kim cương CHJ:
{LANDING}
{SOCIAL_BLOCK}

— Kim Huế
chunghieudiamond.com | Zalo: 0912.268.667"""
    },
    {
        "day": 11,
        "name": "NGAY 11 - CAM NANG",
        "subject": "Tại sao cùng 1 carat nhưng viên này sáng gấp đôi viên kia?",
        "plain": f"""Chào [[name]],

Câu trả lời: Cut.

Một viên cut Excellent phản chiếu ánh sáng gần như hoàn hảo. Một viên cut Good hay Fair "rò rỉ" ánh sáng ra đáy — mắt thường thấy viên tối, kém rực rỡ.

Khi bạn nhìn vào viên kim cương và thấy "không sáng lắm" — 90% là do cut.

Luôn chọn Excellent. Không thương lượng.

▶ Xem ngay: Cách Chọn Kim Cương ĐÚNG Cho Nhẫn Cầu Hôn
{YT}g6vOEZPZI-o

💍 Xem bộ sưu tập nhẫn kim cương CHJ:
{LANDING}

— Kim Huế
chunghieudiamond.com | Zalo: 0912.268.667"""
    },
    {
        "day": 12,
        "name": "NGAY 12 - CAM NANG",
        "subject": "Khi nào là thời điểm đúng để cầu hôn? (Huế nghĩ khác nhiều người)",
        "plain": f"""Chào [[name]],

Nhiều người hỏi Huế: "Bao giờ thì nên cầu hôn?"

Huế nghĩ: khi bạn sẵn sàng cam kết — không phải khi có đủ tiền mua viên kim cương to nhất.

Viên kim cương là biểu tượng của cam kết. Nó không cần hoàn hảo về kích thước — cần hoàn hảo về ý nghĩa.

Cô ấy sẽ nhớ khoảnh khắc bạn quỳ xuống — không phải carat của viên đá.

▶ Xem ngay: Vì Sao Kim Cương Là Biểu Tượng Vĩnh Cửu Của Tình Yêu
{YT}eQnjm8TlecI

💍 Xem bộ sưu tập nhẫn kim cương CHJ:
{LANDING}

— Kim Huế
chunghieudiamond.com | Zalo: 0912.268.667"""
    },
    {
        "day": 13,
        "name": "NGAY 13 - CAM NANG",
        "subject": "CHJ Diamond cam kết điều gì với bạn?",
        "plain": f"""Chào [[name]],

Huế muốn nói thẳng:

✅ 100% kim cương có giấy GIA — kiểm tra online ngay tại cửa hàng
✅ Giá niêm yết minh bạch
✅ Bảo hành trọn đời phần kim loại
✅ Chỉnh size miễn phí
✅ Đổi trả trong 7 ngày nếu không hài lòng

Đây không phải cam kết marketing. Đây là cách Huế làm việc suốt gần 20 năm qua.

▶ Xem ngay: Sự Thật Quan Trọng Về Kim Cương
{YT}sGvMgDGEbU8

💍 Xem bộ sưu tập nhẫn kim cương CHJ:
{LANDING}

— Kim Huế
chunghieudiamond.com | Zalo: 0912.268.667"""
    },
    {
        "day": 14,
        "name": "NGAY 14 - CAM NANG",
        "subject": "Bạn đã đọc cẩm nang chưa? Phần nào bạn thấy hữu ích nhất?",
        "plain": f"""Chào [[name]],

Huế tò mò — bạn đã đọc hết cẩm nang chưa?

Phần nào bạn thấy hữu ích nhất? Reply email này cho Huế biết nhé.

Nếu bạn có câu hỏi gì về kim cương — dù nhỏ đến đâu — cứ hỏi thẳng. Huế ở đây để giúp, không phải để bán.

▶ Xem ngay: 3 Cách Chọn Nhẫn Kim Cương Đẹp Sang Giá Tốt
{YT}mj2Y6V_kYW8

💍 Xem bộ sưu tập nhẫn kim cương CHJ:
{LANDING}

— Kim Huế
chunghieudiamond.com | Zalo: 0912.268.667"""
    },
    {
        "day": 15,
        "name": "NGAY 15 - CAM NANG",
        "subject": "Bạn đang ở giai đoạn nào của hành trình mua kim cương?",
        "plain": f"""Chào [[name]],

Huế nhận thấy khách hàng thường ở 1 trong 3 giai đoạn:

Giai đoạn 1 — Tìm hiểu: Chưa chắc mua, đang học hỏi
Giai đoạn 2 — So sánh: Đã biết muốn gì, đang tìm chỗ tin
Giai đoạn 3 — Sẵn sàng: Cần tư vấn cụ thể cho ngân sách và nhu cầu

Dù bạn đang ở giai đoạn nào — Huế đều có thể giúp. Nhắn Zalo 0912.268.667 nhé.

▶ Xem ngay: Xu Hướng Trang Sức Kim Cương 2025
{YT}okjHEbvdD8k

💍 Xem bộ sưu tập nhẫn kim cương CHJ:
{LANDING}
{SOCIAL_BLOCK}

— Kim Huế
chunghieudiamond.com | Zalo: 0912.268.667"""
    },
    {
        "day": 16,
        "name": "NGAY 16 - CAM NANG",
        "subject": "Tuần này Huế tư vấn cho 3 khách — đây là điều họ học được",
        "plain": f"""Chào [[name]],

Khách 1 (15 triệu): Chọn 0.4ct G VS2 Excellent → đẹp hơn viên 0.5ct H SI2 cùng tiền
Khách 2 (30 triệu): Tránh được viên cut Very Good người bán không đề cập
Khách 3 (50 triệu): Tiết kiệm 8 triệu bằng cách chọn 0.9ct thay vì 1ct

Kiến thức = tiền. Bạn đã có cẩm nang — giờ là lúc áp dụng.

▶ Xem ngay: Chọn Nhẫn Kim Cương Thông Minh Bằng 3 Bí Quyết Vàng
{YT}vdW8W1lkBms

💍 Xem bộ sưu tập nhẫn kim cương CHJ:
{LANDING}

— Kim Huế
Zalo tư vấn: {ZALO}"""
    },
    {
        "day": 17,
        "name": "NGAY 17 - CAM NANG",
        "subject": "\"Để sau mua cũng được…\" — cái bẫy khiến nhiều người trả giá đắt",
        "plain": f"""Chào [[name]],

Giá kim cương GIA tăng trung bình 5-8% mỗi năm. Viên bạn đang ngắm hôm nay — sang năm có thể đắt hơn 3-5 triệu.

Nhưng quan trọng hơn: mỗi ngày trì hoãn là một ngày cô ấy chờ đợi.

Nếu bạn đã sẵn sàng — hãy bắt đầu bằng một cuộc tư vấn miễn phí với Huế.

▶ Xem ngay: Chọn Nhẫn Kim Cương Cho Nàng Chỉ Trong 30 Giây
{YT}ko2ISp_vHDI

💍 Xem bộ sưu tập nhẫn kim cương CHJ:
{LANDING}

— Kim Huế
Zalo tư vấn: {ZALO}"""
    },
    {
        "day": 18,
        "name": "NGAY 18 - CAM NANG",
        "subject": "\"Tôi thấy giá trên mạng rẻ hơn nhiều…\" — Huế giải thích thẳng",
        "plain": f"""Chào [[name]],

Bạn có thể thấy giá online rẻ hơn 20-30%. Huế không phủ nhận.

Nhưng hãy hỏi: Giấy GIA có số report kiểm tra được không? Có chính sách đổi trả rõ ràng không?

Một viên rẻ hơn 5 triệu nhưng không GIA → bạn đang trả 5 triệu để mua sự không chắc chắn.

CHJ Diamond không phải chỗ rẻ nhất — nhưng là chỗ bạn biết chính xác mình đang mua gì.

▶ Xem ngay: 5 Lỗi Thường Gặp Khi Mua Nhẫn Đính Hôn Kim Cương
{YT}2e_B1bG9qic

💍 Xem bộ sưu tập nhẫn kim cương CHJ:
{LANDING}

— Kim Huế
Zalo tư vấn: {ZALO}"""
    },
    {
        "day": 19,
        "name": "NGAY 19 - CAM NANG",
        "subject": "Khách hàng nói gì về CHJ Diamond?",
        "plain": f"""Chào [[name]],

Huế không tự khen. Để khách nói thay:

"Lần đầu mua kim cương mà không lo lắng — vì Huế cho kiểm tra GIA ngay tại chỗ." — Chị Hương, Hà Nội

"Huế tư vấn như người thân, không cố bán viên đắt hơn." — Anh Tuấn, TP.HCM

"Nhẫn đẹp hơn tôi tưởng với ngân sách đó." — Chị Mai, Đà Nẵng

▶ Xem ngay: 3 Mẹo Giúp Trang Sức Kim Cương Luôn Sáng Đẹp
{YT}GyocV-uc1Ho

💍 Xem bộ sưu tập nhẫn kim cương CHJ:
{LANDING}

— Kim Huế
Zalo tư vấn: {ZALO}"""
    },
    {
        "day": 20,
        "name": "NGAY 20 - CAM NANG",
        "subject": "Một câu hỏi thẳng thắn từ Huế",
        "plain": f"""Chào [[name]],

Bạn đã nhận cẩm nang 3 tuần trước. Đọc 20 email từ Huế.

Huế muốn hỏi thẳng: Bạn đang cần gì từ Huế lúc này?

A) Vẫn đang tìm hiểu — chưa cần tư vấn
B) Muốn tư vấn nhưng chưa biết hỏi gì
C) Sẵn sàng tư vấn về viên cụ thể

Reply "A", "B" hoặc "C" — Huế sẽ hỗ trợ đúng với giai đoạn của bạn.

▶ Xem ngay: Sự Thật Về Trang Sức Kim Cương
{YT}fb6vyJwB2wg

💍 Xem bộ sưu tập nhẫn kim cương CHJ:
{LANDING}

— Kim Huế
Zalo tư vấn: {ZALO}"""
    },
    {
        "day": 21,
        "name": "NGAY 21 - CAM NANG",
        "subject": "Email cuối — Huế muốn nói điều này 💎",
        "plain": f"""Chào [[name]],

Đây là email cuối trong chuỗi này. Nhưng Huế vẫn ở đây — bất cứ khi nào bạn cần.

Người mua thông minh không phải người có nhiều tiền nhất — mà là người biết đặt đúng câu hỏi.

Bạn đã có kiến thức đó rồi.

Khi bạn sẵn sàng — dù là hôm nay hay 6 tháng nữa:

💍 Xem bộ sưu tập nhẫn kim cương CHJ:
{LANDING}

📞 Zalo tư vấn 1-1 miễn phí: {ZALO}
{SOCIAL_BLOCK}

Chúc bạn sở hữu viên kim cương hoàn mỹ xứng đáng với tình yêu của mình. 💎

— Kim Huế, Chung Hiếu Jewelry
chunghieudiamond.com"""
    },
]

def delete_ar(ar_id):
    req = urllib.request.Request(
        f"https://api.getresponse.com/v3/autoresponders/{ar_id}",
        method="DELETE"
    )
    req.add_header("X-Auth-Token", f"api-key {API_KEY}")
    try:
        with urllib.request.urlopen(req) as r:
            return True
    except Exception as e:
        print(f"  Xóa lỗi {ar_id}: {e}")
        return False

def create_ar(email):
    payload = {
        "name": email["name"],
        "subject": email["subject"],
        "content": {
            "html": "<p>" + email["plain"].replace("\n\n", "</p><p>").replace("\n", "<br>") + "</p>",
            "plain": email["plain"]
        },
        "triggerSettings": {
            "type": "onday",
            "dayOfCycle": email["day"],
            "selectedCampaigns": [CAMPAIGN_ID]
        },
        "sendSettings": {
            "type": "signup",
            "delayInHours": 0,
            "sendAtHour": 8,
            "recurrence": "false",
            "timeTravel": "false",
            "excludedDaysOfWeek": []
        },
        "fromField": {"fromFieldId": FROM_FIELD_ID},
        "replyTo": {"fromFieldId": FROM_FIELD_ID},
        "campaign": {"campaignId": CAMPAIGN_ID},
        "flags": ["clicktrack", "openrate"],
        "status": "enabled"
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        "https://api.getresponse.com/v3/autoresponders",
        data=data, method="POST"
    )
    req.add_header("X-Auth-Token", f"api-key {API_KEY}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as r:
            result = json.loads(r.read().decode("utf-8"))
            return result.get("autoresponderId")
    except urllib.error.HTTPError as e:
        print(f"  Tạo lỗi: {e.code} {e.read().decode('utf-8')[:100]}")
        return None

# Bước 1: Xóa old IDs
print("=== XÓA EMAIL CŨ ===")
for old_id in OLD_IDS:
    ok = delete_ar(old_id)
    print(f"  {'✅' if ok else '❌'} Xóa {old_id}")

print("\n=== TẠO EMAIL MỚI VỚI VIDEO + LANDING PAGE ===")
for email in EMAILS:
    new_id = create_ar(email)
    if new_id:
        print(f"✅ Ngay {email['day']}: {email['subject'][:45]}... [ID: {new_id}]")
    else:
        print(f"❌ Ngay {email['day']}: THẤT BẠI")

print("\n=== HOÀN THÀNH ===")
