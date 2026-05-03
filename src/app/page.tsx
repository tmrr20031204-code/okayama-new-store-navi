import { getSheetData, getClientEmail, getLastUpdated } from '@/lib/googleSheets';
import StoreList from '@/components/StoreList';

// キャッシュを無効化し、常に最新のスプレッドシートデータを取得する
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function Home() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let stores: any[] = [];
  let errorMessage: string | null = null;
  let clientEmail = '';
  let lastUpdated: string | null = null;
  try {
    stores = await getSheetData();
    clientEmail = await getClientEmail();
    lastUpdated = await getLastUpdated();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error('Failed to load data:', e);
    errorMessage = e.message || String(e);
  }

  // 「店名」などのヘッダー行や空行を除外
  const validStores = stores.filter(s => s.store_name && s.store_name !== 'store_name' && s.store_name !== '店名');

  return (
    <div className="app-container">
      <main className="main-content">
        {errorMessage ? (
           <div className="empty-state">
             <p style={{color: 'red'}}>エラーが発生しました: {errorMessage}</p>
           </div>
        ) : validStores.length === 0 ? (
          <div className="empty-state">
            <header className="header" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
              <h1>新店オープンナビ</h1>
            </header>
            <p style={{ marginTop: '5rem' }}>データが見つかりません。</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', opacity: 0.7 }}>
              Pythonスクリプトを実行してスプレッドシートにデータを追加してください。<br/>
              (Service Account: {clientEmail})
            </p>
          </div>
        ) : (
          <StoreList stores={validStores} lastUpdated={lastUpdated || undefined} />
        )}
      </main>
    </div>
  );
}
