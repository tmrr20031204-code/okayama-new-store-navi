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
  visitor_name?: string;
  contact_person?: string;
  contact_info?: string;
  notes?: string;
}

const parseDateString = (dateStr: string) => {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{4})年(\d{1,2})月(?:(\d{1,2})日)?/);
  if (match) {
    const [, y, m, d] = match;
    return new Date(parseInt(y, 10), parseInt(m, 10) - 1, d ? parseInt(d, 10) : 1);
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

const getIsNew = (openDateStr: string) => {
  const openDate = parseDateString(openDateStr);
  if (!openDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  openDate.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - openDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 30;
};

export default function StoreCard({ store }: { store: Store }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    visitorName: store.visitor_name || '',
    contactPerson: store.contact_person || '',
    contactInfo: store.contact_info || '',
    notes: store.notes || ''
  });

  const handleStatusToggle = async () => {
    if (store.status === '未訪問') {
      setShowModal(true);
      return;
    }
    // 訪問済みから未訪問へ戻す場合
    setIsUpdating(true);
    await updateStoreStatus(store.rowIndex, '未訪問');
    setIsUpdating(false);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    await updateStoreStatus(store.rowIndex, '訪問済み', formData);
    setIsUpdating(false);
    setShowModal(false);
  };

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.store_name + ' ' + store.address)}`;

  const isVisited = store.status === '訪問済み';
  const openStatus = getOpenStatus(store.open_date);
  const isNew = getIsNew(store.open_date);

  return (
    <div className={`card ${openStatus === 'open' ? 'card-open' : 'card-soon'}`}>
      <div className="card-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h2 className="store-name">{store.store_name}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {isNew && <span className="badge status-new" style={{ backgroundColor: '#ff4757', color: 'white' }}>✨ NEW!</span>}
            {openStatus === 'open' && <span className="badge status-open">🎈 オープン済</span>}
            {openStatus === 'soon' && <span className="badge status-soon">⏳ 開店準備中</span>}
          </div>
        </div>
      </div>
      
      <div className="info-grid">
        <div className="info-row">
          <span className="info-icon">📍</span>
          <span>{store.address}</span>
        </div>
        <div className="info-row">
          <span className="info-icon">📅</span>
          <span>{openStatus === 'open' ? 'オープン日' : 'オープン予定'}: {store.open_date}</span>
        </div>
        <div className="info-row">
          <span className="info-icon">🏷️</span>
          <span>業態: {store.category}</span>
        </div>
        {isVisited && (
          <div className="visit-details" style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '8px', fontSize: '0.875rem' }}>
            <div style={{ fontWeight: 'bold', color: '#166534', marginBottom: '0.25rem' }}>✓ 訪問記録</div>
            {store.visitor_name && <div><span style={{ color: '#15803d' }}>当社担当:</span> {store.visitor_name}</div>}
            {store.contact_person && <div><span style={{ color: '#15803d' }}>先方担当:</span> {store.contact_person}</div>}
            {store.contact_info && <div><span style={{ color: '#15803d' }}>連絡先:</span> {store.contact_info}</div>}
            {store.notes && <div style={{ marginTop: '0.25rem' }}><span style={{ color: '#15803d' }}>備考:</span> {store.notes}</div>}
          </div>
        )}
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

      {showModal && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #cbd5e1' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 'bold', color: '#0f172a' }}>訪問記録の入力</h3>
          <form onSubmit={handleModalSubmit}>
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem', color: '#334155' }}>当社訪問者氏名 <span style={{color: '#e11d48', fontSize: '0.7rem'}}>*必須</span></label>
              <input required type="text" className="form-input" style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '16px' }} value={formData.visitorName} onChange={e => setFormData({...formData, visitorName: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem', color: '#334155' }}>訪問先担当者氏名</label>
              <input type="text" className="form-input" style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '16px' }} value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem', color: '#334155' }}>訪問店舗の連絡先</label>
              <input type="text" className="form-input" style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '16px' }} value={formData.contactInfo} onChange={e => setFormData({...formData, contactInfo: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem', color: '#334155' }}>備考</label>
              <textarea className="form-input" style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', minHeight: '60px', fontSize: '16px' }} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn" style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#475569', padding: '0.6rem', border: '1px solid #cbd5e1' }} onClick={() => setShowModal(false)}>キャンセル</button>
              <button type="submit" className="btn" style={{ flex: 1, backgroundColor: '#10b981', color: 'white', padding: '0.6rem' }}>登録する</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
