import React, { useState, useEffect } from 'react';
import api from './api';

export default function AdminPanel({ userInfo, onBack }) {
  const [activeTab, setActiveTab] = useState('feedback');
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'feedback') {
      loadFeedbacks();
    } else if (activeTab === 'admins') {
      loadAdminUsers();
    } else if (activeTab === 'maintenance') {
      loadMaintenanceStatus();
    }
  }, [activeTab]);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/feedback');
      const data = await res.json();
      setFeedbacks(data || []);
    } catch (error) {
      console.error('加载反馈失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminUsers = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getUsers();
      setAdminUsers(data || []);
    } catch (error) {
      console.error('加载管理员失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMaintenanceStatus = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getMaintenanceStatus();
      setMaintenanceMode(data.maintenanceMode || false);
      setMaintenanceMessage(data.maintenanceMessage || '');
    } catch (error) {
      console.error('加载维护状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/admin/search-users?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data || []);
    } catch (error) {
      console.error('搜索用户失败:', error);
    }
  };

  const addAdmin = async (userName) => {
    if (!userInfo || !userInfo.name) {
      alert('用户信息不完整，无法操作');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/admin/set-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userName,
          adminName: userInfo.name 
        })
      });
      
      if (res.ok) {
        alert('管理员添加成功！');
        loadAdminUsers();
        setSearchQuery('');
        setSearchResults([]);
      } else {
        const error = await res.json();
        alert(error.error || '添加失败');
      }
    } catch (error) {
      alert('添加失败');
    }
  };

  const removeAdmin = async (userName) => {
    if (!window.confirm(`确定要移除 ${userName} 的管理员权限吗？`)) {
      return;
    }

    if (!userInfo || !userInfo.name) {
      alert('用户信息不完整，无法操作');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/admin/remove-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userName,
          removedBy: userInfo.name 
        })
      });
      
      if (res.ok) {
        alert('管理员移除成功！');
        loadAdminUsers();
      } else {
        const error = await res.json();
        alert(error.error || '移除失败');
      }
    } catch (error) {
      alert('移除失败');
    }
  };

  const toggleMaintenanceMode = async () => {
    if (!userInfo || !userInfo.name) {
      alert('用户信息不完整，无法操作');
      return;
    }

    setMaintenanceLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/maintenance/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: !maintenanceMode,
          message: maintenanceMessage,
          adminName: userInfo.name
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setMaintenanceMode(data.maintenanceMode);
        alert(data.message);
      } else {
        const error = await res.json();
        alert(error.error || '操作失败');
      }
    } catch (error) {
      alert('操作失败');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const renderFeedback = (feedback) => (
    <div key={feedback._id} style={{
      background: '#fff',
      borderRadius: 12,
      padding: 20,
      marginBottom: 15,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '1px solid #e9ecef'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: '#3498db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            {feedback.authorName ? feedback.authorName.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
              {feedback.authorName || '匿名用户'}
            </div>
            <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
              {feedback.authorClass || '未知班级'}
            </div>
          </div>
        </div>
        <div style={{ fontSize: '14px', color: '#6c757d' }}>
          {new Date(feedback.createdAt).toLocaleString()}
        </div>
      </div>

      <div style={{
        color: '#2c3e50',
        lineHeight: '1.6',
        marginBottom: 15,
        whiteSpace: 'pre-wrap'
      }}>
        {feedback.content}
      </div>

      <div style={{
        display: 'flex',
        gap: 10,
        paddingTop: 15,
        borderTop: '1px solid #e9ecef'
      }}>
        <button
          onClick={() => {
            if (window.confirm('确定要删除这条反馈吗？')) {
              // 这里可以添加删除反馈的API调用
              alert('删除功能待实现');
            }
          }}
          style={{
            padding: '6px 12px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: '12px',
            color: '#721c24'
          }}
        >
          删除
        </button>
        <button
          onClick={() => {
            // 这里可以添加回复反馈的功能
            alert('回复功能待实现');
          }}
          style={{
            padding: '6px 12px',
            backgroundColor: '#d1ecf1',
            border: '1px solid #bee5eb',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: '12px',
            color: '#0c5460'
          }}
        >
          回复
        </button>
      </div>
    </div>
  );

  const renderUserSearchResult = (user) => (
    <div key={user.name} style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 15px',
      backgroundColor: '#f8f9fa',
      borderRadius: 8,
      marginBottom: 8,
      border: '1px solid #e9ecef'
    }}>
      <div>
        <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{user.name}</div>
        <div style={{ fontSize: '14px', color: '#6c757d' }}>{user.class}</div>
      </div>
      <button
        onClick={() => addAdmin(user.name)}
        style={{
          padding: '6px 12px',
          backgroundColor: '#28a745',
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
  );

  const renderAdminUser = (admin) => (
    <div key={admin.name} style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '15px',
      backgroundColor: '#fff',
      borderRadius: 8,
      marginBottom: 10,
      border: '1px solid #e9ecef',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: '#e74c3c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          管理
        </div>
        <div>
          <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{admin.name}</div>
          <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
            管理员 • 添加时间: {new Date(admin.addedAt).toLocaleString()}
          </div>
        </div>
      </div>
      {admin.name !== userInfo.name && (
        <button
          onClick={() => removeAdmin(admin.name)}
          style={{
            padding: '6px 12px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          移除
        </button>
      )}
    </div>
  );

  if (!userInfo || !userInfo.name) {
    return (
      <div style={{ 
        maxWidth: 1000, 
        margin: '40px auto', 
        background: '#fff', 
        borderRadius: 15, 
        padding: 30, 
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: 30,
          paddingBottom: 20,
          borderBottom: '2px solid #ecf0f1'
        }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              marginRight: 15,
              color: '#7f8c8d'
            }}
          >
            ←
          </button>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>
            管理 管理员面板
          </h2>
        </div>
        <div style={{ color: '#7f8c8d', fontSize: '16px' }}>
          请先在个人信息页面填写姓名信息
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: 1000, 
      margin: '40px auto', 
      background: '#fff', 
      borderRadius: 15, 
      padding: 30, 
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: 30,
        paddingBottom: 20,
        borderBottom: '2px solid #ecf0f1'
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            marginRight: 15,
            color: '#7f8c8d'
          }}
        >
          ←
        </button>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>
          管理 管理员面板
        </h2>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: 10, 
        marginBottom: 25,
        borderBottom: '1px solid #e9ecef'
      }}>
        <button
          onClick={() => setActiveTab('feedback')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'feedback' ? '#e74c3c' : '#f8f9fa',
            color: activeTab === 'feedback' ? 'white' : '#6c757d',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          用户反馈 ({feedbacks.length})
        </button>
        <button
          onClick={() => setActiveTab('admins')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'admins' ? '#e74c3c' : '#f8f9fa',
            color: activeTab === 'admins' ? 'white' : '#6c757d',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          👥 管理员管理 ({adminUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'maintenance' ? '#e74c3c' : '#f8f9fa',
            color: activeTab === 'maintenance' ? 'white' : '#6c757d',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          🔧 维护模式 {maintenanceMode && '🔴'}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
          加载中...
        </div>
      ) : (
        <div>
          {activeTab === 'feedback' ? (
            <div>
              {feedbacks.length > 0 ? (
                feedbacks.map(feedback => renderFeedback(feedback))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
                  <div>暂无用户反馈</div>
                </div>
              )}
            </div>
          ) : activeTab === 'admins' ? (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>添加新管理员</h3>
                <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索用户姓名..."
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 6,
                      border: '1px solid #dee2e6',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    onClick={searchUsers}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    搜索
                  </button>
                </div>
                
                {searchResults.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>搜索结果:</h4>
                    {searchResults.map(user => renderUserSearchResult(user))}
                  </div>
                )}
              </div>

              <div>
                <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>当前管理员</h3>
                {adminUsers.length > 0 ? (
                  adminUsers.map(admin => renderAdminUser(admin))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>👥</div>
                    <div>暂无管理员</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>维护模式控制</h3>
                <div style={{
                  padding: '20px',
                  backgroundColor: maintenanceMode ? '#f8d7da' : '#d4edda',
                  borderRadius: 8,
                  border: `1px solid ${maintenanceMode ? '#f5c6cb' : '#c3e6cb'}`,
                  marginBottom: 20
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 10, 
                    marginBottom: 15 
                  }}>
                    <div style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: maintenanceMode ? '#dc3545' : '#28a745'
                    }}></div>
                    <span style={{ 
                      fontWeight: 'bold', 
                      color: maintenanceMode ? '#721c24' : '#155724' 
                    }}>
                      当前状态: {maintenanceMode ? '维护模式已开启' : '正常运行'}
                    </span>
                  </div>
                  {maintenanceMode && maintenanceMessage && (
                    <div style={{ 
                      color: '#721c24', 
                      fontSize: '14px',
                      fontStyle: 'italic'
                    }}>
                      维护消息: {maintenanceMessage}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 15 }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: 8, 
                    fontWeight: 'bold', 
                    color: '#2c3e50' 
                  }}>
                    维护消息（可选）
                  </label>
                  <textarea
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    placeholder="输入维护期间的提示消息..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: 6,
                      border: '1px solid #dee2e6',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <button
                  onClick={toggleMaintenanceMode}
                  disabled={maintenanceLoading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: maintenanceMode ? '#28a745' : '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: maintenanceLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    opacity: maintenanceLoading ? 0.6 : 1
                  }}
                >
                  {maintenanceLoading ? '处理中...' : (maintenanceMode ? '关闭维护模式' : '开启维护模式')}
                </button>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: 8,
                border: '1px solid #e9ecef'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>维护模式说明</h4>
                <ul style={{ margin: 0, paddingLeft: 20, color: '#6c757d', fontSize: '14px', lineHeight: '1.6' }}>
                  <li>开启维护模式后，普通用户将无法访问网站功能</li>
                  <li>管理员仍可正常使用管理功能</li>
                  <li>维护消息将显示给普通用户</li>
                  <li>建议在网站更新、数据迁移等操作时使用</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
