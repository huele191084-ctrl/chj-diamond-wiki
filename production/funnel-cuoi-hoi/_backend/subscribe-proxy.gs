/**
 * CHJ Diamond — GetResponse Proxy (v2 — có source tracking)
 * Dán code này vào Google Apps Script (script.google.com)
 * Deploy as Web App: Execute as "Me", Access "Anyone"
 */

var GR_API_KEY    = 'api-key jws743opqynugsj786mrojhfm58yna22';
var GR_CAMPAIGN_ID = 'CsodV';

/* ─── Cache tag ID theo tên ─── */
var TAG_CACHE = {};   /* { instagram: 'abc123', tiktok: 'def456', … } */

/** Lấy hoặc tạo tag theo tên, trả về tagId */
function getOrCreateTag(name) {
  if (TAG_CACHE[name]) return TAG_CACHE[name];

  /* Tìm tag đã tồn tại */
  var searchResp = UrlFetchApp.fetch(
    'https://api.getresponse.com/v3/tags?query[name]=' + encodeURIComponent(name),
    { headers: { 'X-Auth-Token': GR_API_KEY }, muteHttpExceptions: true }
  );
  var list = JSON.parse(searchResp.getContentText());
  if (Array.isArray(list) && list.length > 0) {
    TAG_CACHE[name] = list[0].tagId;
    return list[0].tagId;
  }

  /* Tạo tag mới */
  var createResp = UrlFetchApp.fetch('https://api.getresponse.com/v3/tags', {
    method: 'POST',
    contentType: 'application/json',
    headers: { 'X-Auth-Token': GR_API_KEY },
    payload: JSON.stringify({ name: name, color: '#1B2D4F' }),
    muteHttpExceptions: true
  });
  var tag = JSON.parse(createResp.getContentText());
  if (tag && tag.tagId) {
    TAG_CACHE[name] = tag.tagId;
    return tag.tagId;
  }
  return null;
}

function doPost(e) {
  try {
    var name   = (e.parameter.name   || '').trim();
    var email  = (e.parameter.email  || '').trim();
    var source = (e.parameter.source || 'direct').trim().toLowerCase().slice(0, 50);

    if (!email) {
      return jsonOut({ ok: false, error: 'missing email' });
    }

    /* Tìm/tạo tag cho nguồn */
    var tagId = getOrCreateTag('src_' + source);   /* ví dụ: src_instagram */

    var payload = {
      name: name,
      email: email,
      campaign: { campaignId: GR_CAMPAIGN_ID },
      dayOfCycle: 0
    };
    if (tagId) {
      payload.tags = [{ tagId: tagId }];
    }

    var resp = UrlFetchApp.fetch('https://api.getresponse.com/v3/contacts', {
      method: 'POST',
      contentType: 'application/json',
      headers: { 'X-Auth-Token': GR_API_KEY },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var code = resp.getResponseCode();
    return jsonOut({ ok: code === 202 || code === 200, source: source });

  } catch(err) {
    return jsonOut({ ok: false, error: err.toString() });
  }
}

function doGet(e) {
  return jsonOut({ status: 'CHJ Diamond proxy OK (v2)' });
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
