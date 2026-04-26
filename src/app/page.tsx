import { getSheetData } from '@/lib/googleSheets';
import StoreCard from '@/components/StoreCard';

// キャッシュを無効化し、常に最新のスプレッドシートデータを取得する
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  let stores: any[] = [];
  try {
    stores = await getSheetData();
  } catch (e) {
    console.error('Failed to load data:', e);
  }

  // 「店名」などのヘッダー行や空行を除外
  const validStores = stores.filter(s => s.store_name && s.store_name !== 'store_name' && s.store_name !== '店名');

  return (
    <div className="app-container">
      <header className="header">
        <h1>新店オープンナビ</h1>
      </header>

      <main className="main-content">
        {validStores.length === 0 ? (
          <div className="empty-state">
            <p>データが見つかりません。</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', opacity: 0.7 }}>
              Pythonスクリプトを実行してスプレッドシートにデータを追加してください。
            </p>
          </div>
        ) : (
          validStores.map((store) => (
            <StoreCard key={store.rowIndex} store={store} />
          ))
        )}
      </main>
    </div>
  );
}
