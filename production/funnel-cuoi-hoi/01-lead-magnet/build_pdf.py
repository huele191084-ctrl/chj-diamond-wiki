# -*- coding: utf-8 -*-
"""Tạo PDF cẩm nang có bìa thương hiệu CHJ Diamond từ file markdown."""
import re, os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph,
                                Spacer, Table, TableStyle, Image, PageBreak, HRFlowable)

HERE = os.path.dirname(os.path.abspath(__file__))
MD = os.path.join(HERE, 'cam-nang-chon-nhan-cau-hon.md')
LOGO = os.path.join(HERE, '..', '02-squeeze-page', 'images', 'logo-chj.png')
OUT = os.path.join(HERE, 'CAM-NANG-CHON-NHAN-CAU-HON-CHJ.pdf')

GOLD = colors.HexColor('#C9A84C')
DARK = colors.HexColor('#0F0F19')
DARK2 = colors.HexColor('#1a1a2e')
INK = colors.HexColor('#20202b')
GREY = colors.HexColor('#555560')

F = 'C:/Windows/Fonts/'
pdfmetrics.registerFont(TTFont('Arial', F+'arial.ttf'))
pdfmetrics.registerFont(TTFont('Arial-B', F+'arialbd.ttf'))
pdfmetrics.registerFont(TTFont('Arial-I', F+'ariali.ttf'))
pdfmetrics.registerFont(TTFont('Times', F+'times.ttf'))
pdfmetrics.registerFont(TTFont('Times-B', F+'timesbd.ttf'))
pdfmetrics.registerFontFamily('Arial', normal='Arial', bold='Arial-B', italic='Arial-I')

PW, PH = A4

def esc(s):
    s = s.replace('&', '&amp;')
    # bold
    s = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)
    return s

# ---- styles ----
body = ParagraphStyle('body', fontName='Arial', fontSize=11, leading=17,
                      textColor=INK, spaceAfter=8)
h3 = ParagraphStyle('h3', fontName='Arial-B', fontSize=15, leading=20,
                    textColor=GOLD, spaceBefore=6, spaceAfter=8)
bullet = ParagraphStyle('bullet', fontName='Arial', fontSize=11, leading=16,
                        textColor=INK, leftIndent=16, firstLineIndent=-10, spaceAfter=5)
note = ParagraphStyle('note', fontName='Arial-I', fontSize=10, leading=14,
                      textColor=GREY, spaceAfter=6)
callout = ParagraphStyle('callout', fontName='Arial', fontSize=11, leading=16,
                         textColor=INK)
cellH = ParagraphStyle('cellH', fontName='Arial-B', fontSize=10.5, leading=13,
                       textColor=DARK, alignment=1)
cell = ParagraphStyle('cell', fontName='Arial', fontSize=10, leading=13, textColor=INK)

def draw_cover(c, doc):
    c.saveState()
    c.setFillColor(DARK); c.rect(0, 0, PW, PH, stroke=0, fill=1)
    c.setFillColor(DARK2); c.rect(0, 0, PW, PH*0.42, stroke=0, fill=1)
    # logo
    try:
        c.drawImage(LOGO, PW/2-42, PH-165, width=84, height=84,
                    preserveAspectRatio=True, mask='auto')
    except Exception:
        pass
    c.setFillColor(GOLD)
    c.setFont('Times-B', 30); c.drawCentredString(PW/2, PH-205, 'CHJ DIAMOND')
    c.setFont('Arial', 10.5); c.drawCentredString(PW/2, PH-222, 'chunghieudiamond.com')
    # divider
    c.setStrokeColor(GOLD); c.setLineWidth(1.2)
    c.line(PW/2-70, PH-238, PW/2+70, PH-238)
    # badge
    c.setFillColor(colors.HexColor('#E63946'))
    c.roundRect(PW/2-95, PH-300, 190, 26, 12, stroke=0, fill=1)
    c.setFillColor(colors.white); c.setFont('Arial-B', 11)
    c.drawCentredString(PW/2, PH-292, 'TẶNG MIỄN PHÍ — CẨM NANG PDF')
    # title
    c.setFillColor(colors.white); c.setFont('Arial-B', 26)
    for i, ln in enumerate(['CẨM NANG CHỌN NHẪN', 'CẦU HÔN KIM CƯƠNG']):
        c.drawCentredString(PW/2, PH-360-i*32, ln)
    # subtitle
    c.setFillColor(GOLD); c.setFont('Arial-B', 14)
    c.drawCentredString(PW/2, PH-430, '7 điều phải biết trước khi mua')
    c.setFillColor(colors.HexColor('#d7d7e0')); c.setFont('Arial', 12)
    c.drawCentredString(PW/2, PH-452, 'để không mua hớ, không chọn sai')
    # bottom brandline
    c.setFillColor(GOLD); c.setFont('Arial-B', 11)
    c.drawCentredString(PW/2, 40, 'chunghieudiamond.com  |  CHJ DIAMOND')
    c.restoreState()

