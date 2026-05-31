# -*- coding: utf-8 -*-
"""
CHJ Diamond — Cẩm Nang Mua Kim Cương Thông Minh
- Tiếng Việt đầy đủ dấu (NotoSans TTF)
- Logo thương hiệu thật trên trang bìa
- "Kim Huế" (bỏ "Chị")
"""

import os, sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer,
                                PageBreak, Table, TableStyle, HRFlowable,
                                Image)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfWriter, PdfReader

# ── Đường dẫn ────────────────────────────────────────────────────────────────
BASE        = r'D:\NÃO CỦA HUẾ 1'
OUTPUT      = os.path.join(BASE, r'docs\assets\cam-nang-kim-cuong.pdf')
TMP_COVER   = os.path.join(BASE, '_cover_tmp.pdf')
TMP_CONTENT = os.path.join(BASE, '_content_tmp.pdf')
LOGO_PATH   = os.path.join(BASE, r'docs\assets\chj_logo.png')
FONT_DIR    = os.path.join(BASE, 'fonts')

# ── Đăng ký font NotoSans (hỗ trợ tiếng Việt) ────────────────────────────────
pdfmetrics.registerFont(TTFont('NS',  os.path.join(FONT_DIR, 'NotoSans-Regular.ttf')))
pdfmetrics.registerFont(TTFont('NSB', os.path.join(FONT_DIR, 'NotoSans-Bold.ttf')))
pdfmetrics.registerFont(TTFont('NSI', os.path.join(FONT_DIR, 'NotoSans-Italic.ttf')))
pdfmetrics.registerFontFamily('NS', normal='NS', bold='NSB', italic='NSI', boldItalic='NSB')

W, H   = A4
MARGIN = 20 * mm

GOLD       = colors.HexColor('#C9A84C')
DARK       = colors.HexColor('#1A1A1A')
CREAM      = colors.HexColor('#FDF8F0')
LIGHT_GOLD = colors.HexColor('#E8D5A3')
DARK_GOLD  = colors.HexColor('#9A6F28')
GREY       = colors.HexColor('#F5F5F5')


# ── Style helper ─────────────────────────────────────────────────────────────
def ps(name, font='NS', size=10, leading=15, color=None,
       align=TA_LEFT, spBefore=0, spAfter=6, leftIndent=0):
    return ParagraphStyle(name, fontName=font, fontSize=size, leading=leading,
                          textColor=color or DARK, alignment=align,
                          spaceBefore=spBefore, spaceAfter=spAfter,
                          leftIndent=leftIndent)

def sp(n=6):   return Spacer(1, n)
def hr(t=0.8, c=GOLD):
    return HRFlowable(width='100%', thickness=t, color=c,
                      spaceAfter=8, spaceBefore=4)

def tip_box(text, bg=None, border=GOLD, tc=None):
    bg = bg or colors.HexColor('#FFF9EC')
    tc = tc or DARK_GOLD
    return Table(
        [[Paragraph(text, ps('_tb', font='NSI', size=10, leading=16,
                             color=tc, spAfter=0))]],
        colWidths=[W - 2*MARGIN],
        style=TableStyle([
            ('BACKGROUND', (0,0),(-1,-1), bg),
            ('BOX',        (0,0),(-1,-1), 1.5, border),
            ('TOPPADDING',    (0,0),(-1,-1), 10),
            ('BOTTOMPADDING', (0,0),(-1,-1), 10),
            ('LEFTPADDING',   (0,0),(-1,-1), 12),
            ('RIGHTPADDING',  (0,0),(-1,-1), 12),
        ])
    )


# ── Header / Footer ───────────────────────────────────────────────────────────
PAGE_TITLES = {
    2:  'Lời Nói Đầu',
    3:  'Chương 1 — Giấy GIA',
    4:  'Chương 2 — Nước Kim Cương',
    5:  'Chương 3 — Fluorescence',
    6:  'Chương 4 — Size Nhẫn',
    7:  'Chương 5 — 4C Kim Cương',
    8:  'Chương 6 — 10 Câu Hỏi',
    9:  'Bonus Checklist',
    10: 'Tư Vấn Miễn Phí',
}

