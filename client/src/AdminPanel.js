import React, { useState, useEffect, useCallback, useMemo } from 'react';
import config from './config';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [pendingContent, setPendingContent] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [rejectingContentId, setRejectingContentId] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // 优化的数据获取函数
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${config.API_BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        console.error('获取用户列表失败:', res.status);
        setUsers([]);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingContent = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${config.API_BASE_URL}/api/pending-content`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setPendingContent(Array.isArray(data) ? data : []);
      } else {
        console.error('获取待审核内容失败:', res.status);
        setPendingContent([]);
      }
    } catch (error) {
      console.error('获取待审核内容失败:', error);
      setPendingContent([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'review') {
      fetchPendingContent();
    }
  }, [activeTab, fetchUsers, fetchPendingContent]);

  const searchUser = useCallback(async () => {
    if (!searchEmail.trim()) {
      setMsg('请输入邮箱');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${config.API_BASE_URL}/api/users/search?email=${encodeURIComponent(searchEmail)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setSearchResult(data);
        setMsg('');
      } else {
        const error = await res.json();
        setMsg(error.error || '搜索失败');
        setSearchResult(null);
      }
    } catch (error) {
      console.error('搜索用户失败:', error);
      setMsg('搜索失败');
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  }, [searchEmail]);

  const transferRole = useCallback(async (userId, newRole) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${config.API_BASE_URL}/api/transfer-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId, newRole })
      });

      if (res.ok) {
        setMsg('权限转让成功');
        fetchUsers();
        setSearchResult(null);
        setSearchEmail('');
      } else {
        const error = await res.json();
        setMsg(error.error || '权限转让失败');
      }
    } catch (error) {
      console.error('权限转让失败:', error);
      setMsg('权限转让失败');
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const reviewContent = useCallback(async (contentId, action, note = '') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${config.API_BASE_URL}/api/pending-content/${contentId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, note })
      });

      if (res.ok) {
        const result = await res.json();
        console.log('审核成功:', result);
        setMsg(action === 'approve' ? '内容已通过' : '内容已驳回');
        setTimeout(() => {
          fetchPendingContent();
        }, 500);
        setRejectingContentId(null);
        setRejectNote('');
      } else {
        const error = await res.json();
        console.error('审核失败:', error);
        setMsg(error.error || '审核失败');
      }
    } catch (error) {
      console.error('审核失败:', error);
      setMsg('审核失败');
    } finally {
      setLoading(false);
    }
  }, [fetchPendingContent]);

  const handleReject = useCallback((contentId) => {
    if (!rejectNote.trim()) {
      setMsg('请填写驳回原因');
      return;
    }
    reviewContent(contentId, 'reject', rejectNote.trim());
  }, [rejectNote, reviewContent]);

  const getRoleText = useCallback((role) => {
    const roleMap = {
      'founder': '创始人',
      'admin': '管理员',
      'user': '用户'
    };
    return roleMap[role] || '用户';
  }, []);

  const getRoleColor = useCallback((role) => {
    const colorMap = {
      'founder': '#dc3545',
      'admin': '#007bff',
      'user': '#6c757d'
    };
    return colorMap[role] || '#6c757d';
  }, []);

  // 使用useMemo缓存标签页数据
  const tabs = useMemo(() => [
    { key: 'users', label: '用户管理' },
    { key: 'review', label: '内容审核' }
  ], []);

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <h2>管理面板</h2>

      {msg && (
        <div style={{ 
          color: msg.includes('成功') ? 'green' : 'red', 
          marginBottom: 15,
          padding: 10,
          backgroundColor: msg.includes('成功') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${msg.includes('成功') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: 4
        }}>
          {msg}
        </div>
      )}

      {/* 标签页 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '12px 24px',
              border: '1px solid #ddd',
              backgroundColor: activeTab === tab.key ? '#007bff' : '#f8f9fa',
              color: activeTab === tab.key ? 'white' : '#333',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 用户管理 */}
      {activeTab === 'users' && (
        <div>
          <h3>用户管理</h3>
          
          <div style={{ marginBottom: 20 }}>
            <input
              type="email"
              value={searchEmail}
              onChange={e => setSearchEmail(e.target.value)}
              placeholder="输入邮箱搜索用户"
              style={{ padding: 8, marginRight: 10, minWidth: 200 }}
            />
            <button 
              onClick={searchUser}
              disabled={loading}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: 4,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '搜索中...' : '搜索'}
            </button>
          </div>

          {searchResult && (
            <div style={{ 
              border: '1px solid #ddd', 
              borderRadius: 8, 
              padding: 20, 
              marginBottom: 20,
              backgroundColor: '#f8f9fa'
            }}>
              <h4>搜索结果</h4>
              <div style={{ marginBottom: 10 }}>
                <strong>邮箱：</strong> {searchResult.email}
              </div>
              <div style={{ marginBottom: 10 }}>
                <strong>姓名：</strong> {searchResult.name || '未设置'}
              </div>
              <div style={{ marginBottom: 10 }}>
                <strong>班级：</strong> {searchResult.class || '未设置'}
              </div>
              <div style={{ marginBottom: 15 }}>
                <strong>当前角色：</strong> 
                <span style={{ 
                  color: getRoleColor(searchResult.role),
                  fontWeight: 'bold'
                }}>
                  {getRoleText(searchResult.role)}
                </span>
              </div>
              <div>
                <button 
                  onClick={() => transferRole(searchResult._id, 'admin')}
                  disabled={loading || searchResult.role === 'admin'}
                  style={{ 
                    padding: '6px 12px', 
                    backgroundColor: '#28a745', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: 4, 
                    marginRight: 8,
                    cursor: (loading || searchResult.role === 'admin') ? 'not-allowed' : 'pointer'
                  }}
                >
                  设为管理员
                </button>
                <button 
                  onClick={() => transferRole(searchResult._id, 'user')}
                  disabled={loading || searchResult.role === 'user'}
                  style={{ 
                    padding: '6px 12px', 
                    backgroundColor: '#6c757d', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: 4,
                    cursor: (loading || searchResult.role === 'user') ? 'not-allowed' : 'pointer'
                  }}
                >
                  设为普通用户
                </button>
              </div>
            </div>
          )}

          <div>
            <h4>所有用户</h4>
            {loading && <div style={{ textAlign: 'center', padding: 20 }}>加载中...</div>}
            
            {!loading && users.length === 0 && (
              <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>
                暂无用户数据
              </div>
            )}
            
            {!loading && users.length > 0 && (
              <div style={{ display: 'grid', gap: 15 }}>
                {users.map(user => (
                  <div key={user._id} style={{ 
                    border: '1px solid #ddd', 
                    borderRadius: 8, 
                    padding: 15,
                    backgroundColor: '#fff'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: 5 }}>
                          {user.email}
                        </div>
                        <div style={{ fontSize: 14, color: '#666' }}>
                          {user.name && <span>姓名: {user.name} </span>}
                          {user.class && <span>班级: {user.class}</span>}
                        </div>
                      </div>
                      <div>
                        <span style={{ 
                          color: getRoleColor(user.role),
                          fontWeight: 'bold',
                          backgroundColor: '#f8f9fa',
                          padding: '4px 8px',
                          borderRadius: 4
                        }}>
                          {getRoleText(user.role)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 内容审核 */}
      {activeTab === 'review' && (
        <div>
          <h3>内容审核</h3>
          
          {loading && <div style={{ textAlign: 'center', padding: 20 }}>加载中...</div>}
          
          {!loading && pendingContent.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
              暂无待审核内容
            </div>
          )}
          
          {!loading && pendingContent.length > 0 && (
            <div style={{ display: 'grid', gap: 20 }}>
              {pendingContent.map(content => (
                <div key={content._id} style={{ 
                  border: '1px solid #ffc107', 
                  borderRadius: 8, 
                  padding: 20,
                  backgroundColor: '#fff'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>
                        {content.title || '无标题'}
                      </h4>
                      <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                        <span style={{ 
                          backgroundColor: '#ffc107',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: 3,
                          marginRight: 10
                        }}>
                          {content.category}
                        </span>
                        <span>作者: {content.authorName || content.author}</span>
                      </div>
                    </div>
                    <div style={{ 
                      backgroundColor: '#ffc107',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12
                    }}>
                      待审核
                    </div>
                  </div>
                  
                  <div style={{ color: '#333', lineHeight: 1.5, marginBottom: 15 }}>
                    {content.content}
                  </div>
                  
                  {content.media && content.media.length > 0 && (
                    <div style={{ marginBottom: 15 }}>
                      <strong>媒体文件：</strong>
                      <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
                        {content.media.map((url, idx) => {
                          const ext = url.split('.').pop()?.toLowerCase();
                          if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) {
                            return (
                              <img
                                key={idx}
                                src={config.API_BASE_URL + url}
                                alt={`媒体 ${idx + 1}`}
                                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }}
                              />
                            );
                          }
                          return (
                            <a key={idx} href={config.API_BASE_URL + url} target="_blank" rel="noopener noreferrer">
                              文件 {idx + 1}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button 
                      onClick={() => reviewContent(content._id, 'approve')}
                      disabled={loading}
                      style={{ 
                        padding: '8px 16px', 
                        backgroundColor: '#28a745', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: 4,
                        cursor: loading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      通过
                    </button>
                    <button 
                      onClick={() => setRejectingContentId(content._id)}
                      disabled={loading}
                      style={{ 
                        padding: '8px 16px', 
                        backgroundColor: '#dc3545', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: 4,
                        cursor: loading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      驳回
                    </button>
                  </div>
                  
                  {rejectingContentId === content._id && (
                    <div style={{ marginTop: 15, padding: 15, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                      <textarea
                        value={rejectNote}
                        onChange={e => setRejectNote(e.target.value)}
                        placeholder="请填写驳回原因"
                        style={{ 
                          width: '100%', 
                          minHeight: 80, 
                          padding: 8, 
                          border: '1px solid #ddd', 
                          borderRadius: 4,
                          marginBottom: 10
                        }}
                      />
                      <div>
                        <button 
                          onClick={() => handleReject(content._id)}
                          disabled={loading}
                          style={{ 
                            padding: '6px 12px', 
                            backgroundColor: '#dc3545', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: 4, 
                            marginRight: 8,
                            cursor: loading ? 'not-allowed' : 'pointer'
                          }}
                        >
                          确认驳回
                        </button>
                        <button 
                          onClick={() => {
                            setRejectingContentId(null);
                            setRejectNote('');
                          }}
                          style={{ 
                            padding: '6px 12px', 
                            backgroundColor: '#6c757d', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: 4,
                            cursor: 'pointer'
                          }}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}