def draw_content_page(c, doc):
    c.saveState()
    c.setFillColor(GOLD); c.setFont('Arial-B', 10)
    c.drawString(20*mm, PH-15*mm, 'CHJ DIAMOND')
    c.setStrokeColor(GOLD); c.setLineWidth(0.6)
    c.line(20*mm, PH-17*mm, PW-20*mm, PH-17*mm)
    c.setStrokeColor(colors.HexColor('#d9d9e0'))
    c.line(20*mm, 15*mm, PW-20*mm, 15*mm)
    c.setFillColor(GOLD); c.setFont('Arial-B', 8.5)
    c.drawString(20*mm, 10*mm, 'chunghieudiamond.com  |  CHJ DIAMOND')
    c.setFillColor(GREY); c.setFont('Arial', 8.5)
    c.drawRightString(PW-20*mm, 10*mm, 'Trang %d' % (doc.page-1))
    c.restoreState()

# ---- parse markdown ----
lines = open(MD, encoding='utf-8').read().split('\n')
story = [PageBreak()]  # page 1 = cover (drawn), content from page 2
i = 0
while i < len(lines):
    ln = lines[i].rstrip()
    if i < 6:  # skip title/subtitle/attrib/hr already on cover
        i += 1; continue
    if not ln:
        i += 1; continue
    if ln.startswith('### '):
        story.append(Spacer(1, 4))
        story.append(Paragraph(esc(ln[4:]), h3))
    elif ln.startswith('## '):
        story.append(Paragraph(esc(ln[3:]), h3))
    elif ln == '---':
        story.append(Spacer(1, 6))
        story.append(HRFlowable(width='100%', thickness=0.7, color=GOLD, spaceAfter=8, spaceBefore=2))
    elif ln.startswith('> '):
        txt = esc(ln[2:])
        p = Paragraph(txt, callout)
        t = Table([[p]], colWidths=[PW-40*mm-16])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#faf5e6')),
            ('BOX', (0,0), (-1,-1), 1, GOLD),
            ('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),
            ('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),
        ]))
        story.append(Spacer(1,2)); story.append(t); story.append(Spacer(1,6))
    elif ln.startswith('- '):
        story.append(Paragraph('•  ' + esc(ln[2:]), bullet))
    elif ln.startswith('|'):
        # collect table block
        rows = []
        while i < len(lines) and lines[i].strip().startswith('|'):
            raw = lines[i].strip().strip('|')
            cells = [c.strip() for c in raw.split('|')]
            if not all(set(x) <= set('-: ') for x in cells):  # skip separator row
                rows.append(cells)
            i += 1
        data = []
        for r, cells in enumerate(rows):
            style = cellH if r == 0 else cell
            data.append([Paragraph(esc(x), style) for x in cells])
        ncol = len(data[0])
        avail = PW - 40*mm
        colw = [avail*0.24, avail*0.40, avail*0.18, avail*0.18][:ncol]
        if ncol != 4:
            colw = [avail/ncol]*ncol
        t = Table(data, colWidths=colw, repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), GOLD),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f7f4ea')]),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#d8cfae')),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),
            ('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),
        ]))
        story.append(Spacer(1,4)); story.append(t); story.append(Spacer(1,8))
        continue
    elif ln.startswith('*') and ln.endswith('*'):
        story.append(Paragraph(esc(ln.strip('*')), note))
    else:
        story.append(Paragraph(esc(ln), body))
    i += 1

# ---- build ----
doc = BaseDocTemplate(OUT, pagesize=A4,
                      leftMargin=20*mm, rightMargin=20*mm,
                      topMargin=22*mm, bottomMargin=20*mm, title='Cẩm nang chọn nhẫn cầu hôn kim cương - CHJ Diamond')
frame = Frame(doc.leftMargin, doc.bottomMargin,
              PW-2*doc.leftMargin, PH-doc.topMargin-doc.bottomMargin, id='main')

def on_page(c, d):
    if d.page == 1:
        draw_cover(c, d)
    else:
        draw_content_page(c, d)

doc.addPageTemplates([PageTemplate(id='all', frames=[frame], onPage=on_page)])
doc.build(story)
print('PDF ->', OUT, round(os.path.getsize(OUT)/1024,1), 'KB')
