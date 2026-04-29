'use client';

import { useState, useMemo } from 'react';
import StoreCard from './StoreCard';

interface Store {
  rowIndex: number;
  store_name: string;
  address: string;
  open_date: string;
  category: string;
  meat_demand: string;
  status: string;
}

interface StoreListProps {
  stores: Store[];
}

export default function StoreList({ stores }: StoreListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('');

  const extractCity = (address: string) => {
    const match = address.match(/(?:.+?[都道府県])?(.+?[市区町村])/);
    return match ? match[1] : 'その他';
  };

  const areas = useMemo(() => {
    const citySet = new Set<string>();
    stores.forEach(store => {
      const city = extractCity(store.address);
      if (city !== 'その他') {
        citySet.add(city);
      }
    });
    return Array.from(citySet).sort();
  }, [stores]);

  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      const matchesSearch = store.store_name.toLowerCase().includes(searchQuery.toLowerCase());
      const storeCity = extractCity(store.address);
      const matchesArea = selectedArea === '' || storeCity === selectedArea;
      return matchesSearch && matchesArea;
    });
  }, [stores, searchQuery, selectedArea]);

  return (
    <>
      <div className="filters-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="店舗名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="area-filter">
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="area-select"
          >
            <option value="">すべてのエリア</option>
            {areas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="store-list">
        {filteredStores.length === 0 ? (
          <div className="empty-state">
            <p>条件に一致する店舗が見つかりません。</p>
          </div>
        ) : (
          filteredStores.map(store => (
            <StoreCard key={store.rowIndex} store={store} />
          ))
        )}
      </div>
    </>
  );
}
