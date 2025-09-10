import React, { useState, useEffect } from 'react';
import Art from './Art';
import Feedback from './Feedback';
import ErrorBoundary from './ErrorBoundary';
import './App.css';

function MainApp() {
  const [section, setSection] = useState('art');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  // 搜索功能
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setShowSearch(false);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      setSearchResults(data);
      setShowSearch(true);
    } catch (error) {
      setShowSearch(false);
    }
  };

  // 主内容区
  let content = null;
  if (section === 'art') {
    content = <Art />;
  } else if (section === 'feedback') {
    content = <Feedback />;
  }

  return (
    <div className="app-root">
      {/* 顶部导航栏 */}
      <header className="main-header">
        <div className="logo-area">
          <div className="site-title">海淀外国语国际部艺术平台</div>
          <div className="site-title-en">HFLS International Art Platform</div>
        </div>
        <nav className="main-nav">
          <button className={section === 'art' ? 'active' : ''} onClick={() => setSection('art')}>
            🎨 艺术作品
          </button>
          <button className={section === 'feedback' ? 'active' : ''} onClick={() => setSection('feedback')}>
            💬 意见反馈
          </button>
        </nav>
        <div className="header-right">
          <div className="search-bar">
            <input
              type="text"
              placeholder="搜索艺术作品..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch}>🔍</button>
          </div>
        </div>
      </header>

      {/* 搜索结果展示 */}
      {showSearch && searchResults && (
        <div className="search-result-panel">
          <div className="search-result-header">
            <h3>搜索结果："{searchQuery}"</h3>
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
                setSearchResults(null);
              }}
            >
              关闭
            </button>
          </div>
          {searchResults.art && searchResults.art.length > 0 ? (
            <div style={{ marginBottom: 30 }}>
              <h4>艺术作品 ({searchResults.art.length}条结果)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {searchResults.art.map(item => (
                  <div key={item._id} className="search-result-item">
                    <div style={{ fontWeight: 'bold', marginBottom: 5 }}>{item.title}</div>
                    <div style={{ color: '#7f8c8d', fontSize: '14px' }}>
                      {item.content.substring(0, 100)}...
                    </div>
                    <div className="search-result-meta">
                      <span>作者: {item.authorName || item.author}</span>
                      <span>班级: {item.authorClass}</span>
                      <span>发布时间: {new Date(item.createdAt).toLocaleString()}</span>
                      {item.tab && <span>分类: {item.tab}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#7f8c8d', padding: 40 }}>
              未找到相关艺术作品
            </div>
          )}
        </div>
      )}

      {/* 主内容区 */}
      <main className="main-content">
        <ErrorBoundary>
          {content}
        </ErrorBoundary>
      </main>
      
      <footer className="main-footer">
        &copy; {new Date().getFullYear()} HFLS International Art Platform - 让艺术点亮校园
      </footer>
    </div>
  );
}

export default function App() {
  return <MainApp />;
}