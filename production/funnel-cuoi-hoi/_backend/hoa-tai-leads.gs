/**
 * Proxy nhận lead từ landing page HOA TAI (production/landing-hoa-tai).
 * Ghi vào Google Sheet + báo email cho chị Huế. KHÔNG đăng ký vào GetResponse
 * (để khách hoa tai không nhận nhầm chuỗi email cẩm nang nhẫn cầu hôn).
 *
 * CÁCH DEPLOY (1 lần):
 * 1. Tạo Google Sheet mới tên "Lead hoa tai", dòng 1: Thời gian | Họ tên | SĐT | Mẫu quan tâm | Ghi chú | Nguồn
 * 2. Extensions > Apps Script > dán file này > Save
 * 3. Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone > Deploy
 * 4. (ĐÃ LÀM 13/10/2026) URL /exec đã gắn vào LEAD_URL trong index.html
 */
var NOTIFY_EMAIL = 'huele.191084@gmail.com';

function doPost(e) {
  var p = e.parameter || {};
  var phone = (p.phone || '').trim();
  if (!phone) return out({ ok: false, error: 'missing phone' });
  var row = [new Date(), (p.name || '').trim(), phone, (p.model || '').trim(),
             (p.note || '').trim().slice(0, 500), (p.source || 'direct').trim().slice(0, 50)];
  SpreadsheetApp.getActiveSpreadsheet().getSheets()[0].appendRow(row);
  MailApp.sendEmail(NOTIFY_EMAIL, 'Lead hoa tai mới: ' + row[1] + ' - ' + phone,
    'Họ tên: ' + row[1] + '\nSĐT: ' + phone + '\nMẫu: ' + row[3] + '\nGhi chú: ' + row[4] + '\nNguồn: ' + row[5]);
  return out({ ok: true });
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
