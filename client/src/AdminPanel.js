import React, { useState, useEffect } from 'react';
import api from './api';

export default function AdminPanel({ userInfo, onBack }) {
  const [activeTab, setActiveTab] = useState('feedbacks');
  const [feedbacks, setFeedbacks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (activeTab === 'feedbacks') {
      loadFeedbacks();
    } else if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getFeedbacks();
      setFeedbacks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载反馈失败:', error);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载用户失败:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const data = await api.admin.searchUsers(searchQuery);
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('搜索用户失败:', error);
      setSearchResults([]);
    }
  };

  const handleAddAdmin = async (userName) => {
    if (!userName) return;

    try {
      await api.admin.addAdmin({
        userName,
        addedBy: userInfo.name
      });
      setMessage('管理员添加成功！');
      loadUsers();
    } catch (error) {
      setMessage('添加失败：' + (error.message || '请重试'));
    }
  };

  const handleRemoveAdmin = async (userName) => {
    if (!userName) return;

    if (!window.confirm(`确定要移除用户 ${userName} 的管理员权限吗？`)) {
      return;
    }

    try {
      await api.admin.removeAdmin({
        userName,
        removedBy: userInfo.name
      });
      setMessage('管理员移除成功！');
      loadUsers();
    } catch (error) {
      setMessage('移除失败：' + (error.message || '请重试'));
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            marginRight: '15px',
            color: '#7f8c8d'
          }}
        >
          ←
        </button>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>管理面板</h2>
      </div>

      {/* 消息显示 */}
      {message && (
        <div style={{ 
          padding: '15px', 
          background: message.includes('成功') ? '#d4edda' : '#f8d7da',
          color: message.includes('成功') ? '#155724' : '#721c24',
          borderRadius: 8,
          border: `1px solid ${message.includes('成功') ? '#c3e6cb' : '#f5c6cb'}`,
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: 15, marginBottom: 30 }}>
        <button
          onClick={() => setActiveTab('feedbacks')}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: activeTab === 'feedbacks' ? '2px solid #3498db' : '2px solid #ecf0f1',
            background: activeTab === 'feedbacks' ? '#3498db' : '#fff',
            color: activeTab === 'feedbacks' ? '#fff' : '#2c3e50',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          意见反馈
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: activeTab === 'users' ? '2px solid #3498db' : '2px solid #ecf0f1',
            background: activeTab === 'users' ? '#3498db' : '#fff',
            color: activeTab === 'users' ? '#fff' : '#2c3e50',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          用户管理
        </button>
      </div>

      {activeTab === 'feedbacks' && (
        <div>
          <h3 style={{ marginBottom: 20, color: '#2c3e50' }}>意见反馈管理</h3>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
              加载中...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              {feedbacks.map(feedback => (
                <div key={feedback._id} style={{ 
                  border: '1px solid #ecf0f1', 
                  borderRadius: 8,
                  padding: 20,
                  background: '#f8f9fa'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#2c3e50', marginBottom: 5 }}>
                        {feedback.authorName} ({feedback.authorClass})
                      </div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                        {new Date(feedback.createdAt).toLocaleString()} • 分类: {feedback.category}
                      </div>
                    </div>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      background: feedback.status === 'resolved' ? '#d4edda' : '#fff3cd',
                      color: feedback.status === 'resolved' ? '#155724' : '#856404'
                    }}>
                      {feedback.status === 'resolved' ? '已处理' : '待处理'}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#34495e', lineHeight: 1.5 }}>
                    {feedback.content}
                  </div>
                </div>
              ))}
              {feedbacks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
                  暂无反馈
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <h3 style={{ marginBottom: 20, color: '#2c3e50' }}>用户管理</h3>
          
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
              <input
                type="text"
                placeholder="搜索用户..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  flex: 1, 
                  padding: '10px', 
                  borderRadius: 8, 
                  border: '2px solid #ecf0f1' 
                }}
              />
              <button
                onClick={handleSearchUsers}
                style={{
                  padding: '10px 20px',
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                搜索
              </button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div style={{ marginBottom: 30 }}>
              <h4 style={{ marginBottom: 15, color: '#2c3e50' }}>搜索结果</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {searchResults.map(user => (
                  <div key={user.name} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '15px',
                    border: '1px solid #ecf0f1',
                    borderRadius: 8,
                    background: '#f8f9fa'
                  }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{user.name}</div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d' }}>班级: {user.class}</div>
                    </div>
                    <button
                      onClick={() => handleAddAdmin(user.name)}
                      style={{
                        padding: '6px 12px',
                        background: '#27ae60',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      设为管理员
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h4 style={{ marginBottom: 15, color: '#2c3e50' }}>当前管理员</h4>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
              加载中...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {users.map(user => (
                <div key={user._id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '15px',
                  border: '1px solid #ecf0f1',
                  borderRadius: 8,
                  background: '#f8f9fa'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{user.name}</div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                      班级: {user.class} • 创建时间: {new Date(user.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {user.name !== userInfo.name && (
                    <button
                      onClick={() => handleRemoveAdmin(user.name)}
                      style={{
                        padding: '6px 12px',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      移除管理员
                    </button>
                  )}
                </div>
              ))}
              {users.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
                  暂无管理员
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}