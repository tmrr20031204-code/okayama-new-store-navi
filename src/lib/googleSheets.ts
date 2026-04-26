import { google } from 'googleapis';
import path from 'path';

export async function getAuthClient() {
  if (process.env.GOOGLE_CREDENTIALS) {
    let credsStr = process.env.GOOGLE_CREDENTIALS;
    // Vercel等で改行が実体化してしまった場合のための安全処理
    // 実際の改行をエスケープされた \n に置換し、さらに制御文字を取り除く
    credsStr = credsStr.replace(/\r?\n/g, '\\n');
    // すでに \\n になっている部分が \\\\n になるのを防ぐ
    credsStr = credsStr.replace(/\\\\n/g, '\\n');
    
    const credentials = JSON.parse(credsStr);
    return new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly'
      ],
    });
  }

  const keyPath = path.join(process.cwd(), '../credentials.json');
  return new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.readonly'
    ],
  });
}

export async function getSpreadsheetId() {
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

export async function getSheetData() {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = await getSpreadsheetId();
  
  if (!spreadsheetId) return [];

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'A:F', 
  });

  const rows = response.data.values || [];
  return rows.map((row, index) => ({
    rowIndex: index + 1,
    store_name: row[0] || '',
    address: row[1] || '',
    open_date: row[2] || '',
    category: row[3] || '',
    meat_demand: row[4] || '',
    status: row[5] || '未訪問',
  }));
}
