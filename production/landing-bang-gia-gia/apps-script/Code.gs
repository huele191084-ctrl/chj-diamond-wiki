/**
 * CHJ Diamond – Backend trên Google Apps Script (gắn vào file Google Sheets kho kim cương).
 *
 * Việc của script:
 *  - Nhận form khách hàng, kiểm tra, chống spam/trùng, lưu vào tab "Khách hàng", cấp token xem bảng giá.
 *  - Cấp bảng giá kim cương (từ chính các tab kho) CHỈ khi có token hợp lệ.
 *  - Kiểm soát tồn kho: cột Trạng thái (Còn hàng / Đang giữ / Đã bán / Ẩn) + tab "Tổng quan tồn kho".
 *  - Ghi viên khách bấm tư vấn vào hồ sơ khách.
 *
 * Hướng dẫn cài đặt: xem README.md. Chạy setup() đúng 1 lần, sau đó triển khai Web app.
 */

var CUSTOMER_SHEET = 'Khách hàng';
var SUMMARY_SHEET = 'Tổng quan tồn kho';
var NON_STOCK = [CUSTOMER_SHEET, SUMMARY_SHEET];

var HEADERS = [
  'Thời gian đăng ký', 'Họ tên', 'Số điện thoại', 'Email', 'Kích thước quan tâm', 'Ngân sách',
  'Mục đích mua', 'Viên kim đã bấm tư vấn', 'Nguồn khách hàng / UTM', 'Trạng thái chăm sóc',
  'Nhân viên phụ trách', 'Mã lead', 'Đồng ý liên hệ', 'Số lần đăng ký', 'Cập nhật lần cuối'
];
var COL = { time: 1, name: 2, phone: 3, email: 4, size: 5, budget: 6, purpose: 7, interest: 8, utm: 9, status: 10, owner: 11, leadId: 12, consent: 13, count: 14, updated: 15 };
var CARE_STATUSES = ['Mới', 'Đã gọi', 'Đang tư vấn', 'Hẹn xem hàng', 'Đã chốt', 'Không phù hợp'];

var STOCK_STATUSES = ['Còn hàng', 'Đang giữ', 'Đã bán', 'Ẩn'];
var STOCK_EXTRA = ['Trạng thái', 'Giữ đến', 'Ghi chú nội bộ'];

var SIZES = ['3.6 ly', '4 ly', '4.5 ly', '4.6–4.9 ly', '5 ly', '5.4 ly', '5.8 ly', '6 ly', 'Khác'];
var BUDGETS = ['Dưới 10 triệu', '10–20 triệu', '20–30 triệu', '30–50 triệu', '50–100 triệu', 'Trên 100 triệu'];
var PURPOSES = ['Nhẫn cầu hôn', 'Nhẫn đeo hằng ngày', 'Bông tai', 'Viên kim cương rời', 'Quà tặng', 'Nhu cầu khác'];
var PHONE_RE = /^0(3|5|7|8|9)\d{8}$/;
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
var TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
var MAX_LEADS_PER_10_MIN = 40;   // trần toàn hệ thống, chặn bơm spam hàng loạt
var PHONE_COOLDOWN_SEC = 20;     // cùng một số không gửi lại trong 20 giây
var TEST_PREFIX = 'ZZ TEST';

/* ───────────────────────── Cài đặt ───────────────────────── */

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var props = PropertiesService.getScriptProperties();
  ['TOKEN_SECRET', 'ADMIN_KEY'].forEach(function (k) {
    if (!props.getProperty(k)) props.setProperty(k, Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''));
  });

  var sh = ss.getSheetByName(CUSTOMER_SHEET) || ss.insertSheet(CUSTOMER_SHEET);
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold').setBackground('#0B1F3A').setFontColor('#FFFFFF');
  sh.setFrozenRows(1);
  sh.getRange(2, COL.phone, 5000, 1).setNumberFormat('@');
  sh.getRange(2, COL.status, 5000, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(CARE_STATUSES, true).setAllowInvalid(false).build());

  prepareStockSheets_();
  refreshSummary();
  installTrigger_();

  Logger.log('ADMIN_KEY = ' + props.getProperty('ADMIN_KEY'));
  Logger.log('Giữ ADMIN_KEY bí mật: dùng cho công cụ kiểm tra tools/verify.mjs. KHÔNG dán vào website.');
  Logger.log('Tab "' + CUSTOMER_SHEET + '" chứa dữ liệu khách: không chia sẻ/xuất bản công khai.');
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('CHJ')
    .addItem('Chuẩn hóa tab kho (thêm cột Trạng thái)', 'prepareStockSheets_')
    .addItem('Ẩn các dòng kho bị trùng', 'hideDuplicates')
    .addItem('Làm mới Tổng quan tồn kho', 'refreshSummary')
    .addToUi();
}

