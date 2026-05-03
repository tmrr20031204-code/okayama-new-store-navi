'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StoreCard from './StoreCard';

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

interface StoreListProps {
  stores: Store[];
  lastUpdated?: string;
}

import { parseDateString } from '@/lib/dateUtils';

export default function StoreList({ stores, lastUpdated }: StoreListProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrefecture, setSelectedPrefecture] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const itemsPerPage = 30;

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('storeListState');
      if (saved) {
        try {
          const state = JSON.parse(saved);
          if (state.searchQuery) setSearchQuery(state.searchQuery);
          if (state.selectedPrefecture) setSelectedPrefecture(state.selectedPrefecture);
          if (state.selectedCity) setSelectedCity(state.selectedCity);
          if (state.selectedCategory) setSelectedCategory(state.selectedCategory);
          if (state.sortOrder) setSortOrder(state.sortOrder);
          if (state.currentPage) setCurrentPage(state.currentPage);
        } catch(e){}
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('storeListState', JSON.stringify({
        searchQuery, selectedPrefecture, selectedCity, selectedCategory, sortOrder, currentPage
      }));
    }
  }, [searchQuery, selectedPrefecture, selectedCity, selectedCategory, sortOrder, currentPage]);

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

  const validStores = useMemo(() => {
    return stores.filter(store => {
      const openDate = parseDateString(store.open_date);
      if (!openDate) return true; // 日付不明は残す
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      openDate.setHours(0, 0, 0, 0);
      
      const diffTime = today.getTime() - openDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      // オープン前180日以上先、またはオープン後365日以上経過した店舗は除外
      if (diffDays > 365 || diffDays < -180) {
        return false;
      }
      return true;
    });
  }, [stores]);

  const filteredStores = useMemo(() => {
    return validStores.filter(store => {
      const matchesSearch = store.store_name.toLowerCase().includes(searchQuery.toLowerCase());
      const pref = extractPrefecture(store.address);
      const city = extractCity(store.address);
      
      const matchesPrefecture = selectedPrefecture === '' || pref === selectedPrefecture;
      const matchesCity = selectedCity === '' || city === selectedCity;
      const matchesCategory = selectedCategory === '' || store.category === selectedCategory;
      
      return matchesSearch && matchesPrefecture && matchesCity && matchesCategory;
    });
  }, [validStores, searchQuery, selectedPrefecture, selectedCity, selectedCategory]);

  const sortedStores = useMemo(() => {
    return [...filteredStores].sort((a, b) => {
      const timeA = parseDateString(a.open_date)?.getTime() || 0;
      const timeB = parseDateString(b.open_date)?.getTime() || 0;
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
      <header className="header" style={{ position: 'fixed', top: 0, left: 0, right: 0, width: '100%' }}>
        <button className="menu-trigger" onClick={() => setIsMenuOpen(true)}>
          ☰
        </button>
        <div className="header-content">
          <h1>新店オープンナビ</h1>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', opacity: 0.9 }}>
            <span>～岡山・広島版～</span>
            {lastUpdated && <span>{lastUpdated}</span>}
          </div>
        </div>
        <button 
          className="refresh-trigger" 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          style={{ 
            position: 'absolute', 
            right: '1rem', 
            background: 'none', 
            border: 'none', 
            color: 'white', 
            fontSize: '1.25rem', 
            cursor: 'pointer',
            opacity: isRefreshing ? 0.5 : 1
          }}
        >
          {isRefreshing ? '⌛' : '🔄'}
        </button>
      </header>

      <div style={{ height: '80px' }}></div>

      <div className="filters-container" style={{ padding: '0 1rem', marginBottom: '1.5rem' }}>
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

      <div className={`sidebar-overlay ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)}></div>
      <aside className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">メニュー</span>
          <button className="close-menu" onClick={() => setIsMenuOpen(false)}>✕</button>
        </div>
        
        <div className="sidebar-content">
          <div className="filter-group">
            <label className="filter-label">🔍 店名検索</label>
            <input
              type="text"
              placeholder="店舗名で検索..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">📍 都道府県</label>
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

          <div className="filter-group">
            <label className="filter-label">🏘️ 市区町村</label>
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

          <div className="filter-group">
            <label className="filter-label">🏷️ 業態</label>
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

          <div className="filter-group">
            <label className="filter-label">↕️ 並び替え</label>
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

        <div className="sidebar-footer">
          <button className="about-trigger" onClick={() => { setIsAboutOpen(true); setIsMenuOpen(false); }}>
            📄 新店オープンナビについて
          </button>
        </div>
      </aside>

      <div className={`about-modal ${isAboutOpen ? 'open' : ''}`}>
        <button className="about-close" onClick={() => setIsAboutOpen(false)}>閉じる</button>
        <div className="about-content">
          <h2>新店オープンナビについて</h2>
          <p style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
            本アプリは当社社員専用の共有ツールです。<br/>
            セキュリティ保護のため、社外への共有や情報の漏洩は厳禁といたします。
          </p>

          <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.8rem', color: '#64748b', border: '1px solid #e2e8f0' }}>
            <strong>システム稼働状況:</strong><br/>
            ロジック更新日時: 2026/05/03 22:05 (v1.2.5)<br/>
            アプリ上の今日の日付: {new Date().toLocaleDateString('ja-JP')}
          </div>

          <h3>🥩 新店オープンナビの概要</h3>
          <p>
            「新店オープンナビ」は、営業チームが「お肉の仕入れニーズが高い新規オープン店舗」をいち早く発見し、効率的に営業活動（アプローチ）を行うための専用Webアプリです。
          </p>
          <p>
            外出先からでもスマートフォンで最新のターゲットリストを即座に確認でき、営業の機動力と新規開拓スピードを最大化することを目的としています。
          </p>

          <h3>⚙️ システムの仕組み（データの流れ）</h3>
          <p>システムは大きく分けて「①自動収集（AI）」「②データ保管」「③アプリ表示」の3ステップで稼働しています。</p>
          
          <div style={{ marginLeft: '1rem', borderLeft: '3px solid #eee', paddingLeft: '1rem' }}>
            <p><strong>① インターネットからの自動収集とAIによる厳選</strong><br/>
            システムが定期的に求人サイトや新店情報サイトを巡回。AI（人工知能）が「岡山・広島エリア」かつ「前後12ヶ月以内にオープン」の店舗を自動抽出します。</p>
            <p><small>【ここがポイント！】 AIによる高度なフィルタリングを行い、カフェやスイーツ店などの非ターゲットを除外。代わりに「焼肉」「ホルモン」「ステーキ」「ラーメン」「和牛」など、お肉関連の重要キーワードを含む店舗を「最優先の見込み客」として選別します。</small></p>
            
            <p><strong>② スプレッドシートへの自動記録</strong><br/>
            AIが厳選した情報は、リアルタイムでGoogleスプレッドシート（新規オープン店リスト）に集約・保管されます。</p>
            
            <p><strong>③ スマートフォンでの閲覧</strong><br/>
            スプレッドシートの情報は即座に本アプリへ反映されます。営業担当者は「今から訪問可能な近隣の新店舗」をいつでもどこでも確認可能です。</p>
          </div>

          <h3>💡 特徴とメリット</h3>
          <ul>
            <li><strong>ノイズのない「特化型」リスト：</strong>肉の需要が高い業態に絞り込まれているため、リサーチの手間を大幅に削減。</li>
            <li><strong>リアルタイムな情報共有：</strong>スプレッドシートの更新が即座に反映され、チーム内での訪問状況管理やバッティング防止に貢献。</li>
          </ul>

          <p style={{ marginTop: '2rem', padding: '1rem', background: '#f1f5f9', borderRadius: '8px' }}>
            <strong>一言でまとめると：</strong><br/>
            「AIがネット上の新店情報を24時間監視し、お肉の需要が高い店舗だけを厳選してスプレッドシートに整理。それを営業マンがスマホで即座に確認できるシステム」です。
          </p>
          
          <p style={{ marginTop: '1rem' }}>当社の強みである「肉の専門性」を活かしたスピーディなアプローチを強力にバックアップします！</p>
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
