const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

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

    const dummyData = [
      ["焼肉キング 倉敷インター店", "岡山県倉敷市平田123", "10月下旬", "焼肉", "高", "未訪問"],
      ["ラーメン 麺道 総社店", "岡山県総社市中央2-1", "11月1日", "ラーメン", "中", "未訪問"],
      ["カフェ・ド・オカヤマ", "岡山県岡山市北区1-1", "12月15日", "カフェ", "低", "未訪問"]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: dummyData
      }
    });

    console.log('✅ データの追加が完了しました！');
  } catch (error) {
    console.error('エラー:', error.message);
  }
}

main();
