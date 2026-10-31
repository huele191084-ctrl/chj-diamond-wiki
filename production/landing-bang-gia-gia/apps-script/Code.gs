/**
 * CHJ Diamond – Backend trên Google Apps Script.
 *
 * Gắn vào một Google Sheet RIÊNG của CHJ (chứa tab "Khách hàng"). Kho kim cương được ĐỌC từ sheet
 * "CÁC VIÊN KIM CƯƠNG GIA CÓ SẴN TẠI CHJ" (theo ID bên dưới), không sửa gì trong sheet đó.
 *
 *  - Nhận form khách hàng: kiểm tra, chống spam/trùng, lưu tab "Khách hàng", cấp token xem bảng giá.
 *  - Cấp bảng giá CHỈ khi có token hợp lệ. Chỉ các tab kích thước (3.6LY ... 6LY) và "K PHẢI TRÒN" được đọc;
 *    tab KIM TẤM (giá nhập) và cột NGƯỜI BÁN không bao giờ được gửi ra ngoài.
 *  - Viên đã có tên người bán/ngày bán thì tự ẩn khỏi web; viên có chữ "giữ/cọc" hiện nhãn "Đang có khách giữ".
 *  - Ghi viên khách bấm tư vấn vào hồ sơ khách.
 */

var STOCK_SHEET_ID = '1j_uo1JJWY9vtCiRlc8-ScJSx2TYnTUu_wNZqjS0L45w';
var CUSTOMER_SHEET = 'Khách hàng';
var SUMMARY_SHEET = 'Tổng quan tồn kho';
var FANCY_TABS = ['K PHẢI TRÒN'];

var HEADERS = [
  'Thời gian đăng ký', 'Họ tên', 'Số điện thoại', 'Email', 'Kích thước quan tâm', 'Ngân sách',
  'Mục đích mua', 'Viên kim đã bấm tư vấn', 'Nguồn khách hàng / UTM', 'Trạng thái chăm sóc',
  'Nhân viên phụ trách', 'Mã lead', 'Đồng ý liên hệ', 'Số lần đăng ký', 'Cập nhật lần cuối'
];
var COL = { time: 1, name: 2, phone: 3, email: 4, size: 5, budget: 6, purpose: 7, interest: 8, utm: 9, status: 10, owner: 11, leadId: 12, consent: 13, count: 14, updated: 15 };
var CARE_STATUSES = ['Mới', 'Đã gọi', 'Đang tư vấn', 'Hẹn xem hàng', 'Đã chốt', 'Không phù hợp'];

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
  if (!ss) throw new Error('Dự án này chưa gắn với Google Sheet. Hãy đóng tab này, mở Sheet "CHJ – Khách hàng", rồi vào Tiện ích mở rộng > Apps Script và dán lại mã.');
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

  var s = readStock_(); // báo lỗi ngay nếu tài khoản chưa có quyền xem sheet kho
  refreshSummary();
  installTrigger_();

  Logger.log('Đọc được kho: ' + s.items.length + ' viên đang bán.');
  Logger.log('ADMIN_KEY = ' + props.getProperty('ADMIN_KEY'));
  Logger.log('Giữ ADMIN_KEY bí mật: dùng cho công cụ kiểm tra tools/verify.mjs. KHÔNG dán vào website.');
  Logger.log('Tab "' + CUSTOMER_SHEET + '" chứa dữ liệu khách: không chia sẻ/xuất bản công khai.');
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('CHJ').addItem('Làm mới Tổng quan tồn kho', 'refreshSummary').addToUi();
}

function installTrigger_() {
  var has = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'refreshSummary'; });
  if (!has) ScriptApp.newTrigger('refreshSummary').timeBased().everyDays(1).atHour(6).create();
}

/* ───────────────────────── Kho kim cương ───────────────────────── */

function up_(v) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().toUpperCase(); }
function toNum_(v) { return parseFloat(String(v).replace(',', '.')); }
function toPrice_(v) {
  if (typeof v === 'number') return v;
  var n = parseInt(String(v).replace(/[^\d]/g, ''), 10); // 6,500,000 / 23.000.000 / 6500000 đều ra số nguyên VND
  return isNaN(n) ? 0 : n;
}

