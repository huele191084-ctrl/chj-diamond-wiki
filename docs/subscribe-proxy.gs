/**
 * CHJ Diamond — GetResponse Proxy
 * Dán code này vào Google Apps Script (script.google.com)
 * Deploy as Web App: Execute as "Me", Access "Anyone"
 */

var GR_API_KEY = 'api-key jws743opqynugsj786mrojhfm58yna22';
var GR_CAMPAIGN_ID = 'CsodV';

function doPost(e) {
  try {
    var name  = (e.parameter.name  || '').trim();
    var email = (e.parameter.email || '').trim();

    if (!email) {
      return jsonOut({ok: false, error: 'missing email'});
    }

    var resp = UrlFetchApp.fetch('https://api.getresponse.com/v3/contacts', {
      method: 'POST',
      contentType: 'application/json',
      headers: {'X-Auth-Token': GR_API_KEY},
      payload: JSON.stringify({
        name: name,
        email: email,
        campaign: {campaignId: GR_CAMPAIGN_ID},
        dayOfCycle: 0
      }),
      muteHttpExceptions: true
    });

    var code = resp.getResponseCode();
    return jsonOut({ok: code === 202 || code === 200});

  } catch(err) {
    return jsonOut({ok: false, error: err.toString()});
  }
}

function doGet(e) {
  return jsonOut({status: 'CHJ Diamond proxy OK'});
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
