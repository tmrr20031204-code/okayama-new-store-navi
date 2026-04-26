'use client';

import { useState } from 'react';
import { updateStoreStatus } from '@/app/actions';

interface Store {
  rowIndex: number;
  store_name: string;
  address: string;
  open_date: string;
  category: string;
  meat_demand: string;
  status: string;
}

export default function StoreCard({ store }: { store: Store }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusToggle = async () => {
    setIsUpdating(true);
    const newStatus = store.status === '未訪問' ? '訪問済み' : '未訪問';
    await updateStoreStatus(store.rowIndex, newStatus);
    setIsUpdating(false);
  };

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.store_name + ' ' + store.address)}`;

  const getDemandBadge = (demand: string) => {
    if (demand === '高') return <span className="badge demand-high">🥩 需要: 高</span>;
    if (demand === '中') return <span className="badge demand-mid">🍖 需要: 中</span>;
    return <span className="badge demand-low">☕ 需要: 低</span>;
  };

  const isVisited = store.status === '訪問済み';

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="store-name">{store.store_name}</h2>
        {getDemandBadge(store.meat_demand)}
      </div>
      
      <div className="info-grid">
        <div className="info-row">
          <span className="info-icon">📍</span>
          <span>{store.address}</span>
        </div>
        <div className="info-row">
          <span className="info-icon">📅</span>
          <span>オープン予定: {store.open_date}</span>
        </div>
        <div className="info-row">
          <span className="info-icon">🏷️</span>
          <span>業態: {store.category}</span>
        </div>
      </div>

      <div className="card-actions">
        <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-map">
          🗺️ マップ
        </a>
        <button 
          onClick={handleStatusToggle} 
          disabled={isUpdating}
          className={`btn btn-status ${isVisited ? 'visited' : ''}`}
        >
          {isUpdating ? (
            <span className="loading-spinner"></span>
          ) : isVisited ? (
            '✅ 訪問済み'
          ) : (
            '📌 未訪問'
          )}
        </button>
      </div>
    </div>
  );
}
