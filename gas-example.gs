const SPREADSHEET_ID = 'ここにスプレッドシートIDを入れてください';
const NEWS_SHEET = 'News';
const DIPLOMACY_SHEET = 'Diplomacy';

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'getNews') return json({ success: true, news: getNews() });
  if (action === 'getDiplomacyMatrix') return json({ success: true, diplomacy: getDiplomacyMatrix() });
  return json({ success: false, error: 'Unknown action' });
}

function doPost(e) {
  const payload = JSON.parse(e.postData.contents || '{}');
  if (payload.action === 'postNews') {
    appendNews(payload.news);
    return json({ success: true });
  }
  return json({ success: false, error: 'Unknown action' });
}

function getNews() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(NEWS_SHEET);
  const [header, ...rows] = sheet.getDataRange().getValues();
  return rows.filter(row => row[0]).map(rowToObject(header));
}

function appendNews(news) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(NEWS_SHEET);
  sheet.appendRow([
    news.id || Utilities.getUuid(),
    news.date || new Date().toISOString(),
    news.nation || '',
    news.author || '',
    news.category || '',
    news.title || '',
    news.body || ''
  ]);
}

function getDiplomacyMatrix() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DIPLOMACY_SHEET);
  const [header, ...rows] = sheet.getDataRange().getValues();
  const relations = rows.filter(row => row[0] && row[1]).map(rowToObject(header));
  const nations = [...new Set(relations.flatMap(r => [r.from, r.to]))];
  return { nations, relations };
}

function rowToObject(header) {
  return row => header.reduce((obj, key, index) => {
    obj[String(key).trim()] = row[index];
    return obj;
  }, {});
}

function json(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