function installTrigger_() {
  var has = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'refreshSummary'; });
  if (!has) ScriptApp.newTrigger('refreshSummary').timeBased().everyDays(1).atHour(6).create();
}

/* ───────────────────────── Kho kim cương ───────────────────────── */

function stockSheets_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheets().filter(function (sh) {
    return NON_STOCK.indexOf(sh.getName()) === -1;
  });
}

// Tìm dòng tiêu đề (có chữ "report" ở cột D) trong 10 dòng đầu; -1 nếu không phải tab kho.
function headerRow_(data) {
  for (var i = 0; i < Math.min(data.length, 10); i++) {
    if (String(data[i][3]).toLowerCase().indexOf('report') > -1) return i;
  }
  return -1;
}

function prepareStockSheets_() {
  stockSheets_().forEach(function (sh) {
    var data = sh.getDataRange().getValues(), h = headerRow_(data);
    if (h < 0) return;
    var width = data[h].length, startCol = -1;
    STOCK_EXTRA.forEach(function (name) {
      var idx = data[h].indexOf(name);
      if (idx === -1) {
        width++;
        sh.getRange(h + 1, width).setValue(name).setFontWeight('bold');
        idx = width - 1;
      }
      if (name === 'Trạng thái') startCol = idx + 1;
    });
    var rows = Math.max(sh.getLastRow() - h, 1);
    sh.getRange(h + 2, startCol, rows, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(STOCK_STATUSES, true).setAllowInvalid(false).build());
  });
}

