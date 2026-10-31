/**
 * CHJ Diamond - Google Sheets: quản lý khách hàng + cấp dữ liệu kho kim cương cho website.
 *
 * Cài đặt (làm 1 lần), trong file Google Sheets chứa kho kim cương:
 *  1. Tiện ích mở rộng > Apps Script > dán toàn bộ file này.
 *  2. Chạy hàm setup() (cấp quyền khi được hỏi). Xem Nhật ký thực thi để lấy WEBHOOK_SECRET.
 *  3. Triển khai > Tùy chọn triển khai mới > Ứng dụng web:
 *       Thực thi với tư cách: Tôi | Ai có quyền truy cập: Bất kỳ ai. Sao chép URL /exec.
 *  4. Trên Netlify đặt SHEETS_WEBHOOK_URL = URL /exec, SHEETS_WEBHOOK_SECRET = WEBHOOK_SECRET.
 *
 * Kho kim cương: các tab còn lại (trừ tab "Khách hàng") giữ đúng định dạng file Excel gốc:
 *   STT | Shape | Measurements | Report No | Size | Color | Clarity | Cut | Polish | Symmetry | Fluorescence | Giá bán
 * Sửa giá hoặc thêm/xóa viên trong sheet là website tự cập nhật (trễ tối đa 5 phút).
 * Cột "Trạng thái chăm sóc" và "Nhân viên phụ trách" do nhân viên điền; website không ghi đè.
 */

var CUSTOMER_SHEET = 'Khách hàng';
var HEADERS = [
  'Thời gian đăng ký', 'Họ tên', 'Số điện thoại', 'Email', 'Kích thước quan tâm', 'Ngân sách',
  'Mục đích mua', 'Viên kim đã bấm tư vấn', 'Nguồn khách hàng / UTM', 'Trạng thái chăm sóc',
  'Nhân viên phụ trách', 'Mã lead', 'Đồng ý liên hệ', 'Số lần đăng ký', 'Cập nhật lần cuối'
];
var COL = { time: 1, name: 2, phone: 3, email: 4, size: 5, budget: 6, purpose: 7, interest: 8, utm: 9, status: 10, owner: 11, leadId: 12, consent: 13, count: 14, updated: 15 };
var STATUSES = ['Mới', 'Đã gọi', 'Đang tư vấn', 'Hẹn xem hàng', 'Đã chốt', 'Không phù hợp'];

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(CUSTOMER_SHEET) || ss.insertSheet(CUSTOMER_SHEET);
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold').setBackground('#0B1F3A').setFontColor('#FFFFFF');
  sh.setFrozenRows(1);
  sh.getRange(2, COL.phone, 2000, 1).setNumberFormat('@');
  sh.getRange(2, COL.status, 2000, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(false).build());
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('WEBHOOK_SECRET')) {
    props.setProperty('WEBHOOK_SECRET', Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''));
  }
  Logger.log('WEBHOOK_SECRET = ' + props.getProperty('WEBHOOK_SECRET'));
  Logger.log('Tab "' + CUSTOMER_SHEET + '" đã sẵn sàng. Hãy để tab này riêng tư: không chia sẻ/xuất bản công khai.');
}

function secretOk_(given) {
  var s = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET') || '';
  given = String(given || '');
  if (!s || s.length !== given.length) return false;
  var diff = 0;
  for (var i = 0; i < s.length; i++) diff |= s.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Chặn công thức: ô bắt đầu bằng = + - @ sẽ bị Sheets hiểu là công thức.
function safe_(v) {
  v = String(v == null ? '' : v);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function findRow_(sh, col, value) {
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var vals = sh.getRange(2, col, last - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) if (String(vals[i][0]) === String(value)) return i + 2;
  return 0;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var body = JSON.parse(e.postData.contents);
    if (!secretOk_(body.secret)) return out_({ ok: false, error: 'unauthorized' });
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CUSTOMER_SHEET);
    if (!sh) return out_({ ok: false, error: 'Chua chay setup()' });
    var now = new Date();

    if (body.action === 'lead') {
      var L = body.lead, row = findRow_(sh, COL.phone, L.phone);
      if (row) { // trùng số điện thoại: cập nhật, không thêm dòng mới
        sh.getRange(row, COL.name).setValue(safe_(L.name));
        if (L.email) sh.getRange(row, COL.email).setValue(safe_(L.email));
        sh.getRange(row, COL.size).setValue(safe_(L.size));
        sh.getRange(row, COL.budget).setValue(safe_(L.budget));
        sh.getRange(row, COL.purpose).setValue(safe_(L.purpose));
        sh.getRange(row, COL.count).setValue(L.submissions);
        sh.getRange(row, COL.updated).setValue(now);
      } else {
        sh.appendRow([now, safe_(L.name), '', safe_(L.email), safe_(L.size), safe_(L.budget), safe_(L.purpose),
          '', safe_(L.utm), 'Mới', '', L.id, L.consent ? 'Có' : 'Không', L.submissions, now]);
        row = sh.getLastRow();
        sh.getRange(row, COL.phone).setNumberFormat('@').setValue(L.phone);
      }
      return out_({ ok: true });
    }

    if (body.action === 'interest') {
      var r = findRow_(sh, COL.phone, body.phone);
      if (!r) return out_({ ok: false, error: 'not found' });
      var cell = sh.getRange(r, COL.interest), cur = String(cell.getValue());
      if (cur.indexOf(body.interest) === -1) cell.setValue(safe_(cur ? cur + '\n' + body.interest : body.interest));
      sh.getRange(r, COL.updated).setValue(now);
      return out_({ ok: true });
    }
    return out_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  if (!e || !e.parameter || e.parameter.action !== 'stock' || !secretOk_(e.parameter.secret)) {
    return out_({ ok: false, error: 'unauthorized' });
  }
  var items = [];
  SpreadsheetApp.getActiveSpreadsheet().getSheets().forEach(function (sh) {
    if (sh.getName() === CUSTOMER_SHEET) return;
    var data = sh.getDataRange().getValues(), h = -1, i;
    for (i = 0; i < Math.min(data.length, 10); i++) {
      if (String(data[i][3]).toLowerCase().indexOf('report') > -1) { h = i; break; }
    }
    if (h < 0) return;
    for (i = h + 1; i < data.length; i++) {
      var r = data[i], price = Number(r[11]), ct = Number(r[4]);
      var m = String(r[2]).match(/^(\d+(?:\.\d+)?)/);
      var color = String(r[5]).trim(), clarity = String(r[6]).trim();
      if (!m || !color || !clarity || !(price > 0) || !(ct > 0)) continue;
      var fl = String(r[10]).trim();
      items.push({
        id: String(r[3]) + '|' + String(r[2]), ly: Math.round(parseFloat(m[1]) * 10) / 10, ms: String(r[2]), gia_no: String(r[3]), ct: ct,
        color: color, clarity: clarity, cut: String(r[7]).trim(), pol: String(r[8]).trim(), sym: String(r[9]).trim(),
        fl: /^n/i.test(fl) ? 'N' : fl, price: price
      });
    }
  });
  return out_({ ok: true, items: items });
}
