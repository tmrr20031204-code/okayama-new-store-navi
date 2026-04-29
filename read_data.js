const { google } = require('googleapis');
const path = require('path');

async function getAuthClient() {
  const keyPath = path.join(__dirname, '../credentials.json');
  return new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.readonly'
    ],
  });
}

async function getSpreadsheetId() {
  const auth = await getAuthClient();
  const drive = google.drive({ version: 'v3', auth });
  
  const res = await drive.files.list({
    q: "name='新規オープン店リスト' and mimeType='application/vnd.google-apps.spreadsheet'",
    fields: 'files(id, name)',
  });
  
  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id;
  }
  return null;
}

async function main() {
  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = await getSpreadsheetId();
    
    if (!spreadsheetId) {
      console.log('スプレッドシートが見つかりません。');
      return;
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A:F', 
    });

    const rows = response.data.values || [];
    console.log('スプレッドシートの現在のデータ（全件）:');
    console.log(JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error('エラー:', error.message);
  }
}

main();