function toPrice_(v) {
  if (typeof v === 'number') return v;
  var n = parseInt(String(v).replace(/[^\d]/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

function isPast_(d) {
  if (!(d instanceof Date)) return false;
  var t = new Date(); t.setHours(0, 0, 0, 0);
  return d.getTime() < t.getTime();
}

// Đọc toàn bộ kho. Mỗi viên có st: 'ok' (còn hàng) | 'hold' (đang giữ); Đã bán/Ẩn không được trả về.
function readStock_() {
  var items = [], seen = {}, dupes = [], bad = [], perTab = [];
  stockSheets_().forEach(function (sh) {
    var data = sh.getDataRange().getValues(), h = headerRow_(data);
    if (h < 0) return;
    var stCol = data[h].indexOf('Trạng thái'), untilCol = data[h].indexOf('Giữ đến');
    var tab = { name: sh.getName(), total: 0, ok: 0, hold: 0, sold: 0, hidden: 0, min: 0, max: 0 };
    for (var i = h + 1; i < data.length; i++) {
      var r = data[i];
      if (r.slice(0, 12).join('') === '') continue;
      var m = String(r[2]).match(/^(\d+(?:\.\d+)?)/);
      var price = toPrice_(r[11]), ct = Number(r[4]);
      var color = String(r[5]).trim(), clarity = String(r[6]).trim();
      if (!m || !color || !clarity || !(price > 0) || !(ct > 0)) {
        // Dòng tiêu đề lặp/ghi chú/số 0 rời rạc thì bỏ qua; dòng có số đo hoặc mã GIA mà thiếu dữ liệu thì báo lỗi.
        if (String(r[2]).trim() || String(r[3]).trim()) {
          if (!/measurements|report/i.test(String(r[2]) + String(r[3]))) bad.push(sh.getName() + ' dòng ' + (i + 1));
        }
        continue;
      }
      var status = stCol > -1 ? String(r[stCol]).trim() : '';
      if (status === 'Đang giữ' && untilCol > -1 && isPast_(r[untilCol])) status = 'Còn hàng';
      tab.total++;
      if (status === 'Đã bán') { tab.sold++; continue; }
      if (status === 'Ẩn') { tab.hidden++; continue; }
      var id = String(r[3]).trim() + '|' + String(r[2]).trim();
      if (seen[id]) { dupes.push(sh.getName() + ' dòng ' + (i + 1) + ' trùng ' + id); continue; } // web không bao giờ hiện 2 lần cùng một viên
      seen[id] = true;
      var hold = status === 'Đang giữ';
      hold ? tab.hold++ : tab.ok++;
      tab.min = tab.min ? Math.min(tab.min, price) : price;
      tab.max = Math.max(tab.max, price);
      var fl = String(r[10]).trim();
      items.push({
        id: id, shape: String(r[1]).trim() || 'Round', ly: Math.round(parseFloat(m[1]) * 10) / 10, ms: String(r[2]).trim(),
        gia_no: String(r[3]).trim(), ct: ct, color: color, clarity: clarity, cut: String(r[7]).trim(), pol: String(r[8]).trim(),
        sym: String(r[9]).trim(), fl: /^n/i.test(fl) ? 'N' : fl, price: price, st: hold ? 'hold' : 'ok'
      });
    }
    perTab.push(tab);
  });
  return { items: items, dupes: dupes, bad: bad, perTab: perTab };
}

// Số liệu công khai, không lộ từng viên: khoảng giá và số viên nhóm 5 ly còn hàng.
function publicStats_() {
  var s = readStock_().items.filter(function (x) { return x.ly === 5 && x.st === 'ok'; });
  if (!s.length) return { ok: true, ly5: null };
  var p = s.map(function (x) { return x.price; });
  return { ok: true, ly5: { count: s.length, min: Math.min.apply(null, p), max: Math.max.apply(null, p) } };
}

function refreshSummary() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SUMMARY_SHEET) || ss.insertSheet(SUMMARY_SHEET);
  var s = readStock_();
  sh.clear();
  var rows = [['Tab kho', 'Tổng dòng hợp lệ', 'Còn hàng', 'Đang giữ', 'Đã bán', 'Ẩn', 'Giá thấp nhất (còn/giữ)', 'Giá cao nhất (còn/giữ)']];
  s.perTab.forEach(function (t) { rows.push([t.name, t.total, t.ok, t.hold, t.sold, t.hidden, t.min, t.max]); });
  rows.push(['']);
  rows.push(['Cập nhật lúc', new Date()]);
  rows.push(['Mã GIA + kích thước trùng', s.dupes.length ? s.dupes.join('\n') : 'Không có']);
  rows.push(['Dòng thiếu giá/màu/độ sạch (bị bỏ qua)', s.bad.length ? s.bad.join('\n') : 'Không có']);
  sh.getRange(1, 1, rows.length, 8).setValues(rows.map(function (r) { while (r.length < 8) r.push(''); return r; }));
  sh.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#0B1F3A').setFontColor('#FFFFFF');
}

// Ẩn các dòng lặp lại cùng một viên (cùng mã GIA + kích thước + cùng giá). Dòng trùng nhưng KHÁC giá được giữ nguyên để người quản lý quyết định.
function hideDuplicates() {
  var seen = {}, hidden = 0;
  stockSheets_().forEach(function (sh) {
    var data = sh.getDataRange().getValues(), h = headerRow_(data);
    if (h < 0) return;
    var stCol = data[h].indexOf('Trạng thái'), noteCol = data[h].indexOf('Ghi chú nội bộ');
    if (stCol < 0) return;
    for (var i = h + 1; i < data.length; i++) {
      var r = data[i], price = toPrice_(r[11]);
      if (!(price > 0) || !String(r[3]).trim() || !/^\d/.test(String(r[2]).trim())) continue;
      var status = String(r[stCol]).trim();
      if (status === 'Đã bán' || status === 'Ẩn') continue;
      var id = String(r[3]).trim() + '|' + String(r[2]).trim();
      if (!seen[id]) { seen[id] = price; continue; }
      if (seen[id] === price) {
        sh.getRange(i + 1, stCol + 1).setValue('Ẩn');
        if (noteCol > -1) sh.getRange(i + 1, noteCol + 1).setValue('Dòng trùng, tự ẩn ' + new Date().toLocaleDateString('vi-VN'));
        hidden++;
      }
    }
  });
  refreshSummary();
  Logger.log('Đã ẩn ' + hidden + ' dòng trùng.');
  return hidden;
}

/* ───────────────────────── Token ───────────────────────── */

function secret_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }

