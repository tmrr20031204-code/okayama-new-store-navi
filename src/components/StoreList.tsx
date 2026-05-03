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

const parseDateString = (dateStr: string) => {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (match) {
    const [, y, m, d] = match;
    return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)).getTime();
  }
  return 0;
};

export default function StoreList({ stores }: StoreListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrefecture, setSelectedPrefecture] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  const extractPrefecture = (address: string) => {
    if (address.includes('広島')) return '広島県';
    if (address.includes('岡山')) return '岡山県';
    return 'その他';
  };

  const extractCity = (address: string) => {
    const match = address.match(/(?:.+?[都道府県])?(.+?[市区町村])/);
    return match ? match[1] : 'その他';
  };

  const prefectures = useMemo(() => {
    const prefSet = new Set<string>();
    stores.forEach(store => {
      const pref = extractPrefecture(store.address);
      if (pref !== 'その他') prefSet.add(pref);
    });
    return Array.from(prefSet).sort();
  }, [stores]);

  const cities = useMemo(() => {
    const citySet = new Set<string>();
    stores.forEach(store => {
      const pref = extractPrefecture(store.address);
      if (selectedPrefecture === '' || pref === selectedPrefecture) {
        const city = extractCity(store.address);
        if (city !== 'その他') {
          citySet.add(city);
        }
      }
    });
    return Array.from(citySet).sort();
  }, [stores, selectedPrefecture]);

  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    stores.forEach(store => {
      if (store.category && store.category !== 'その他') {
        categorySet.add(store.category);
      }
    });
    return Array.from(categorySet).sort();
  }, [stores]);

  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      const matchesSearch = store.store_name.toLowerCase().includes(searchQuery.toLowerCase());
      const pref = extractPrefecture(store.address);
      const city = extractCity(store.address);
      
      const matchesPrefecture = selectedPrefecture === '' || pref === selectedPrefecture;
      const matchesCity = selectedCity === '' || city === selectedCity;
      const matchesCategory = selectedCategory === '' || store.category === selectedCategory;
      
      return matchesSearch && matchesPrefecture && matchesCity && matchesCategory;
    });
  }, [stores, searchQuery, selectedPrefecture, selectedCity, selectedCategory]);

  const sortedStores = useMemo(() => {
    return [...filteredStores].sort((a, b) => {
      const timeA = parseDateString(a.open_date) || 0;
      const timeB = parseDateString(b.open_date) || 0;
      if (sortOrder === 'desc') {
        return timeB - timeA;
      } else {
        return timeA - timeB;
      }
    });
  }, [filteredStores, sortOrder]);

  const paginatedStores = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedStores.slice(start, start + itemsPerPage);
  }, [sortedStores, currentPage]);

  const totalPages = Math.ceil(sortedStores.length / itemsPerPage);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePrefectureChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPrefecture(e.target.value);
    setSelectedCity('');
    setCurrentPage(1);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value);
    setCurrentPage(1);
  };

  return (
    <>
      <div className="filters-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="店舗名で検索..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        <div className="area-filter" style={{ minWidth: '140px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.3rem', fontWeight: 600 }}>📍 都道府県</label>
          <select
            value={selectedPrefecture}
            onChange={handlePrefectureChange}
            className="area-select"
          >
            <option value="">すべての県</option>
            {prefectures.map(pref => (
              <option key={pref} value={pref}>{pref}</option>
            ))}
          </select>
        </div>
        <div className="area-filter" style={{ minWidth: '140px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.3rem', fontWeight: 600 }}>🏘️ 市区町村</label>
          <select
            value={selectedCity}
            onChange={handleCityChange}
            className="area-select"
            disabled={!selectedPrefecture && prefectures.length > 0}
          >
            <option value="">すべての市区町村</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
        <div className="category-filter" style={{ minWidth: '140px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.3rem', fontWeight: 600 }}>🏷️ 業態</label>
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="area-select"
          >
            <option value="">すべての業態</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div className="sort-filter" style={{ flex: 1, minWidth: '140px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.3rem', fontWeight: 600 }}>↕️ 並び替え</label>
          <select
            value={sortOrder}
            onChange={handleSortChange}
            className="area-select"
          >
            <option value="desc">オープン日が新しい順</option>
            <option value="asc">オープン日が古い順</option>
          </select>
        </div>
      </div>
      <div className="store-list">
        {paginatedStores.length === 0 ? (
          <div className="empty-state">
            <p>条件に一致する店舗が見つかりません。</p>
          </div>
        ) : (
          paginatedStores.map(store => (
            <StoreCard key={store.rowIndex} store={store} />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', paddingBottom: '2rem' }}>
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="btn"
            style={{ padding: '0.5rem 1rem', background: currentPage === 1 ? '#eee' : '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            前へ
          </button>
          <span style={{ display: 'flex', alignItems: 'center' }}>
            {currentPage} / {totalPages}
          </span>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="btn"
            style={{ padding: '0.5rem 1rem', background: currentPage === totalPages ? '#eee' : '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            次ページ
          </button>
        </div>
      )}
    </>
  );
}
