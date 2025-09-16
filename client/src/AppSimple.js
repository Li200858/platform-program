import React, { useState, useEffect } from 'react';
import Art from './components/Art/Art';
import Activity from './Activity';
import Feedback from './components/Feedback/Feedback';
import UserProfile from './components/User/UserProfile';
import MyCollection from './MyCollection';
import MyWorks from './MyWorks';
import AdminPanel from './AdminPanel';
import ErrorBoundary from './ErrorBoundary';
import MessageToast from './MessageToast';
import { MessageProvider, useMessage } from './MessageContext';
import { useUserSimple as useUser } from './hooks/useUserSimple';
import { useApiSimple as useApi } from './hooks/useApiSimple';
import './App.css';

function MainApp() {
  const [section, setSection] = useState('art');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const { userInfo, isLoggedIn, isAdmin, loading: userLoading } = useUser();
  const { search: searchApi } = useApi();
  const { showError } = useMessage();

  // 搜索功能
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchApi.search(query.trim());
      setSearchResults(results);
    } catch (error) {
      console.error('搜索失败:', error);
      showError('搜索失败，请稍后重试');
    } finally {
      setIsSearching(false);
    }
  };

  // 处理搜索输入
  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // 防抖搜索
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      handleSearch(query);
    }, 300);
  };

  // 清除搜索
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  if (userLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎨</div>
          <div style={{ fontSize: '18px', color: '#6c757d' }}>加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* 顶部导航栏 */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="app-title">🎨 艺术创作平台</h1>
            <p className="app-subtitle">分享你的创意，发现无限可能</p>
          </div>
          
          {/* 搜索框 */}
          <div className="search-section">
            <div className="search-container">
              <input
                type="text"
                placeholder="搜索作品、活动..."
                value={searchQuery}
                onChange={handleSearchInput}
                className="search-input"
              />
              {searchQuery && (
                <button onClick={clearSearch} className="search-clear">
                  ✕
                </button>
              )}
            </div>
            {isSearching && (
              <div className="search-loading">搜索中...</div>
            )}
          </div>

          {/* 用户信息 */}
          <div className="user-section">
            {isLoggedIn ? (
              <div className="user-info">
                <span className="user-name">{userInfo?.name}</span>
                <span className="user-class">{userInfo?.class}</span>
                {isAdmin && <span className="admin-badge">管理员</span>}
              </div>
            ) : (
              <div className="login-prompt">
                <span>请先登录</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 主导航 */}
      <nav className="main-nav">
        <button 
          className={section === 'art' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setSection('art')}
        >
          🎨 艺术作品
        </button>
        <button 
          className={section === 'activity' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setSection('activity')}
        >
          🎪 活动
        </button>
        <button 
          className={section === 'feedback' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setSection('feedback')}
        >
          💬 反馈
        </button>
        {isLoggedIn && (
          <>
            <button 
              className={section === 'profile' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setSection('profile')}
            >
              👤 个人资料
            </button>
            <button 
              className={section === 'collection' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setSection('collection')}
            >
              ❤️ 我的收藏
            </button>
            <button 
              className={section === 'works' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setSection('works')}
            >
              🎭 我的作品
            </button>
          </>
        )}
        {isAdmin && (
          <button 
            className={section === 'admin' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setSection('admin')}
          >
            ⚙️ 管理面板
          </button>
        )}
      </nav>

      {/* 主要内容区域 */}
      <main className="main-content">
        <ErrorBoundary>
          {section === 'art' && <Art />}
          {section === 'activity' && <Activity />}
          {section === 'feedback' && <Feedback />}
          {section === 'profile' && isLoggedIn && <UserProfile />}
          {section === 'collection' && isLoggedIn && <MyCollection userInfo={userInfo} />}
          {section === 'works' && isLoggedIn && <MyWorks userInfo={userInfo} />}
          {section === 'admin' && isAdmin && <AdminPanel />}
        </ErrorBoundary>
      </main>

      {/* 消息提示 */}
      <MessageToast />
    </div>
  );
}

// 主应用组件，包含消息提供者
function App() {
  return (
    <MessageProvider>
      <MainApp />
    </MessageProvider>
  );
}

export default App;
