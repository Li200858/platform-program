import React, { useState, useEffect } from 'react';
import Art from './Art';
import Activity from './Activity';
import Feedback from './Feedback';
import UserProfile from './UserProfile';
import MyCollection from './MyCollection';
import MyWorks from './MyWorks';
import AdminPanel from './AdminPanel';
import UserSync from './UserSync';
import ErrorBoundary from './ErrorBoundary';
import { UserIDProvider, useUserID } from './UserIDManager';
import api from './api';
import './App.css';

function MainApp() {
  const [section, setSection] = useState('art');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { userID } = useUserID();

  // 加载用户信息
  useEffect(() => {
    const savedUserInfo = localStorage.getItem('user_profile');
    if (savedUserInfo) {
      setUserInfo(JSON.parse(savedUserInfo));
    }
  }, []);

  const checkAdminStatus = React.useCallback(async () => {
    try {
      if (userInfo && userInfo.name) {
        const data = await api.admin.check(userInfo.name);
        setIsAdmin(data.isAdmin || false);
      }
    } catch (error) {
      console.error('检查管理员状态失败:', error);
    }
  }, [userInfo]);

  // 检查管理员权限
  useEffect(() => {
    if (userInfo && userInfo.name) {
      checkAdminStatus();
    }
  }, [userInfo, checkAdminStatus]);

  // 搜索功能
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setShowSearch(false);
      return;
    }
    try {
      const data = await api.search(searchQuery.trim());
      setSearchResults(data);
      setShowSearch(true);
    } catch (error) {
      setShowSearch(false);
    }
  };

  // 主内容区
  let content = null;
  try {
    if (section === 'art') {
      content = <Art userInfo={userInfo} />;
    } else if (section === 'activity') {
      content = <Activity userInfo={userInfo} onBack={() => setSection('art')} />;
    } else if (section === 'feedback') {
      content = <Feedback userInfo={userInfo} />;
    } else if (section === 'profile') {
      content = <UserProfile onBack={() => setSection('art')} onUserInfoUpdate={setUserInfo} />;
    } else if (section === 'sync') {
      content = <UserSync onBack={() => setSection('art')} />;
    } else if (section === 'collection') {
      content = <MyCollection userInfo={userInfo} onBack={() => setSection('art')} />;
    } else if (section === 'myworks') {
      content = <MyWorks userInfo={userInfo} onBack={() => setSection('art')} />;
    } else if (section === 'admin') {
      content = <AdminPanel userInfo={userInfo} onBack={() => setSection('art')} />;
    }
  } catch (error) {
    console.error('Error rendering content:', error);
    content = (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>页面加载出错</h2>
        <p>错误信息: {error.message}</p>
        <button onClick={() => window.location.reload()}>刷新页面</button>
      </div>
    );
  }

  return (
    <div className="app-root">
      {/* 顶部导航栏 */}
      <header className="main-header">
        <div className="header-top">
          <div className="logo-area">
            <div className="site-title">海淀外国语国际部艺术平台</div>
            <div className="site-title-en">HFLS International Art Platform</div>
          </div>
          <div className="header-right">
            <div className="search-bar">
              <input
                type="text"
                placeholder="搜索艺术作品..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch}>搜索</button>
            </div>
          </div>
        </div>
        <nav className="main-nav">
          <button className={section === 'art' ? 'active' : ''} onClick={() => setSection('art')}>
            艺术作品
          </button>
          <button className={section === 'activity' ? 'active' : ''} onClick={() => setSection('activity')}>
            活动展示
          </button>
          <button className={section === 'feedback' ? 'active' : ''} onClick={() => setSection('feedback')}>
            意见反馈
          </button>
          <button className={section === 'collection' ? 'active' : ''} onClick={() => setSection('collection')}>
            我的收藏
          </button>
          <button className={section === 'myworks' ? 'active' : ''} onClick={() => setSection('myworks')}>
            我的作品
          </button>
          <button className={section === 'profile' ? 'active' : ''} onClick={() => setSection('profile')}>
            个人信息
          </button>
          <button className={section === 'sync' ? 'active' : ''} onClick={() => setSection('sync')}>
            数据同步
          </button>
          {isAdmin && (
            <button className={section === 'admin' ? 'active' : ''} onClick={() => setSection('admin')}>
              管理面板
            </button>
          )}
        </nav>
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
              <h4>🎨 艺术作品 ({searchResults.art.length}条结果)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {searchResults.art.map(item => (
                  <div 
                    key={item._id} 
                    className="search-result-item"
                    onClick={() => {
                      // 关闭搜索面板
                      setShowSearch(false);
                      setSearchQuery('');
                      setSearchResults(null);
                      // 切换到艺术作品页面
                      setSection('art');
                      // 滚动到页面顶部
                      window.scrollTo(0, 0);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: 5, color: '#2c3e50' }}>{item.title}</div>
                    <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '8px' }}>
                      {item.content.substring(0, 100)}...
                    </div>
                    <div className="search-result-meta">
                      <span>作者: {item.authorName || item.author}</span>
                      <span>班级: {item.authorClass}</span>
                      <span>发布时间: {new Date(item.createdAt).toLocaleString()}</span>
                      {item.tab && <span>分类: {item.tab}</span>}
                    </div>
                    <div style={{ 
                      marginTop: '8px', 
                      fontSize: '12px', 
                      color: '#3498db',
                      fontWeight: 'bold'
                    }}>
                      点击查看完整内容 →
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : searchResults.activity && searchResults.activity.length > 0 ? (
            <div style={{ marginBottom: 30 }}>
              <h4>🎪 活动展示 ({searchResults.activity.length}条结果)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {searchResults.activity.map(item => (
                  <div 
                    key={item._id} 
                    className="search-result-item"
                    onClick={() => {
                      // 关闭搜索面板
                      setShowSearch(false);
                      setSearchQuery('');
                      setSearchResults(null);
                      // 切换到活动页面
                      setSection('activity');
                      // 滚动到页面顶部
                      window.scrollTo(0, 0);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: 5, color: '#2c3e50' }}>{item.title}</div>
                    <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '8px' }}>
                      {item.content.substring(0, 100)}...
                    </div>
                    <div className="search-result-meta">
                      <span>组织者: {item.authorName || item.author}</span>
                      <span>班级: {item.authorClass}</span>
                      <span>发布时间: {new Date(item.createdAt).toLocaleString()}</span>
                      {item.tab && <span>分类: {item.tab}</span>}
                    </div>
                    <div style={{ 
                      marginTop: '8px', 
                      fontSize: '12px', 
                      color: '#3498db',
                      fontWeight: 'bold'
                    }}>
                      点击查看完整内容 →
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#7f8c8d', padding: 40 }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
              <div style={{ fontSize: '18px', marginBottom: '10px' }}>未找到相关内容</div>
              <div style={{ fontSize: '14px' }}>请尝试其他关键词或检查拼写</div>
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
  return (
    <UserIDProvider>
      <MainApp />
    </UserIDProvider>
  );
}