function same_(a, b) {
  a = String(a || ''); b = String(b || '');
  if (!a || a.length !== b.length) return false;
  var d = 0;
  for (var i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function sign_(payload) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload, secret_('TOKEN_SECRET')));
}

function issueToken_(phone) {
  var payload = Utilities.base64EncodeWebSafe(JSON.stringify({ p: phone, exp: Date.now() + TOKEN_TTL_MS }));
  return payload + '.' + sign_(payload);
}

function readToken_(token) {
  var parts = String(token || '').split('.');
  if (parts.length !== 2 || !secret_('TOKEN_SECRET') || !same_(sign_(parts[0]), parts[1])) return null;
  try {
    var p = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
    return p.exp > Date.now() ? p : null;
  } catch (e) { return null; }
}

/* ───────────────────────── Khách hàng ───────────────────────── */

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max); }

// Ô bắt đầu bằng = + - @ sẽ bị Sheets hiểu là công thức: chặn lại.
function safe_(v) { v = String(v == null ? '' : v); return /^[=+\-@]/.test(v) ? "'" + v : v; }

function findRow_(sh, col, value) {
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var vals = sh.getRange(2, col, last - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) if (String(vals[i][0]).replace(/^'/, '') === String(value)) return i + 2;
  return 0;
}

function utmString_(u) {
  u = u || {};
  var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'], out = [];
  keys.forEach(function (k) { if (u[k]) out.push(k + '=' + clean_(u[k], 80)); });
  if (u.referrer) out.push('ref=' + clean_(u.referrer, 120));
  return out.join(' | ');
}

function submitLead_(b) {
  if (clean_(b.website, 50)) return { ok: false, error: 'Dữ liệu không hợp lệ.' }; // ô ẩn dành cho bot
  var name = clean_(b.name, 100), email = clean_(b.email, 120);
  var phone = clean_(b.phone, 20).replace(/[\s.\-()]/g, '').replace(/^\+?84/, '0');
  var size = clean_(b.size, 30), budget = clean_(b.budget, 30), purpose = clean_(b.purpose, 40);
  var errors = {};
  if (name.length < 2) errors.name = 'Vui lòng nhập họ và tên.';
  if (!PHONE_RE.test(phone)) errors.phone = 'Số điện thoại chưa đúng (VD: 0912 345 678).';
  if (email && !EMAIL_RE.test(email)) errors.email = 'Email chưa đúng định dạng.';
  if (SIZES.indexOf(size) < 0) errors.size = 'Vui lòng chọn kích thước.';
  if (BUDGETS.indexOf(budget) < 0) errors.budget = 'Vui lòng chọn ngân sách.';
  if (PURPOSES.indexOf(purpose) < 0) errors.purpose = 'Vui lòng chọn mục đích.';
  if (b.consent !== true) errors.consent = 'Vui lòng đồng ý để CHJ liên hệ tư vấn.';
  for (var k in errors) return { ok: false, errors: errors };

  var cache = CacheService.getScriptCache();
  var bucket = 'rl_' + Math.floor(Date.now() / 600000);
  var n = parseInt(cache.get(bucket) || '0', 10);
  if (n >= MAX_LEADS_PER_10_MIN) return { ok: false, error: 'Hệ thống đang quá tải, vui lòng thử lại sau ít phút hoặc nhắn Zalo 0912 268 667.' };
  if (cache.get('ph_' + phone)) return { ok: false, error: 'Bạn vừa gửi thông tin xong, vui lòng đợi vài giây rồi thử lại.' };
  cache.put(bucket, String(n + 1), 700);
  cache.put('ph_' + phone, '1', PHONE_COOLDOWN_SEC);

  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CUSTOMER_SHEET);
  if (!sh) return { ok: false, error: 'Hệ thống chưa sẵn sàng.' };
  var now = new Date(), row = findRow_(sh, COL.phone, phone);
  if (row) { // cùng số điện thoại: cập nhật hồ sơ, không tạo dòng mới
    sh.getRange(row, COL.name).setValue(safe_(name));
    if (email) sh.getRange(row, COL.email).setValue(safe_(email));
    sh.getRange(row, COL.size).setValue(safe_(size));
    sh.getRange(row, COL.budget).setValue(safe_(budget));
    sh.getRange(row, COL.purpose).setValue(safe_(purpose));
    sh.getRange(row, COL.count).setValue((Number(sh.getRange(row, COL.count).getValue()) || 1) + 1);
    sh.getRange(row, COL.updated).setValue(now);
  } else {
    sh.appendRow([now, safe_(name), '', safe_(email), safe_(size), safe_(budget), safe_(purpose), '',
      safe_(utmString_(b.utm)), 'Mới', '', Utilities.getUuid(), 'Có', 1, now]);
    row = sh.getLastRow();
    sh.getRange(row, COL.phone).setNumberFormat('@').setValue(phone);
  }
  SpreadsheetApp.flush();
  // Chỉ báo thành công khi dòng đã thực sự nằm trong Sheet.
  if (findRow_(sh, COL.phone, phone) !== row) return { ok: false, error: 'Chưa lưu được thông tin. Vui lòng thử lại.' };
  return { ok: true, token: issueToken_(phone) };
}

function trackInterest_(b) {
  var tok = readToken_(b.token);
  if (!tok) return { ok: false, error: 'expired' };
  var item = readStock_().items.filter(function (x) { return x.id === String(b.itemId); })[0];
  if (!item) return { ok: false, error: 'not found' };
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CUSTOMER_SHEET);
  var r = findRow_(sh, COL.phone, tok.p);
  if (!r) return { ok: false, error: 'lead not found' };
  var text = item.ly.toFixed(1) + ' ly ' + item.color + ' ' + item.clarity + ' GIA ' + item.gia_no;
  var cell = sh.getRange(r, COL.interest), cur = String(cell.getValue());
  if (cur.indexOf(text) === -1) cell.setValue(safe_(cur ? cur + '\n' + text : text));
  sh.getRange(r, COL.updated).setValue(new Date());
  return { ok: true };
}