// Chỉ tab kích thước ("3.6LY", "4.6 - 4.9LY"...) và tab kim không tròn. KIM TẤM và mọi tab khác bị bỏ qua.
function tabInfo_(name) {
  var n = up_(name).replace(/\s+/g, '');
  if (FANCY_TABS.indexOf(up_(name)) > -1) return { fancy: true, grp: 'Kim không tròn' };
  var m = n.match(/^(\d+(?:[.,]\d+)?)(?:-(\d+(?:[.,]\d+)?))?LY$/);
  if (!m) return null;
  var a = toNum_(m[1]), b = m[2] ? toNum_(m[2]) : null;
  return { fancy: false, lo: a, hi: b, grp: b ? a + '–' + b + ' ly' : a + ' ly' };
}

function normFl_(s) {
  s = up_(s);
  if (!s || s === 'NONE' || s === 'N' || s === 'NON') return 'N';
  return s.toLowerCase().replace(/(^|\s)\S/g, function (c) { return c.toUpperCase(); }); // Faint, Medium, Strong Blue
}

function parseFancySize_(a) {
  var m = up_(a).match(/(\d+(?:[.,]\d+)?)\s*(?:LY|LI)/);
  return m ? toNum_(m[1]) : 0;
}

function stockSpreadsheet_() { return SpreadsheetApp.openById(STOCK_SHEET_ID); }

// Đọc kho. st: 'ok' (còn) | 'hold' (đang giữ). Đã bán / thiếu mã GIA không được trả về web.
function readStock_() {
  var items = [], seen = {}, dupes = [], notes = [], mismatch = [], perTab = [];
  stockSpreadsheet_().getSheets().forEach(function (sh) {
    var info = tabInfo_(sh.getName());
    if (!info) return;
    var data = sh.getDataRange().getValues(), h = -1, i;
    for (i = 0; i < Math.min(data.length, 6); i++) if (up_(data[i][1]).indexOf('ĐỘ SẠCH') > -1) { h = i; break; }
    if (h < 0) return;
    var stated = (String(data[h][7]).match(/(\d+)/) || [])[1];
    var tab = { name: sh.getName(), total: 0, ok: 0, hold: 0, sold: 0, min: 0, max: 0, stated: stated ? parseInt(stated, 10) : null };
    for (i = h + 1; i < data.length; i++) {
      var r = data[i], where = sh.getName() + ' dòng ' + (i + 1);
      var price = toPrice_(r[3]), b = String(r[1]).trim();
      if (!b && !price) continue;
      if (!b || !(price > 0)) { notes.push(where + ': thiếu độ sạch hoặc giá, bị bỏ qua'); continue; }
      tab.total++;

      // Cột A: màu, hoặc "4,75 - H" (kích thước - màu); tab kim không tròn: "OVAL - G - 6,6LI"
      var a = up_(r[0]), color = '', ly = 0, shape = 'Round', am;
      var tokens = b.split(/\s+-\s+/).map(function (t) { return t.trim(); });
      if (info.fancy) {
        var sm = a.match(/^(OVAL|RADIANT|RADIAN|PEAR|CUSHION|PRINCESS|EMERALD|HEART|MARQUISE)/);
        shape = sm ? sm[1].charAt(0) + sm[1].slice(1).toLowerCase() : 'Fancy';
        if (shape === 'Radian') shape = 'Radiant';
        ly = parseFancySize_(a);
        var cm = a.match(/-\s*([A-Z])\s*-/);
        color = cm ? cm[1] : '';
      } else if ((am = a.match(/^(\d+(?:[.,]\d+)?)\s*-\s*([A-Z]{1,2})$/))) {
        ly = toNum_(am[1]); color = am[2];
      } else if (/^[A-Z]{1,2}$/.test(a)) {
        color = a; ly = info.lo;
        if (info.hi) notes.push(where + ': tab ' + info.grp + ' nhưng chưa ghi kích thước từng viên, tạm tính ' + info.lo + ' ly');
      }
      if (!color && tokens.length >= 3 && /^[A-Z]{1,2}$/i.test(tokens[0])) color = tokens.shift().toUpperCase();
      var clarity = (tokens[0] || '').toUpperCase(), fl = normFl_(tokens.slice(1).join(' '));
      var gia = String(r[2]).replace(/\D/g, '');
      if (!color || !clarity || !(ly > 0)) { notes.push(where + ': không đọc được màu/độ sạch/kích thước, bị bỏ qua'); continue; }
      if (gia.length !== 10) { notes.push(where + ': thiếu mã GIA 10 số, không đưa lên web'); continue; }

      // Trạng thái: có tên người bán / ngày bán thì coi là đã bán (ẩn); "giữ/cọc" thì Đang giữ
      var sellerTxt = String(r[4]).trim(), extra = String(r[5]).trim() + ' ' + String(r[6]).trim();
      var hold = /giữ|cọc/i.test(sellerTxt + ' ' + extra);
      var sold = !hold && (sellerTxt !== '' || /\d\/\d|bán|tháng/i.test(extra));
      if (extra.trim() && !sold && !hold) notes.push(where + ': ghi chú "' + extra.trim() + '" (đang vẫn hiển thị là còn hàng)');
      if (sold) { tab.sold++; continue; }

      if (seen[gia]) { dupes.push(where + ' trùng mã GIA ' + gia); continue; }
      seen[gia] = true;
      hold ? tab.hold++ : tab.ok++;
      tab.min = tab.min ? Math.min(tab.min, price) : price;
      tab.max = Math.max(tab.max, price);
      items.push({ id: gia, shape: shape, grp: info.grp, ly: ly, color: color, clarity: clarity, fl: fl, gia_no: gia, price: price, st: hold ? 'hold' : 'ok' });
    }
    if (tab.stated !== null && tab.stated !== tab.ok + tab.hold) {
      mismatch.push(sh.getName() + ': ghi "TỔNG CÒN ' + tab.stated + '" nhưng thực tế còn ' + (tab.ok + tab.hold) + ' viên');
    }
    perTab.push(tab);
  });
  return { items: items, dupes: dupes, notes: notes, mismatch: mismatch, perTab: perTab };
}

