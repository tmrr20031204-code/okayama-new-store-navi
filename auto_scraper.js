const { google } = require('googleapis');
const path = require('path');

const CREDENTIALS_FILE = '../credentials.json';
const SPREADSHEET_NAME = '新規オープン店リスト';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function fetchNews(query) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ja&gl=JP&ceid=JP:ja`;
    const res = await fetch(url);
    const text = await res.text();
    const items = [...text.matchAll(/<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<\/item>/g)];
    return items.map(match => match[1].replace(/<\/?[^>]+(>|$)/g, ""));
}

async function extractStores(titles) {
    if (!OPENAI_API_KEY) {
        console.warn("No OPENAI_API_KEY, returning empty");
        return [];
    }
    const current_date = new Date().toLocaleDateString('ja-JP');
    const prompt = `
現在の日付は【${current_date}】です。
以下のニュース記事の見出し一覧から、新規オープンする飲食店の情報を抽出してください。
特に「岡山県」および「広島県」の店舗情報を優先してください。
店舗名が不明な場合は抽出しないでください。

【抽出項目】
- store_name: 店名
- address: 住所またはエリア（例: 岡山県倉敷市、広島県広島市中区 など）
- open_date: オープン予定日（例: 2026年5月、4月下旬 など。不明な場合は"不明"）
- category: 業態（焼肉、居酒屋、カフェなど）
- meat_demand: 肉の需要度を3段階で判定（高: 焼肉・ステーキ等、中: 居酒屋・ラーメン等、低: カフェ等）

【出力形式】必ずJSON配列のみ出力すること
[
  {
    "store_name": "焼肉〇〇 倉敷店",
    "address": "岡山県倉敷市...",
    "open_date": "2024年4月下旬",
    "category": "焼肉",
    "meat_demand": "高"
  }
]

【対象テキスト（ニュース見出し）】
${titles.join('\n')}
`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "あなたはデータ抽出アシスタントです。JSON配列のみを出力します。" },
                { role: "user", content: prompt }
            ],
            temperature: 0.0
        })
    });
    
    if (!res.ok) {
        console.error("OpenAI API error:", await res.text());
        return [];
    }
    
    const data = await res.json();
    let content = data.choices[0].message.content.trim();
    content = content.replace(/```json\n?|\n?```/g, '');
    try {
        return JSON.parse(content);
    } catch (e) {
        console.error("Failed to parse JSON:", content);
        return [];
    }
}

async function main() {
    console.log("Fetching news...");
    const titlesOk = await fetchNews("岡山 新店舗 オープン 飲食店");
    const titlesHi = await fetchNews("広島 新店舗 オープン 飲食店");
    const allTitles = [...new Set([...titlesOk, ...titlesHi])]; // Deduplicate
    
    if (allTitles.length === 0) {
        console.log("No news found.");
        return;
    }
    
    console.log(`Found ${allTitles.length} unique news items. Extracting via OpenAI...`);
    const newStores = await extractStores(allTitles);
    
    if (newStores.length === 0) {
        console.log("No valid stores extracted.");
        return;
    }
    console.log(`Extracted ${newStores.length} stores from text.`);

    console.log("Authenticating with Google Sheets...");
    let auth;
    if (process.env.GOOGLE_CREDENTIALS) {
        let credsStr = process.env.GOOGLE_CREDENTIALS;
        if (!credsStr.trim().startsWith('{') && !credsStr.trim().startsWith('"')) {
            credsStr = Buffer.from(credsStr, 'base64').toString('utf-8');
        } else {
            credsStr = credsStr.replace(/\r?\n/g, '\\n').replace(/\\\\n/g, '\\n');
        }
        const credentials = JSON.parse(credsStr);
        auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.readonly']
        });
    } else {
        auth = new google.auth.GoogleAuth({
            keyFile: path.join(__dirname, CREDENTIALS_FILE),
            scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.readonly']
        });
    }

    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    const res = await drive.files.list({
        q: `name='${SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet'`,
        fields: 'files(id, name)',
    });

    if (!res.data.files || res.data.files.length === 0) {
        console.error("Spreadsheet not found");
        return;
    }
    const spreadsheetId = res.data.files[0].id;

    // Fetch existing stores to avoid duplicates
    const sheetData = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'A:A'
    });
    const existingStoreNames = (sheetData.data.values || []).flat();

    const toInsert = [];
    for (const store of newStores) {
        if (!store.store_name || store.store_name === '不明') continue;
        
        // Simple duplicate check
        const isDuplicate = existingStoreNames.some(name => 
            name.includes(store.store_name) || store.store_name.includes(name)
        );

        if (!isDuplicate) {
            toInsert.push([
                store.store_name,
                store.address || '',
                store.open_date || '',
                store.category || '',
                store.meat_demand || '',
                "未訪問"
            ]);
            existingStoreNames.push(store.store_name); 
        }
    }

    if (toInsert.length > 0) {
        console.log(`Appending ${toInsert.length} new stores to spreadsheet...`);
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'A:F',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: toInsert }
        });
        console.log("Success!");
    } else {
        console.log("No new stores to add (all duplicates or invalid).");
    }
}

main().catch(console.error);
