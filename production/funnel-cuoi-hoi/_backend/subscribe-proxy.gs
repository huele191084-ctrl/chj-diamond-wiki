/**
 * CHJ Diamond — GetResponse Proxy (v4 — custom field tracking + phone)
 * Dán code này vào Google Apps Script (script.google.com)
 * Deploy as Web App: Execute as "Me", Access "Anyone"
 *
 * Thay đổi so với v3:
 * - Nhận thêm tham số "phone" từ form → lưu vào custom field "phone" của GetResponse
 * - Hàm getOrCreateField(name) dùng chung cho cả "utm_source" và "phone"
 *
 * BẢO MẬT: KHÔNG bao giờ để file .gs này trong thư mục docs/ (thư mục web công khai).
 * Khóa API chỉ được dán trực tiếp trong trình soạn thảo Apps Script, KHÔNG lưu vào repo.
 */

var GR_API_KEY     = 'api-key DÁN_KHÓA_MỚI_VÀO_ĐÂY_TRONG_APPS_SCRIPT';
var GR_CAMPAIGN_ID = 'CsodV';

/* ─── Cache customFieldId theo tên field để không gọi API nhiều lần ─── */
var CF_ID_CACHE = {};   /* { 'utm_source': id, 'phone': id } */

/**
 * Lấy hoặc tạo custom field theo tên, trả về customFieldId
 */
function getOrCreateField(fieldName) {
  if (CF_ID_CACHE[fieldName]) return CF_ID_CACHE[fieldName];

  /* Tìm custom field đã tồn tại */
  var searchResp = UrlFetchApp.fetch(
    'https://api.getresponse.com/v3/custom-fields?query[name]=' + encodeURIComponent(fieldName),
    { headers: { 'X-Auth-Token': GR_API_KEY }, muteHttpExceptions: true }
  );
  var list = JSON.parse(searchResp.getContentText());
  if (Array.isArray(list) && list.length > 0) {
    CF_ID_CACHE[fieldName] = list[0].customFieldId;
    return CF_ID_CACHE[fieldName];
  }

  /* Tạo custom field mới nếu chưa có */
  var createResp = UrlFetchApp.fetch('https://api.getresponse.com/v3/custom-fields', {
    method: 'POST',
    contentType: 'application/json',
    headers: { 'X-Auth-Token': GR_API_KEY },
    payload: JSON.stringify({
      name:   fieldName,
      type:   'text',
      hidden: 'false',
      values: []
    }),
    muteHttpExceptions: true
  });
  var field = JSON.parse(createResp.getContentText());
  if (field && field.customFieldId) {
    CF_ID_CACHE[fieldName] = field.customFieldId;
    return CF_ID_CACHE[fieldName];
  }
  return null;
}

function doPost(e) {
  try {
    var name   = (e.parameter.name   || '').trim();
    var email  = (e.parameter.email  || '').trim();
    var phone  = (e.parameter.phone  || '').trim().slice(0, 20);
    var source = (e.parameter.source || 'direct').trim().toLowerCase().slice(0, 50);

    if (!email) {
      return jsonOut({ ok: false, error: 'missing email' });
    }

    var payload = {
      name:     name,
      email:    email,
      campaign: { campaignId: GR_CAMPAIGN_ID },
      dayOfCycle: 0
    };

    /* Gắn utm_source + phone vào custom fields nếu lấy được ID */
    var cfValues = [];
    var utmId = getOrCreateField('utm_source');
    if (utmId) cfValues.push({ customFieldId: utmId, value: [source] });

    if (phone) {
      var phoneId = getOrCreateField('phone');
      if (phoneId) cfValues.push({ customFieldId: phoneId, value: [phone] });
    }
    if (cfValues.length > 0) {
      payload.customFieldValues = cfValues;
    }

    var resp = UrlFetchApp.fetch('https://api.getresponse.com/v3/contacts', {
      method: 'POST',
      contentType: 'application/json',
      headers: { 'X-Auth-Token': GR_API_KEY },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var code = resp.getResponseCode();
    var body = resp.getContentText();
    return jsonOut({ ok: code === 202 || code === 200, source: source, phone: phone, code: code, body: body });

  } catch(err) {
    return jsonOut({ ok: false, error: err.toString() });
  }
}

function doGet(e) {
  return jsonOut({ status: 'CHJ Diamond proxy OK (v4 — custom field + phone)' });
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
