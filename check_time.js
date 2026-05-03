const {google}=require('googleapis');
const auth = new google.auth.GoogleAuth({keyFile: '../credentials.json', scopes: ['https://www.googleapis.com/auth/drive.readonly']});
const drive = google.drive({version:'v3', auth});
drive.files.list({q: "name='新規オープン店リスト'", fields: 'files(id, modifiedTime)'}).then(res => console.log(res.data));
