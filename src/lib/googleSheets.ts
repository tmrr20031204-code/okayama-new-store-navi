import { google } from 'googleapis';
import path from 'path';

export async function getAuthClient() {
  if (process.env.GOOGLE_CREDENTIALS) {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
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