// Số liệu công khai (không lộ từng viên): nhóm kích thước có chênh lệch giá lớn nhất trong số viên còn hàng.
function publicStats_() {
  var by = {};
  readStock_().items.forEach(function (x) {
    if (x.st !== 'ok' || x.shape !== 'Round') return;
    (by[x.grp] = by[x.grp] || []).push(x.price);
  });
  var best = null;
  Object.keys(by).forEach(function (g) {
    if (by[g].length < 2) return;
    var mn = Math.min.apply(null, by[g]), mx = Math.max.apply(null, by[g]);
    if (mx > mn && (!best || mx - mn > best.max - best.min)) best = { grp: g, count: by[g].length, min: mn, max: mx };
  });
  return { ok: true, spread: best };
}

function refreshSummary() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SUMMARY_SHEET) || ss.insertSheet(SUMMARY_SHEET);
  var s = readStock_();
  sh.clear();
  var rows = [['Tab kho', 'Dòng hợp lệ', 'Còn hàng', 'Đang giữ', 'Đã bán', 'Giá thấp nhất', 'Giá cao nhất', 'Ô "TỔNG CÒN" ghi']];
  s.perTab.forEach(function (t) { rows.push([t.name, t.total, t.ok, t.hold, t.sold, t.min, t.max, t.stated === null ? '' : t.stated]); });
  rows.push(['']);
  rows.push(['Cập nhật lúc', new Date()]);
  rows.push(['Ô TỔNG CÒN lệch số thực tế', s.mismatch.length ? s.mismatch.join('\n') : 'Không có']);
  rows.push(['Trùng mã GIA', s.dupes.length ? s.dupes.join('\n') : 'Không có']);
  rows.push(['Dòng cần xem lại / ghi chú', s.notes.length ? s.notes.join('\n') : 'Không có']);
  sh.getRange(1, 1, rows.length, 8).setValues(rows.map(function (r) { while (r.length < 8) r.push(''); return r; }));
  sh.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#0B1F3A').setFontColor('#FFFFFF');
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

function lyStr_(ly) { return String(Math.round(ly * 100) / 100); }

function trackInterest_(b) {
  var tok = readToken_(b.token);
  if (!tok) return { ok: false, error: 'expired' };
  var item = readStock_().items.filter(function (x) { return x.id === String(b.itemId); })[0];
  if (!item) return { ok: false, error: 'not found' };
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CUSTOMER_SHEET);
  var r = findRow_(sh, COL.phone, tok.p);
  if (!r) return { ok: false, error: 'lead not found' };
  var text = lyStr_(item.ly) + ' ly ' + item.color + ' ' + item.clarity + ' GIA ' + item.gia_no;
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
        return out_({ ok: true, tabs: s.perTab, dupes: s.dupes, notes: s.notes, mismatch: s.mismatch, available: s.items.length });
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
