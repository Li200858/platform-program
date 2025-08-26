import React, { useState, useEffect } from 'react';
import Login from './Login';
import Feedback from './Feedback';
import CrossCampus from './CrossCampus';
import Study from './Study';
import Art from './Art';
import Activity from './Activity';
import MyProfile from './MyProfile';
import AdminPanel from './AdminPanel';
import ContentStatus from './ContentStatus';

import './App.css';

function MainApp() {
  const [user, setUser] = useState(localStorage.getItem('token') ? localStorage.getItem('email') : '');
  const [userRole, setUserRole] = useState('user');
  const [section, setSection] = useState('study');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showSearch, setShowSearch] = useState(false);



  useEffect(() => {
    if (user) {
      fetch('/api/me', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      })
        .then(res => res.json())
        .then(data => {
          setUserRole(data.role || 'user');
        })
        .catch(() => {});
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setUser('');
    setUserRole('user');
    setSection('study');
  };

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
  if (!user) {
    content = <Login onLogin={email => setUser(email)} />;
  } else if (section === 'study') {
    content = <Study user={user} />;
  } else if (section === 'art') {
    content = <Art user={user} />;
  } else if (section === 'activity') {
    content = <Activity user={user} />;
  } else if (section === 'crosscampus') {
    content = <CrossCampus user={user} />;
  } else if (section === 'feedback') {
    content = <Feedback user={user} />;
  } else if (section === 'my') {
    content = <MyProfile />;
  } else if (section === 'content-status') {
    content = <ContentStatus />;
  } else if (section === 'admin') {
    content = <AdminPanel />;
  }

  return (
    <div className="app-root">
      {/* 顶部导航栏 */}
      <header className="main-header">
        <div className="logo-area">
          <div className="site-title">海淀外国语国际部校园交流平台</div>
          <div className="site-title-en">HFLS International Campus Platform</div>
        </div>
        <nav className="main-nav">
          <button className={section === 'study' ? 'active' : ''} onClick={() => setSection('study')}>学习</button>
          <button className={section === 'art' ? 'active' : ''} onClick={() => setSection('art')}>艺术</button>
          <button className={section === 'activity' ? 'active' : ''} onClick={() => setSection('activity')}>活动</button>
          <button className={section === 'crosscampus' ? 'active' : ''} onClick={() => setSection('crosscampus')}>跨校联合</button>
          <button className={section === 'feedback' ? 'active' : ''} onClick={() => setSection('feedback')}>意见与评论</button>
        </nav>
        <div className="header-right">
          <div className="search-bar">
            <input
              type="text"
              placeholder="搜索..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch}>搜索</button>
          </div>
          <button onClick={() => setSection('my')} style={{ padding: '8px 20px', fontSize: '15px' }}>我的</button>
          <button onClick={() => setSection('content-status')} style={{ padding: '8px 20px', fontSize: '15px' }}>内容处理状态</button>
          {(userRole === 'founder' || userRole === 'admin') && (
            <button onClick={() => setSection('admin')} style={{ padding: '8px 20px', fontSize: '15px' }}>管理员面板</button>
          )}
          <button onClick={handleLogout} style={{ padding: '8px 20px', fontSize: '15px' }}>退出登录</button>
        </div>
      </header>

      {/* 搜索结果展示 */}
      {showSearch && searchResults && (
        <div className="search-result-panel">
          <div className="search-result-header">
            <h3>搜索："{searchQuery}"</h3>
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
          {Object.keys(searchResults).map(type => {
            const results = searchResults[type];
            if (results.length === 0) return null;
            return (
              <div key={type} style={{ marginBottom: 30 }}>
                <h4>
                  {type === 'study' ? '学习' : 
                   type === 'art' ? '艺术' : 
                   type === 'activity' ? '活动' : '跨校联合'}
                  ({results.length}条结果)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {results.map(item => (
                    <div key={item._id} className="search-result-item">
                      <div style={{ fontWeight: 'bold', marginBottom: 5 }}>{item.title}</div>
                      <div style={{ color: '#7f8c8d', fontSize: '14px' }}>
                        {item.content.substring(0, 100)}...
                      </div>
                      <div className="search-result-meta">
                        <span>作者: {item.authorName || item.author}</span>
                        <span>发布时间: {new Date(item.createdAt).toLocaleString()}</span>
                        {item.tab && <span>分类: {item.tab}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {Object.values(searchResults).every(arr => arr.length === 0) && (
            <div style={{ textAlign: 'center', color: '#7f8c8d', padding: 40 }}>
未找到相关内容
            </div>
          )}
        </div>
      )}

      {/* 主内容区 */}
      <main className="main-content">
        {content}
      </main>
      <footer className="main-footer">
        &copy; {new Date().getFullYear()} HFLS International Campus Platform
      </footer>
    </div>
  );
}

export default function App() {
  return <MainApp />;
}