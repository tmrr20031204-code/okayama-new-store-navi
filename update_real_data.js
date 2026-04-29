const { google } = require('googleapis');
const path = require('path');

const CREDENTIALS_FILE = '../credentials.json';
const SPREADSHEET_NAME = '新規オープン店リスト';

const REAL_DATA = [
    ["平和町呑場 ココハネ", "岡山県岡山市北区平和町", "2026年4月23日", "居酒屋", "中", "未訪問"],
    ["八寅", "岡山県倉敷市", "2026年4月22日", "飲食店", "中", "未訪問"],
    ["乙 ラーメン アリス", "岡山県岡山市北区", "2026年4月21日", "ラーメン", "中", "未訪問"],
    ["ミスタードーナツ ゆめタウン高梁ショップ", "岡山県高梁市", "2026年4月16日", "カフェ", "低", "未訪問"],
    ["九州料理 縁 岡山駅前店", "岡山県岡山市北区", "2026年4月15日", "居酒屋", "中", "未訪問"],
    ["favo（ファヴォ）", "岡山県岡山市東区", "2026年4月15日", "カフェ", "低", "未訪問"],
    ["カミナリ食堂", "岡山県岡山市南区", "2026年4月15日", "食堂", "中", "未訪問"],
    ["うな市 倉敷店", "岡山県倉敷市", "2026年4月11日", "和食", "低", "未訪問"],
    ["鉄板焼 五七屋", "岡山県岡山市中区", "2026年4月30日", "鉄板焼", "高", "未訪問"],
    ["PISOLA（ピソラ）岡山浜野店", "岡山県岡山市南区浜野", "2026年5月9日", "イタリアン", "中", "未訪問"],
    ["晴れ寿し 西大寺店", "岡山県岡山市東区西大寺", "2026年5月15日", "寿司", "低", "未訪問"],
    ["魚三（うみ）", "岡山県岡山市北区", "2026年5月25日", "海鮮", "低", "未訪問"],
    ["恵食喫酒ほまれ", "岡山県岡山市北区", "2026年5月25日", "居酒屋", "中", "未訪問"],
    ["資さんうどん 岡山福成店", "岡山県岡山市南区福成", "2026年6月25日", "うどん", "低", "未訪問"],
    ["鳥貴族 倉敷駅前店", "岡山県倉敷市", "2026年6月8日", "居酒屋・焼鳥", "高", "未訪問"],
    ["ラーメンまこと屋 岡山大供本町店", "岡山県岡山市北区大供本町", "2026年6月15日", "ラーメン", "中", "未訪問"]
];

async function main() {
    console.log("Authenticating...");
    const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, CREDENTIALS_FILE),
        scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.readonly']
    });

    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    console.log("Finding spreadsheet...");
    const res = await drive.files.list({
        q: `name='${SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet'`,
        fields: 'files(id, name)',
    });

    if (!res.data.files || res.data.files.length === 0) {
        console.error("Spreadsheet not found");
        return;
    }
    const spreadsheetId = res.data.files[0].id;

    console.log(`Clearing existing data from spreadsheet ID: ${spreadsheetId}...`);
    await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: 'A:F'
    });

    const headers = ["店名", "住所", "オープン日", "業態", "肉の需要度", "ステータス"];
    const values = [headers, ...REAL_DATA];

    console.log(`Writing ${REAL_DATA.length} real stores...`);
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'A1:F' + values.length,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values }
    });

    console.log("Success!");
}

main().catch(console.error);
