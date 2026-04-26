const { google } = require('googleapis');
const path = require('path');

async function insertDummy() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../credentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.readonly'],
  });

  const drive = google.drive({ version: 'v3', auth });
  const res = await drive.files.list({
    q: "name='新規オープン店リスト' and mimeType='application/vnd.google-apps.spreadsheet'",
  });
  
  if (!res.data.files || res.data.files.length === 0) {
    console.log("Spreadsheet not found.");
    return;
  }
  
  const spreadsheetId = res.data.files[0].id;

  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        ['店名', '住所', 'オープン予定日', '業態', '需要度', 'ステータス'],
        ['焼肉キング 倉敷インター店', '岡山県倉敷市平田123', '10月下旬', '焼肉', '高', '未訪問'],
        ['ラーメン 麺道 総社店', '岡山県総社市中央2-1', '11月1日', 'ラーメン', '中', '未訪問'],
        ['カフェ・ド・ソレイユ', '岡山県岡山市北区問屋町', '12月上旬', 'カフェ', '低', '未訪問'],
      ]
    }
  });
  console.log("Dummy data inserted.");
}
insertDummy();
