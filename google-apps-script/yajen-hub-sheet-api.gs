const SPREADSHEET_ID = '1SfiJ97f1QTO3vsF9UrxotlO4zxMZxth6HyTPun72zOI';
const RECORDS_SHEET = '網站紀錄';

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || '';
    if (action !== 'listSites') {
      return jsonResponse({ ok: true, service: 'YAJEN HUB Sheet Sync' });
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(RECORDS_SHEET);
    if (!sheet) throw new Error('Records sheet not found');
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return jsonResponse({ ok: true, sites: [] });

    const colors = ['#C9C0FF', '#F6B8D4', '#A9E5F1', '#BFE6D3', '#F7D6A3', '#C8D9FF'];
    const rows = sheet.getRange(2, 1, lastRow - 1, 6).getDisplayValues();
    const sites = rows.filter(function (row) {
      return row[1] && row[2];
    }).map(function (row, index) {
      return {
        id: 'sheet-' + (index + 2),
        category: row[0] || '其他',
        title: row[1],
        url: row[2],
        description: row[3] || '',
        image: row[5] || '',
        color: colors[index % colors.length]
      };
    });
    return jsonResponse({ ok: true, sites: sites });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.action !== 'addSite') throw new Error('Unsupported action');
    const expectedToken = PropertiesService.getScriptProperties().getProperty('YAJEN_HUB_TOKEN');
    if (!expectedToken || body.token !== expectedToken) throw new Error('Unauthorized');
    const site = body.site || {};
    if (!site.title || !site.url || !site.category) throw new Error('Missing required site fields');

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(RECORDS_SHEET);
    if (!sheet) throw new Error('Records sheet not found');
    sheet.appendRow([
      safeCell(site.category),
      safeCell(site.title),
      safeCell(site.url),
      safeCell(site.description || ''),
      new Date(),
      safeCell(site.image || ''),
    ]);

    const lastRow = sheet.getLastRow();
    if (lastRow > 2) {
      sheet.getRange(2, 1, lastRow - 1, 6).sort([
        { column: 1, ascending: true },
        { column: 2, ascending: true },
      ]);
    }
    sheet.getRange(2, 5, Math.max(lastRow - 1, 1), 1).setNumberFormat('yyyy-mm-dd hh:mm');
    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) });
  }
}

function safeCell(value) {
  const text = String(value == null ? '' : value).trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