function deleteTests_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CUSTOMER_SHEET), removed = 0;
  for (var r = sh.getLastRow(); r >= 2; r--) {
    if (String(sh.getRange(r, COL.name).getValue()).indexOf(TEST_PREFIX) === 0) { sh.deleteRow(r); removed++; }
  }
  return { ok: true, removed: removed };
}

/* ───────────────────────── Web app ───────────────────────── */

function doGet(e) {
  var a = e && e.parameter ? e.parameter.action : '';
  if (a === 'stats') return out_(publicStats_());
  if (a === 'ping') return out_({ ok: true, ready: !!SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CUSTOMER_SHEET) && !!secret_('TOKEN_SECRET') });
  return out_({ ok: false, error: 'unknown action' });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    var b = JSON.parse(e.postData.contents);
    switch (b.action) {
      case 'lead': return out_(submitLead_(b));
      case 'stock':
        if (!readToken_(b.token)) return out_({ ok: false, error: 'expired' });
        return out_({ ok: true, items: readStock_().items });
      case 'interest': return out_(trackInterest_(b));
      case 'diag': // chỉ dành cho công cụ kiểm tra của chủ web
        if (!same_(secret_('ADMIN_KEY'), b.adminKey)) return out_({ ok: false, error: 'unauthorized' });
        var s = readStock_();
        return out_({ ok: true, tabs: s.perTab, dupes: s.dupes, bad: s.bad, available: s.items.length });
      case 'delete_tests':
        if (!same_(secret_('ADMIN_KEY'), b.adminKey)) return out_({ ok: false, error: 'unauthorized' });
        return out_(deleteTests_());
      case 'test_lead': // như 'lead' nhưng bỏ giới hạn thời gian để công cụ kiểm tra chạy nhanh
        if (!same_(secret_('ADMIN_KEY'), b.adminKey)) return out_({ ok: false, error: 'unauthorized' });
        CacheService.getScriptCache().remove('ph_' + clean_(b.phone, 20).replace(/[\s.\-()]/g, '').replace(/^\+?84/, '0'));
        return out_(submitLead_(b));
    }
    return out_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return out_({ ok: false, error: 'Lỗi hệ thống.' });
  } finally {
    lock.releaseLock();
  }
}
