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

const parseDateString = (dateStr: string) => {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (match) {
    const [, y, m, d] = match;
    return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  }
  return null;
};

const getOpenStatus = (openDateStr: string) => {
  const openDate = parseDateString(openDateStr);
  if (!openDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  openDate.setHours(0, 0, 0, 0);
  return openDate <= today ? 'open' : 'soon';
};

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
  const openStatus = getOpenStatus(store.open_date);

  return (
    <div className={`card ${openStatus === 'open' ? 'card-open' : 'card-soon'}`}>
      <div className="card-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h2 className="store-name">{store.store_name}</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {openStatus === 'open' && <span className="badge status-open">🎈 オープン済</span>}
            {openStatus === 'soon' && <span className="badge status-soon">⏳ 開店準備中</span>}
          </div>
        </div>
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
