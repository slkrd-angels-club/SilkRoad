// Google Apps Script — saves pitch decks from the website into a Google Drive folder.
// Setup: script.google.com → New project → paste this → Deploy → New deployment → Web app,
// Execute as: Me, Who has access: Anyone → copy the Web app URL into Vercel as DRIVE_DECK_UPLOAD_URL.
const FOLDER_ID = '1MFBz5cqI1J5GT2N8YH4Ow2wcfjP2oQp1';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const clean = (s) => String(s || '').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 120);
    const date = Utilities.formatDate(new Date(), 'Asia/Almaty', 'yyyy-MM-dd');
    const name = [date, clean(body.company) || 'Startup', clean(body.filename) || 'deck.pdf'].join(' — ');
    const blob = Utilities.newBlob(Utilities.base64Decode(body.data), body.contentType || 'application/pdf', name);
    const file = DriveApp.getFolderById(FOLDER_ID).createFile(blob);
    return reply({ ok: true, id: file.getId(), url: 'https://drive.google.com/file/d/' + file.getId() + '/view' });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
