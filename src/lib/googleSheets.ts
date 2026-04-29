import { google } from 'googleapis';
import path from 'path';

export async function getAuthClient() {
  if (process.env.GOOGLE_CREDENTIALS) {
    let credsStr = process.env.GOOGLE_CREDENTIALS;
    let credentials;
    
    try {
      // もし '{' や '"' で始まっていない場合はBase64エンコードされているとみなしてデコード
      if (!credsStr.trim().startsWith('{') && !credsStr.trim().startsWith('"')) {
        credsStr = Buffer.from(credsStr, 'base64').toString('utf-8');
      } else {
        // 従来の処理のフォールバック (改行補正など)
        credsStr = credsStr.replace(/\r?\n/g, '\\n');
        credsStr = credsStr.replace(/\\\\n/g, '\\n');
      }
      
      credentials = JSON.parse(credsStr);
    } catch (e) {
      console.error('Failed to parse GOOGLE_CREDENTIALS:', e);
      return null;
    }

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

export async function getClientEmail(): Promise<string> {
  if (process.env.GOOGLE_CREDENTIALS) {
    try {
      let credsStr = process.env.GOOGLE_CREDENTIALS;
      if (!credsStr.trim().startsWith('{') && !credsStr.trim().startsWith('"')) {
        credsStr = Buffer.from(credsStr, 'base64').toString('utf-8');
      } else {
        credsStr = credsStr.replace(/\r?\n/g, '\\n');
        credsStr = credsStr.replace(/\\\\n/g, '\\n');
      }
      const creds = JSON.parse(credsStr);
      return creds.client_email || 'No email found in credentials';
    } catch (error) {
      console.error('Failed to parse credentials:', error);
      return 'Error parsing credentials';
    }
  }
  return 'Using local credentials.json';
}

export async function getSpreadsheetId() {
  const auth = await getAuthClient();
  if (!auth) throw new Error('Google Auth Client is null');
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
  if (!auth) throw new Error('Google Auth Client is null');
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
