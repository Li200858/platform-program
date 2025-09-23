import React, { useState, useEffect } from 'react';
import Art from './Art';
import Activity from './Activity';
import Feedback from './Feedback';
import UserProfile from './UserProfile';
import MyCollection from './MyCollection';
import MyWorks from './MyWorks';
import AdminPanel from './AdminPanel';
import UserSync from './UserSync';
import Search from './Search';
import Follow from './Follow';
import Teams from './Teams';
import Notifications from './Notifications';
import ErrorBoundary from './ErrorBoundary';
import { UserIDProvider, useUserID } from './UserIDManager';
import api from './api';
import './App.css';

function MainApp() {
  const [section, setSection] = useState('art');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchType, setSearchType] = useState('all');
  const [userInfo, setUserInfo] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [maintenanceStatus, setMaintenanceStatus] = useState({ isEnabled: false, message: '' });
  const [notificationCount, setNotificationCount] = useState(0);
  const { userID } = useUserID();

  // 加载用户信息
  useEffect(() => {
    const loadUserInfo = () => {
      const savedUserInfo = localStorage.getItem('user_profile');
      if (savedUserInfo) {
        const parsedInfo = JSON.parse(savedUserInfo);
        setUserInfo(prevInfo => {
          // 只有当用户信息真正改变时才更新
          if (!prevInfo || prevInfo.name !== parsedInfo.name || prevInfo.class !== parsedInfo.class) {
            return parsedInfo;
          }
          return prevInfo;
        });
      } else {
        setUserInfo(null);
      }
    };
    
    loadUserInfo();
    
    // 监听localStorage变化，当用户信息被更新时自动刷新
    const handleStorageChange = (e) => {
      if (e.key === 'user_profile') {
        loadUserInfo();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // 定期检查localStorage变化（用于同一窗口内的更新）
    const interval = setInterval(loadUserInfo, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // 加载通知计数
  useEffect(() => {
    const loadNotificationCount = async () => {
      if (userInfo && userInfo.name) {
        try {
          const notifications = await api.notifications.getNotifications(userInfo.name);
          const unreadCount = notifications.filter(n => !n.isRead).length;
          setNotificationCount(unreadCount);
        } catch (error) {
          console.error('加载通知计数失败:', error);
        }
      }
    };

    loadNotificationCount();
           // 每5秒刷新通知计数
           const interval = setInterval(loadNotificationCount, 5000);
    return () => clearInterval(interval);
  }, [userInfo]);

  // 暴露setSection函数给全局使用
  useEffect(() => {
    window.setSection = setSection;
    return () => {
      delete window.setSection;
    };
  }, []);

  // 暴露setMessageTarget函数给全局使用
  useEffect(() => {
    window.setMessageTarget = (targetUser) => {
      // 这里可以设置私信目标用户
      console.log('设置私信目标用户:', targetUser);
    };
    return () => {
      delete window.setMessageTarget;
    };
  }, []);

  // 加载维护模式状态
  useEffect(() => {
    const loadMaintenanceStatus = async () => {
      try {
        const status = await api.maintenance.getStatus();
        setMaintenanceStatus(status);
      } catch (error) {
        console.error('加载维护状态失败:', error);
      }
    };
    loadMaintenanceStatus();
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
      const data = await api.search.global(searchQuery.trim(), searchType);
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
      content = <Art userInfo={userInfo} maintenanceStatus={maintenanceStatus} />;
    } else if (section === 'activity') {
      content = <Activity userInfo={userInfo} onBack={() => setSection('art')} maintenanceStatus={maintenanceStatus} />;
    } else if (section === 'feedback') {
      content = <Feedback userInfo={userInfo} maintenanceStatus={maintenanceStatus} />;
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
    } else if (section === 'search') {
      content = <Search userInfo={userInfo} onBack={() => setSection('art')} />;
    } else if (section === 'follow') {
      content = <Follow userInfo={userInfo} onBack={() => setSection('art')} />;
    } else if (section === 'teams') {
      content = <Teams userInfo={userInfo} onBack={() => setSection('art')} />;
    } else if (section === 'notifications') {
      content = <Notifications userInfo={userInfo} onBack={() => setSection('art')} />;
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
      {/* 维护模式提示 */}
      {maintenanceStatus.isEnabled && !isAdmin && (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          color: '#856404',
          padding: '15px',
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          position: 'sticky',
          top: 0,
          zIndex: 1000
        }}>
          ⚠️ {maintenanceStatus.message}
        </div>
      )}

      {/* 顶部导航栏 */}
      <header className="main-header">
        <div className="header-top">
          <div className="logo-area">
            <div className="site-title">海淀外国语国际部艺术平台</div>
            <div className="site-title-en">HFLS International Art Platform</div>
          </div>
          <div className="header-right">
            <div className="search-bar" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select
                value={searchType}
                onChange={e => setSearchType(e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="all">全部</option>
                <option value="art">艺术作品</option>
                <option value="activity">活动设计</option>
                <option value="user">用户</option>
              </select>
              <input
                type="text"
                placeholder="搜索内容..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{ flex: 1 }}
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
          <button className={section === 'follow' ? 'active' : ''} onClick={() => setSection('follow')}>
            关注
          </button>
          <button className={section === 'teams' ? 'active' : ''} onClick={() => setSection('teams')}>
            团队
          </button>
          <button className={section === 'notifications' ? 'active' : ''} onClick={() => setSection('notifications')} style={{ position: 'relative' }}>
            通知
            {notificationCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: '#e74c3c',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
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
          {(searchResults.arts && searchResults.arts.length > 0) || (searchResults.activities && searchResults.activities.length > 0) || (searchResults.users && searchResults.users.length > 0) ? (
            <div>
              {searchResults.arts && searchResults.arts.length > 0 && (
            <div style={{ marginBottom: 30 }}>
              <h4>艺术作品 ({searchResults.arts.length}条结果)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {searchResults.arts.map(item => (
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
                      // 高亮显示搜索结果
                      setTimeout(() => {
                        const element = document.querySelector(`[data-art-id="${item._id}"]`);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          element.style.background = '#fff3cd';
                          element.style.border = '2px solid #ffc107';
                          setTimeout(() => {
                            element.style.background = '';
                            element.style.border = '';
                          }, 3000);
                        }
                      }, 100);
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
              )}
              {searchResults.activities && searchResults.activities.length > 0 && (
            <div style={{ marginBottom: 30 }}>
              <h4>活动展示 ({searchResults.activities.length}条结果)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {searchResults.activities.map(item => (
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
                      // 高亮显示搜索结果
                      setTimeout(() => {
                        const element = document.querySelector(`[data-activity-id="${item._id}"]`);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          element.style.background = '#fff3cd';
                          element.style.border = '2px solid #ffc107';
                          setTimeout(() => {
                            element.style.background = '';
                            element.style.border = '';
                          }, 3000);
                        }
                      }, 100);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: 5, color: '#2c3e50' }}>{item.title}</div>
                    <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '8px' }}>
                      {(item.description || item.content || '').substring(0, 100)}...
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
              )}
              {searchResults.users && searchResults.users.length > 0 && (
            <div style={{ marginBottom: 30 }}>
              <h4>用户 ({searchResults.users.length}条结果)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {searchResults.users.map(user => (
                  <div 
                    key={user._id || user.name} 
                    className="search-result-item"
                    style={{ cursor: 'default' }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: 5, color: '#2c3e50' }}>{user.name}</div>
                    <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '8px' }}>
                      班级: {user.class}
                    </div>
                    <div className="search-result-meta">
                      <span>用户ID: {user.userID || '未知'}</span>
                      <span>角色: {user.role || '用户'}</span>
                      {user.isAdmin && <span>管理员</span>}
                    </div>
                    {userInfo && userInfo.name && user.name !== userInfo.name && (
                      <div style={{ 
                        marginTop: '8px', 
                        display: 'flex', 
                        gap: '8px'
                      }}>
                        <button
                          onClick={async () => {
                            try {
                              await api.follow.follow(userInfo.name, user.name);
                              setMessage('关注成功');
                            } catch (error) {
                              setMessage('关注失败：' + (error.message || '请重试'));
                            }
                          }}
                          style={{
                            padding: '4px 8px',
                            background: '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          关注
                        </button>
                        <button
                          onClick={() => {
                            setShowSearch(false);
                            setSearchQuery('');
                            setSearchResults(null);
                            setSection('messages');
                            if (window.setMessageTarget) {
                              window.setMessageTarget(user.name);
                            }
                          }}
                          style={{
                            padding: '4px 8px',
                            background: '#27ae60',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          私信
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#7f8c8d', padding: 40 }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}></div>
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