def draw_hf(c, pn):
    c.setFillColor(DARK)
    c.rect(0, H - 13*mm, W, 13*mm, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont('NSB', 9)
    c.drawString(MARGIN, H - 8.5*mm, 'CHJ DIAMOND')
    c.setFillColor(colors.white)
    c.setFont('NS', 8)
    c.drawString(MARGIN + 72, H - 8.5*mm,
                 '|  Cẩm Nang Mua Kim Cương Thông Minh')
    title = PAGE_TITLES.get(pn, '')
    if title:
        c.setFont('NS', 7.5)
        c.drawRightString(W - MARGIN, H - 8.5*mm, f'Trang {pn}  |  {title}')
    # footer
    c.setFillColor(DARK)
    c.rect(0, 0, W, 9*mm, fill=1, stroke=0)
    c.setFillColor(colors.HexColor('#888888'))
    c.setFont('NS', 7)
    c.drawString(MARGIN, 3*mm,
                 'chunghieudiamond.com  |  0912.268.667  |  Zalo: 0868.419.634')
    c.setFillColor(GOLD)
    c.drawRightString(W - MARGIN, 3*mm,
                      'Niềm tin vững bền — Tỏa sáng vượt thời gian')


# ── Trang bìa ─────────────────────────────────────────────────────────────────
def build_cover():
    c = rl_canvas.Canvas(TMP_COVER, pagesize=A4)

    # Nền đen
    c.setFillColor(DARK)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Viền vàng ngoài / trong
    c.setStrokeColor(GOLD); c.setLineWidth(2)
    c.rect(8*mm, 8*mm, W - 16*mm, H - 16*mm, fill=0, stroke=1)
    c.setLineWidth(0.5)
    c.rect(10.5*mm, 10.5*mm, W - 21*mm, H - 21*mm, fill=0, stroke=1)

    # Góc trang trí
    cs = 14*mm
    for cx, cy, dx, dy in [
        (10*mm, H-10*mm,  1, -1), (W-10*mm, H-10*mm, -1, -1),
        (10*mm, 10*mm,    1,  1), (W-10*mm, 10*mm,   -1,  1),
    ]:
        c.setStrokeColor(GOLD); c.setLineWidth(1.5)
        c.line(cx, cy, cx + dx*cs, cy)
        c.line(cx, cy, cx, cy + dy*cs)

    # Logo CHJ (ảnh thật)
    logo_y_top = H - 42*mm
    logo_h = 28*mm
    if os.path.exists(LOGO_PATH):
        from PIL import Image as PILImage
        img = PILImage.open(LOGO_PATH)
        iw, ih = img.size
        logo_w = logo_h * (iw / ih)
        logo_x = (W - logo_w) / 2
        c.drawImage(LOGO_PATH, logo_x, logo_y_top - logo_h,
                    width=logo_w, height=logo_h, mask='auto')
    else:
        # fallback: vẽ kim cương đơn giản
        dcx, dty = W/2, H - 50*mm
        dh, dw = 22*mm, 18*mm
        c.setFillColor(GOLD)
        path = c.beginPath()
        path.moveTo(dcx, dty)
        path.lineTo(dcx + dw/2, dty - dh*0.42)
        path.lineTo(dcx, dty - dh)
        path.lineTo(dcx - dw/2, dty - dh*0.42)
        path.close()
        c.drawPath(path, fill=1, stroke=0)
        logo_y_top = dty - dh
        logo_h = 0

    # Tên thương hiệu
    brand_y = logo_y_top - logo_h - 8*mm
    c.setFillColor(GOLD); c.setFont('NSB', 24)
    c.drawCentredString(W/2, brand_y, 'CHJ DIAMOND')
    c.setFillColor(LIGHT_GOLD); c.setFont('NS', 9)
    c.drawCentredString(W/2, brand_y - 8*mm, 'CHUNG HIẾU JEWELRY')

    # Gạch vàng
    c.setStrokeColor(GOLD); c.setLineWidth(0.8)
    c.line(MARGIN + 28*mm, brand_y - 13*mm,
           W - MARGIN - 28*mm, brand_y - 13*mm)

    # Tiêu đề chính
    y0 = brand_y - 26*mm
    c.setFillColor(colors.white); c.setFont('NSB', 20)
    c.drawCentredString(W/2, y0, 'CẨM NANG MUA')
    c.setFillColor(GOLD); c.setFont('NSB', 27)
    c.drawCentredString(W/2, y0 - 14*mm, 'KIM CƯƠNG')
    c.setFillColor(colors.white); c.setFont('NSB', 20)
    c.drawCentredString(W/2, y0 - 27*mm, 'THÔNG MINH')

    # Phụ đề
    c.setFillColor(LIGHT_GOLD); c.setFont('NSI', 11)
    c.drawCentredString(W/2, y0 - 40*mm,
                        '10 Điều Phải Biết Trước Khi Bước Vào Cửa Hàng')

    # Badge quà tặng
    bw, bh = 120*mm, 15*mm
    bx = (W - bw)/2
    by = y0 - 58*mm
    c.setFillColor(GOLD)
    c.roundRect(bx, by, bw, bh, 2*mm, fill=1, stroke=0)
    c.setFillColor(DARK); c.setFont('NSB', 10)
    c.drawCentredString(W/2, by + 5*mm,
                        'Tặng miễn phí từ Chung Hiếu Jewelry')

    # Website
    c.setFillColor(colors.HexColor('#888888')); c.setFont('NS', 8)
    c.drawCentredString(W/2, 17*mm, 'chunghieudiamond.com')

    c.save()
    print("Cover done.")


# ── Nội dung ─────────────────────────────────────────────────────────────────
class CHJTemplate(SimpleDocTemplate):
    _pn = 2
    def handle_pageEnd(self):
        draw_hf(self.canv, self._pn)
        self._pn += 1
        super().handle_pageEnd()


def build_content():
    story = []

    # ─ P2: Lời nói đầu ───────────────────────────────────────────────────────
    story += [
        Paragraph('Lời Nói Đầu',
                  ps('h1a', font='NSB', size=15, color=GOLD, spAfter=6)),
        hr(),
        Paragraph('Kim Huế gửi đến bạn',       # ← bỏ "Chị"
                  ps('h2a', font='NSB', size=12, spAfter=8)),
        sp(4),
        Paragraph(
            'Khi mua kim cương, hầu hết mọi người đều bước vào cửa hàng với '
            'tâm trạng lo lắng — sợ mua phải hàng giả, sợ bị "bán đắt", sợ '
            'không biết chọn đúng viên.',
            ps('q1', font='NSI', size=11, leading=19, align=TA_JUSTIFY)),
        Paragraph(
            'Sau hơn 10 năm trong nghề, tôi nhận ra rằng: người mua thông '
            'minh không phải là người có nhiều tiền nhất — mà là người biết '
            'đặt đúng câu hỏi.',
            ps('q2', font='NSI', size=11, leading=19, align=TA_JUSTIFY)),
        Paragraph(
            'Cẩm nang này tổng hợp tất cả kiến thức mà tôi muốn mọi khách '
            'hàng đều nắm trong tay trước khi mua. Hoàn toàn miễn phí. '
            'Không điều kiện.',
            ps('q3', font='NSI', size=11, leading=19, align=TA_JUSTIFY)),
        Paragraph(
            'Chúc bạn sở hữu viên kim cương hoàn mỹ xứng đáng với giá trị '
            'bỏ ra.',
            ps('q4', font='NSI', size=11, leading=19, align=TA_JUSTIFY)),
        sp(12),
        Paragraph('— Kim Huế, Chung Hiếu Jewelry',
                  ps('sig', font='NSB', size=11, color=GOLD,
                     align=TA_CENTER)),
        PageBreak(),
    ]

    # ─ P3: Chương 1 ──────────────────────────────────────────────────────────
    story += [
        Paragraph('CHƯƠNG 1',
                  ps('lb1', font='NS', size=8,
                     color=colors.HexColor('#888'))),
        Paragraph('Giấy GIA Là Gì & Cách Kiểm Tra Thật/Giả',
                  ps('h1b', font='NSB', size=15, color=GOLD, spAfter=6)),
        hr(),
        Paragraph(
            '<b>Giấy GIA là gì?</b><br/>'
            'GIA (Gemological Institute of America) là tổ chức kiểm định kim '
            'cương uy tín nhất thế giới. Mỗi viên kim cương có giá trị đều '
            'đi kèm giấy chứng nhận GIA với mã số riêng.',
            ps('b1', size=10, leading=17, align=TA_JUSTIFY)),
        sp(8),
        Paragraph('<b>3 bước kiểm tra ngay tại chỗ:</b>',
                  ps('h2b', font='NSB', size=11)),
        sp(4),
    ]
    for title, body in [
        ('Bước 1 — Kiểm tra online',
         'Vào gia.edu/report-check → Nhập số report trên giấy → Thông tin '
         'phải khớp 100% với tờ giấy bạn đang cầm.'),
        ('Bước 2 — Kiểm tra vi chữ (Micro-inscription)',
         'Dùng kính lúp 10x soi vào thắt lưng viên kim cương (girdle) → Số '
         'report GIA được khắc laser, mắt thường không thấy được.'),
        ('Bước 3 — Kiểm tra hologram và chất liệu giấy',
         'Giấy GIA thật có hologram ánh sáng, giấy dày và có hoa văn bảo '
         'mật, không thể photocopy giống được.'),
    ]:
        t = Table([[
            Paragraph(f'<b>{title}</b>',
                      ps('_st', font='NSB', size=10,
                         color=colors.white, spAfter=0)),
            Paragraph(body,
                      ps('_sb', size=9, leading=14,
                         color=colors.white, spAfter=0)),
        ]], colWidths=[78*mm, None],
        style=TableStyle([
            ('BACKGROUND', (0,0),(0,0), DARK),
            ('BACKGROUND', (1,0),(1,0), colors.HexColor('#2D2D2D')),
            ('VALIGN',    (0,0),(-1,-1), 'MIDDLE'),
            ('TOPPADDING',    (0,0),(-1,-1), 9),
            ('BOTTOMPADDING', (0,0),(-1,-1), 9),
            ('LEFTPADDING',   (0,0),(-1,-1), 8),
            ('RIGHTPADDING',  (0,0),(-1,-1), 8),
        ]))
        story += [t, sp(4)]

    story += [
        sp(6),
        tip_box('⚠  Nếu người bán từ chối cho kiểm tra online ngay tại chỗ '
                '— đây là dấu hiệu cảnh báo!',
                bg=colors.HexColor('#FFF3CD'),
                border=colors.HexColor('#FFC107'),
                tc=colors.HexColor('#8B0000')),
        PageBreak(),
    ]

    # ─ P4: Chương 2 ──────────────────────────────────────────────────────────
    story += [
        Paragraph('CHƯƠNG 2',
                  ps('lb2', font='NS', size=8, color=colors.HexColor('#888'))),
        Paragraph('Kim Cương Nước D–E–F–G Khác Nhau Thế Nào?',
                  ps('h1c', font='NSB', size=15, color=GOLD, spAfter=6)),
        hr(),
        Paragraph(
            '"Nước kim cương" (color grade) là độ không màu của viên đá. '
            'GIA chia thành thang từ D đến Z.',
            ps('b2', size=10, leading=16)),
        sp(8),
        Paragraph('<b>Bảng so sánh nhanh:</b>',
                  ps('h2c', font='NSB', size=11)),
        sp(4),
    ]

    color_rows = [
        ('Cấp độ', 'Phân loại', 'Đặc điểm', 'Khuyến nghị',
         DARK, colors.white, True),
        ('D – E – F', 'Colorless', 'Hiếm nhất, đẹp nhất dưới ánh sáng mạnh, giá cao nhất.',
         'Người muốn viên đá thuần khiết tuyệt đối.',
         GREY, DARK, False),
        ('G – H', 'Near Colorless', 'Mắt thường không phân biệt được với D-F khi đã gắn lên nhẫn.',
         'Lựa chọn thông minh — tiết kiệm 20–30%.',
         colors.white, DARK, False),
        ('I – J', 'Slightly Tinted', 'Hơi có sắc vàng nhẹ, chỉ thấy khi đặt cạnh viên D-F.',
         'Ngân sách giới hạn, gắn trên vàng vàng.',
         GREY, DARK, False),
        ('K trở xuống', 'Tinted', 'Màu vàng rõ ràng.',
         'Không khuyến khích cho nhẫn kim cương chủ.',
         colors.HexColor('#FDECEA'), DARK, False),
    ]
    tbl_data = []
    for grade, cls, feat, rec, bg, tc, header in color_rows:
        fn = 'NSB' if header else 'NS'
        tbl_data.append([
            Paragraph(grade, ps(f'cr{id(grade)}', font=fn, size=9, leading=13,
                                color=tc, align=TA_CENTER)),
            Paragraph(cls,   ps(f'cc{id(cls)}',   font=fn, size=9, leading=13,
                                color=tc, align=TA_CENTER)),
            Paragraph(feat,  ps(f'cf{id(feat)}',  font='NS', size=9, leading=13,
                                color=tc)),
            Paragraph(rec,   ps(f'crr{id(rec)}',  font='NS', size=9, leading=13,
                                color=tc)),
        ])
    ct = Table(tbl_data, colWidths=[28*mm, 36*mm, None, None])
    ct.setStyle(TableStyle([
        ('VALIGN',    (0,0),(-1,-1), 'MIDDLE'),
        ('TOPPADDING',    (0,0),(-1,-1), 7),
        ('BOTTOMPADDING', (0,0),(-1,-1), 7),
        ('LEFTPADDING',   (0,0),(-1,-1), 6),
        ('RIGHTPADDING',  (0,0),(-1,-1), 6),
        ('GRID', (0,0),(-1,-1), 0.3, colors.HexColor('#DDD')),
        ('BACKGROUND', (0,0),(-1,0), DARK),
        ('BACKGROUND', (0,1),(-1,1), GREY),
        ('BACKGROUND', (0,2),(-1,2), colors.white),
        ('BACKGROUND', (0,3),(-1,3), GREY),
        ('BACKGROUND', (0,4),(-1,4), colors.HexColor('#FDECEA')),
    ]))
    story += [
        ct, sp(10),
        tip_box('💡  Bí quyết tiết kiệm: Nước G-H đẹp như D-F khi nhìn trực '
                'tiếp nhưng tiết kiệm được 20–35% ngân sách.'),
        PageBreak(),
    ]

    # ─ P5: Chương 3 ──────────────────────────────────────────────────────────
    story += [
        Paragraph('CHƯƠNG 3',
                  ps('lb3', font='NS', size=8, color=colors.HexColor('#888'))),
        Paragraph('Fluorescence (Huỳnh Quang) Là Gì? Có Nên Mua Không?',
                  ps('h1d', font='NSB', size=15, color=GOLD, spAfter=6)),
        hr(),
        Paragraph(
            'Fluorescence là hiện tượng kim cương phát sáng (thường màu xanh) '
            'khi chiếu tia UV.',
            ps('b3', size=10, leading=16)),
        sp(8),
        Paragraph('<b>Các mức độ fluorescence:</b>',
                  ps('h2d', font='NSB', size=11)),
        sp(4),
    ]
    for level, label, desc, bg in [
        ('None', 'Không huỳnh quang',
         'Giá chuẩn thị trường — an toàn nhất.', DARK),
        ('Faint / Medium', 'Huỳnh quang nhẹ',
         'Dưới ánh đèn bình thường: không thấy khác biệt. Giá thấp hơn 5–10%.',
         colors.HexColor('#2D5A3D')),
        ('Strong / Very Strong', 'Huỳnh quang mạnh',
         'Có thể làm viên đá trông "sữa" hoặc mờ đục. Nên xem trực tiếp trước khi mua.',
         colors.HexColor('#8B4513')),
    ]:
        t = Table([[
            Paragraph(f'<b>{level}</b>',
                      ps(f'fl1{level}', font='NSB', size=10,
                         color=colors.white, align=TA_CENTER, spAfter=0)),
            Paragraph(f'<b>{label}</b>',
                      ps(f'fl2{level}', font='NSB', size=9,
                         color=colors.white, spAfter=0)),
            Paragraph(desc,
                      ps(f'fl3{level}', font='NS', size=9, leading=14,
                         color=colors.white, spAfter=0)),
        ]], colWidths=[34*mm, 42*mm, None],
        style=TableStyle([
            ('BACKGROUND', (0,0),(-1,-1), bg),
            ('VALIGN',    (0,0),(-1,-1), 'MIDDLE'),
            ('TOPPADDING',    (0,0),(-1,-1), 9),
            ('BOTTOMPADDING', (0,0),(-1,-1), 9),
            ('LEFTPADDING',   (0,0),(-1,-1), 8),
            ('RIGHTPADDING',  (0,0),(-1,-1), 8),
        ]))
        story += [t, sp(4)]

    story += [
        sp(8),
        Paragraph('<b>Nên mua không?</b>',
                  ps('h2e', font='NSB', size=11)),
        sp(4),
        Paragraph('✅  Nước I trở xuống: Fluorescence Medium-Strong giúp viên đá '
                  'trông trắng hơn → lợi thế!',
                  ps('bl1', size=10, leading=16, leftIndent=8)),
        Paragraph('✅  Nước D-F: Chọn None hoặc Faint để tránh rủi ro đá trông sữa.',
                  ps('bl2', size=10, leading=16, leftIndent=8)),
        PageBreak(),
    ]

    # ─ P6: Chương 4 ──────────────────────────────────────────────────────────
    story += [
        Paragraph('CHƯƠNG 4',
                  ps('lb4', font='NS', size=8, color=colors.HexColor('#888'))),
        Paragraph('Cách Đo Size Nhẫn Tại Nhà Chuẩn Xác',
                  ps('h1e', font='NSB', size=15, color=GOLD, spAfter=6)),
        hr(),
        Paragraph('<b>Cách 1 — Dùng sợi chỉ hoặc giấy:</b>',
                  ps('h2f', font='NSB', size=11, spAfter=6)),
    ]
    for i, txt in enumerate([
        'Cắt một sợi chỉ hoặc dải giấy mỏng dài khoảng 10cm',
        'Quấn quanh ngón đeo nhẫn (thường ngón áp út tay trái)',
        'Đánh dấu chỗ giao nhau',
        'Đặt thẳng ra thước đo — đây là chu vi ngón tay',
        'Chia chu vi cho 3.14 = đường kính (mm)',
    ], 1):
        story.append(Paragraph(f'<b>{i}.</b>  {txt}',
                               ps(f'st{i}', size=10, leading=16,
                                  leftIndent=10)))
    story.append(sp(10))

    # Bảng size
    story.append(Paragraph('<b>Bảng quy đổi nhanh:</b>',
                           ps('h2g', font='NSB', size=11)))
    story.append(sp(4))
    szw = (W - 2*MARGIN) / 5
    sz_tbl = Table(
        [[Paragraph(f'<b>Size {s}</b>',
                    ps(f'szh{s}', font='NSB', size=10,
                       color=colors.white, align=TA_CENTER, spAfter=0))
          for s in [5, 6, 7, 8, 9]],
         [Paragraph(d, ps(f'szd{d}', size=10, align=TA_CENTER, spAfter=0))
          for d in ['15.7 mm','16.5 mm','17.3 mm','18.2 mm','19.0 mm']]],
        colWidths=[szw]*5,
        style=TableStyle([
            ('BACKGROUND', (0,0),(-1,0), DARK),
            ('BACKGROUND', (0,1),(-1,1), CREAM),
            ('GRID',  (0,0),(-1,-1), 0.5, GOLD),
            ('VALIGN', (0,0),(-1,-1), 'MIDDLE'),
            ('TOPPADDING',    (0,0),(-1,-1), 9),
            ('BOTTOMPADDING', (0,0),(-1,-1), 9),
        ])
    )
    story += [
        sz_tbl, sp(10),
        tip_box('💡  Đo vào buổi chiều/tối. Đo 2–3 lần. Nếu không chắc, '
                'chọn size to hơn — dễ chỉnh nhỏ lại hơn chỉnh to ra.'),
        PageBreak(),
    ]

    # ─ P7: Chương 5 ──────────────────────────────────────────────────────────
    story += [
        Paragraph('CHƯƠNG 5',
                  ps('lb5', font='NS', size=8, color=colors.HexColor('#888'))),
        Paragraph('4C Kim Cương: Bí Quyết Phân Bổ Ngân Sách Thông Minh',
                  ps('h1f', font='NSB', size=15, color=GOLD, spAfter=6)),
        hr(),
        Paragraph(
            '4C gồm: Cut (Giác cắt) · Color (Màu sắc/Nước) · '
            'Clarity (Độ tinh khiết) · Carat (Trọng lượng)',
            ps('b5', size=10, leading=16)),
        sp(8),
        Paragraph('<b>Thứ tự ưu tiên khi ngân sách giới hạn:</b>',
                  ps('h25', font='NSB', size=11)),
        sp(6),
    ]
    for medal, title, body, accent in [
        ('🥇', 'Cut — QUAN TRỌNG NHẤT',
         'Quyết định kim cương sáng hay tối. Luôn chọn Excellent hoặc Very Good. '
         'Đừng bao giờ hy sinh Cut để lấy size to hơn.',
         GOLD),
        ('🥈', 'Color (Nước) — Quan trọng thứ hai',
         'Chọn G-H thay vì D-F: tiết kiệm 20–30% mà không ai nhìn thấy khác biệt.',
         colors.HexColor('#C0C0C0')),
        ('🥉', 'Clarity — Có thể linh hoạt',
         'Chọn VS2 hoặc SI1 — mắt thường không thấy tỳ vết. Tiết kiệm 15–25% so với VVS.',
         colors.HexColor('#CD7F32')),
        ('⚖', 'Carat — Điều chỉnh theo ngân sách',
         '0.90ct thay vì 1.00ct = tiết kiệm 15–20% nhưng nhìn gần như giống nhau.',
         colors.HexColor('#4A90D9')),
    ]:
        t = Table([[
            Paragraph(medal, ps('med', size=20, leading=24, align=TA_CENTER,
                                spAfter=0)),
            [Paragraph(f'<b>{title}</b>',
                       ps('pt', font='NSB', size=11, spAfter=3)),
             Paragraph(body,
                       ps('pb', font='NS', size=9, leading=14,
                          color=colors.HexColor('#444')))],
        ]], colWidths=[18*mm, None],
        style=TableStyle([
            ('VALIGN',    (0,0),(-1,-1), 'MIDDLE'),
            ('TOPPADDING',    (0,0),(-1,-1), 8),
            ('BOTTOMPADDING', (0,0),(-1,-1), 8),
            ('LEFTPADDING',   (0,0),(-1,-1), 8),
            ('BACKGROUND', (0,0),(-1,-1), CREAM),
            ('LINEBELOW',  (0,0),(-1,-1), 2.5, accent),
        ]))
        story += [t, sp(5)]

    story += [
        sp(6),
        Table([[Paragraph(
            '💡 Công thức vàng: Cut Excellent + Color G + Clarity VS2 = '
            'vẻ đẹp của viên D VVS với mức giá tiết kiệm 40–50%',
            ps('gf', font='NSB', size=11, leading=17,
               color=colors.white, align=TA_CENTER, spAfter=0)
        )]], colWidths=[W - 2*MARGIN],
        style=TableStyle([
            ('BACKGROUND', (0,0),(-1,-1), DARK),
            ('BOX',  (0,0),(-1,-1), 1.5, GOLD),
            ('TOPPADDING',    (0,0),(-1,-1), 13),
            ('BOTTOMPADDING', (0,0),(-1,-1), 13),
            ('LEFTPADDING',   (0,0),(-1,-1), 12),
            ('RIGHTPADDING',  (0,0),(-1,-1), 12),
        ])),
        PageBreak(),
    ]

    # ─ P8: Chương 6 — THANH TOÁN ─────────────────────────────────────────────
    story += [
        Paragraph('CHƯƠNG 6',
                  ps('lb6', font='NS', size=8, color=colors.HexColor('#888'))),
        Paragraph('10 Câu Hỏi PHẢI HỎI Trước Khi THANH TOÁN',
                  ps('h1g', font='NSB', size=15, color=GOLD, spAfter=6)),
        hr(),
        Paragraph(
            'In trang này mang theo hoặc lưu vào điện thoại trước khi đi mua '
            'kim cương.',
            ps('intro6', font='NSI', size=9, leading=13,
               color=colors.HexColor('#666'), spAfter=8)),
        sp(4),
    ]

    questions = [
        'Viên kim cương này có giấy GIA không? Cho tôi kiểm tra online ngay bây giờ được không?',
        'Giác cắt (Cut) của viên này là gì? Có phải Excellent hoặc Very Good không?',
        'Nếu tôi không hài lòng sau khi nhận, chính sách đổi/trả trong bao nhiêu ngày?',
        'Chiếc nhẫn có bảo hành không? Bảo hành những gì và trong bao lâu?',
        'Giá này đã bao gồm phí chỉnh size chưa? Có thể chỉnh size miễn phí sau khi mua không?',
        'Kim loại làm nhẫn là gì? Vàng 18K hay Platinum? Có bị đen hoặc gỉ không?',
        'Tôi có thể mang viên kim cương đi thẩm định độc lập không?',
        'Có thể cho tôi xem một số viên tương tự để so sánh trực tiếp không?',
        'Chính sách mua lại của cửa hàng như thế nào?',
        'Tôi có thể nhận hóa đơn tài chính (VAT) không?',
    ]

    def q_row(qn, text, bg):
        return Table([[
            Paragraph(f'<b>Q{qn:02d}</b>',
                      ps(f'qn{qn}', font='NSB', size=9,
                         color=colors.white, align=TA_CENTER, spAfter=0)),
            Paragraph(text,
                      ps(f'qt{qn}', font='NS', size=9, leading=13, spAfter=0)),
        ]], colWidths=[11*mm, None],
        style=TableStyle([
            ('BACKGROUND', (0,0),(0,0), DARK),
            ('BACKGROUND', (1,0),(1,0), bg),
            ('VALIGN',    (0,0),(-1,-1), 'MIDDLE'),
            ('TOPPADDING',    (0,0),(-1,-1), 7),
            ('BOTTOMPADDING', (0,0),(-1,-1), 7),
            ('LEFTPADDING',   (0,0),(-1,-1), 7),
            ('RIGHTPADDING',  (0,0),(-1,-1), 7),
        ]))

    half = W/2 - MARGIN - 3*mm
    left_col  = [[q_row(i+1, questions[i],
                        GREY if i%2==0 else colors.white)] for i in range(5)]
    right_col = [[q_row(i+6, questions[i+5],
                        GREY if i%2==0 else colors.white)] for i in range(5)]

    def col_tbl(cells):
        return Table(cells, colWidths=[half],
                     style=TableStyle([
                         ('TOPPADDING',    (0,0),(-1,-1), 0),
                         ('BOTTOMPADDING', (0,0),(-1,-1), 3),
                         ('LEFTPADDING',   (0,0),(-1,-1), 0),
                         ('RIGHTPADDING',  (0,0),(-1,-1), 0),
                     ]))

    two = Table([[col_tbl(left_col), col_tbl(right_col)]],
                colWidths=[half, half],
                style=TableStyle([
                    ('VALIGN',    (0,0),(-1,-1), 'TOP'),
                    ('TOPPADDING',    (0,0),(-1,-1), 0),
                    ('BOTTOMPADDING', (0,0),(-1,-1), 0),
                    ('LEFTPADDING',   (0,0),(-1,-1), 0),
                    ('RIGHTPADDING',  (0,0),(0,-1), 6),
                    ('RIGHTPADDING',  (1,0),(-1,-1), 0),
                ]))
    story += [
        two, sp(10),
        tip_box('⚠  Nếu người bán không trả lời được hơn 3 câu '
                '→ Hãy cân nhắc lại quyết định mua!',
                bg=colors.HexColor('#FFF3CD'),
                border=colors.HexColor('#FFC107'),
                tc=colors.HexColor('#8B0000')),
        PageBreak(),
    ]

    # ─ P9: Bonus checklist ───────────────────────────────────────────────────
    story += [
        Paragraph('BONUS',
                  ps('lb7', font='NS', size=8, color=colors.HexColor('#888'))),
        Paragraph('Checklist Chọn Nhẫn Cầu Hôn Hoàn Hảo',
                  ps('h1h', font='NSB', size=15, color=GOLD, spAfter=6)),
        hr(),
    ]

    def cl_section(heading, items):
        story.append(Paragraph(f'<b>{heading}</b>',
                               ps('clh', font='NSB', size=11, spAfter=4)))
        for item in items:
            t = Table([[
                Paragraph('☐',
                          ps('cb', font='NS', size=14, leading=16,
                             color=GOLD, align=TA_CENTER, spAfter=0)),
                Paragraph(item,
                          ps('ci', font='NS', size=10, leading=15, spAfter=0)),
            ]], colWidths=[9*mm, None],
            style=TableStyle([
                ('VALIGN',    (0,0),(-1,-1), 'MIDDLE'),
                ('TOPPADDING',    (0,0),(-1,-1), 5),
                ('BOTTOMPADDING', (0,0),(-1,-1), 5),
                ('LEFTPADDING',   (0,0),(0,0), 2),
                ('LEFTPADDING',   (1,0),(1,-1), 6),
                ('LINEBELOW', (0,0),(-1,-1), 0.2, colors.HexColor('#DDD')),
            ]))
            story.append(t)
        story.append(sp(8))

    cl_section('TRƯỚC KHI ĐI MUA:', [
        'Biết size nhẫn của người nhận (đo theo hướng dẫn Chương 4)',
        'Xác định ngân sách tổng (bao gồm cả chi phí khắc chữ / chỉnh size)',
        'Biết sở thích: nhẫn đơn giản hay cầu kỳ? Kim loại vàng hay bạch kim?',
        'Chuẩn bị 10 câu hỏi ở Chương 6',
    ])
    cl_section('KHI XEM NHẪN:', [
        'Yêu cầu xem dưới nhiều loại ánh sáng (tự nhiên, đèn LED, ánh đèn vàng)',
        'Kiểm tra giấy GIA online ngay tại chỗ',
        'Thử cảm giác đeo trên tay — nhẫn có thoải mái không?',
        'Chụp ảnh lại để so sánh sau',
    ])
    cl_section('KHI QUYẾT ĐỊNH:', [
        'Nhận hóa đơn + phiếu bảo hành đầy đủ',
        'Chụp ảnh viên kim cương và số report GIA',
        'Lưu lại thông tin liên hệ của cửa hàng',
    ])
    story.append(PageBreak())

    # ─ P10: CTA ──────────────────────────────────────────────────────────────
    story += [
        Paragraph('Bạn Muốn Được Tư Vấn Trực Tiếp?',
                  ps('h1i', font='NSB', size=15, color=GOLD, spAfter=6)),
        hr(),
        sp(6),
        Paragraph(
            'Cẩm nang này trang bị cho bạn kiến thức để <b>TỰ TIN</b> khi mua '
            'kim cương.',
            ps('c1', font='NS', size=12, leading=18, align=TA_CENTER)),
        Paragraph(
            'Nhưng nếu bạn muốn được tư vấn cá nhân — một chuyên gia sẽ lắng nghe '
            'nhu cầu cụ thể của bạn, ngân sách thực tế, và giúp bạn tìm ra viên '
            'kim cương <b>PHÙ HỢP NHẤT</b> — không bị hối thúc, không áp lực.',
            ps('c2', font='NSI', size=11, leading=19,
               align=TA_CENTER, spAfter=12)),
        sp(8),
        Table([[Paragraph(
            'CHJ Diamond cung cấp dịch vụ tư vấn miễn phí 1-1',
            ps('c3', font='NSB', size=12, leading=18,
               color=colors.white, align=TA_CENTER, spAfter=0)
        )]], colWidths=[W - 2*MARGIN],
        style=TableStyle([
            ('BACKGROUND', (0,0),(-1,-1), DARK),
            ('BOX',  (0,0),(-1,-1), 2, GOLD),
            ('TOPPADDING',    (0,0),(-1,-1), 14),
            ('BOTTOMPADDING', (0,0),(-1,-1), 14),
            ('LEFTPADDING',   (0,0),(-1,-1), 12),
            ('RIGHTPADDING',  (0,0),(-1,-1), 12),
        ])),
        sp(16),
    ]
    for icon, info in [
        ('📞', '0912.268.667'),
        ('💬', 'Zalo: 0868.419.634  |  0867.516.921'),
        ('🌐', 'chunghieudiamond.com'),
        ('📱', '@ChungHieuJewelry  (TikTok | YouTube | Facebook)'),
    ]:
        t = Table([[
            Paragraph(icon, ps('ic', font='NS', size=16, leading=20,
                               align=TA_CENTER, spAfter=0)),
            Paragraph(f'<b>{info}</b>',
                      ps('ii', font='NSB', size=11, leading=16, spAfter=0)),
        ]], colWidths=[16*mm, None],
        style=TableStyle([
            ('VALIGN',    (0,0),(-1,-1), 'MIDDLE'),
            ('TOPPADDING',    (0,0),(-1,-1), 7),
            ('BOTTOMPADDING', (0,0),(-1,-1), 7),
            ('LEFTPADDING',   (0,0),(-1,-1), 6),
            ('LINEBELOW', (0,0),(-1,-1), 0.3, colors.HexColor('#DDD')),
        ]))
        story.append(t)

    story += [
        sp(20),
        HRFlowable(width='100%', thickness=1, color=GOLD,
                   spaceAfter=10, spaceBefore=6),
        Paragraph('"Niềm tin vững bền — Tỏa sáng vượt thời gian"',
                  ps('sl', font='NSI', size=12, leading=18,
                     color=GOLD, align=TA_CENTER)),
        Paragraph('CHJ DIAMOND — Chung Hiếu Jewelry',
                  ps('br', font='NSB', size=11, leading=16,
                     align=TA_CENTER)),
    ]

    doc = CHJTemplate(
        TMP_CONTENT, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=17*mm, bottomMargin=13*mm,
    )
    doc.build(story)
    print("Content done.")


# ── Merge ─────────────────────────────────────────────────────────────────────
def merge():
    writer = PdfWriter()
    for path in [TMP_COVER, TMP_CONTENT]:
        for p in PdfReader(path).pages:
            writer.add_page(p)
    with open(OUTPUT, 'wb') as f:
        writer.write(f)
    os.remove(TMP_COVER)
    os.remove(TMP_CONTENT)
    print(f"PDF saved ({len(PdfReader(OUTPUT).pages)} trang): {OUTPUT}")


if __name__ == '__main__':
    # Pillow cần cho drawImage mask='auto'
    try:
        from PIL import Image
    except ImportError:
        os.system('pip install pillow -q')
    build_cover()
    build_content()
    merge()
