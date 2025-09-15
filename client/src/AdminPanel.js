import React, { useState, useEffect } from 'react';import { buildApiUrl, buildFileUrl } from './utils/apiUrl';

import api from './api';
import FileUploader from './FileUploader';

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
  const [activities, setActivities] = useState([]);
  const [showCreateActivity, setShowCreateActivity] = useState(false);

  useEffect(() => {
    if (activeTab === 'feedback') {
      loadFeedbacks();
    } else if (activeTab === 'admins') {
      loadAdminUsers();
    } else if (activeTab === 'maintenance') {
      loadMaintenanceStatus();
    } else if (activeTab === 'activities') {
      loadActivities();
    }
  }, [activeTab]);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl('/api/admin/feedback'));
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

  const loadActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl('/api/activities'));
      const data = await res.json();
      setActivities(data || []);
    } catch (error) {
      console.error('加载活动失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteActivity = async (id) => {
    if (!window.confirm('确定要删除这个活动吗？')) {
      return;
    }

    try {
      const res = await fetch(buildApiUrl(`/api/activities/${id}?authorName=${encodeURIComponent(userInfo.name)}&isAdmin=true`), {
        method: 'DELETE'
      });

      if (res.ok) {
        setActivities(prev => prev.filter(item => item._id !== id));
        alert('活动删除成功！');
      } else {
        const error = await res.json();
        alert(error.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    console.log(`🔍 前端开始搜索用户: "${searchQuery}"`);
    
    try {
      const apiUrl = buildApiUrl(`/api/admin/search-users?q=${encodeURIComponent(searchQuery)}`);
      console.log(`📡 请求URL: ${apiUrl}`);
      
      const res = await fetch(apiUrl);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ 搜索请求失败:', res.status, errorData);
        alert(`搜索失败: ${errorData.error || '未知错误'}`);
        return;
      }
      
      const data = await res.json();
      console.log(`✅ 搜索成功，收到 ${data.length} 个结果:`, data);
      setSearchResults(data || []);
    } catch (error) {
      console.error('❌ 搜索用户失败:', error);
      alert(`搜索失败: ${error.message}`);
    }
  };

  const addAdmin = async (userName) => {
    if (!userInfo || !userInfo.name) {
      alert('用户信息不完整，无法操作');
      return;
    }

    try {
      const res = await fetch(buildApiUrl('/api/admin/add-admin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userName: userName,
          addedBy: userInfo.name 
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
      const res = await fetch(buildApiUrl('/api/admin/remove-admin'), {
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
      const res = await fetch(buildApiUrl('/api/admin/maintenance/toggle'), {
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
          onClick={() => setActiveTab('activities')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'activities' ? '#e74c3c' : '#f8f9fa',
            color: activeTab === 'activities' ? 'white' : '#6c757d',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          🎯 设计活动 ({activities.length})
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
          ) : activeTab === 'activities' ? (
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 20 
              }}>
                <h3 style={{ margin: 0, color: '#2c3e50' }}>活动管理</h3>
                <button
                  onClick={() => setShowCreateActivity(true)}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  ➕ 创建活动
                </button>
              </div>

              {activities.length > 0 ? (
                <div>
                  {activities.map(activity => (
                    <div key={activity._id} style={{
                      background: '#fff',
                      borderRadius: 12,
                      padding: 20,
                      marginBottom: 15,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: '1px solid #e9ecef'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                        <div>
                          <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50', fontSize: '18px' }}>
                            {activity.title}
                          </h4>
                          <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: 10 }}>
                            创建者: {activity.authorName} ({activity.authorClass})
                          </div>
                          <div style={{ fontSize: '14px', color: '#6c757d' }}>
                            时间: {new Date(activity.startDate).toLocaleString()} - {new Date(activity.endDate).toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteActivity(activity._id)}
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
                      </div>
                      
                      {activity.image && (
                        <div style={{ marginBottom: 15 }}>
                          <img 
                            src={activity.image} 
                            alt={activity.title}
                            style={{ 
                              width: '100%', 
                              height: 200, 
                              objectFit: 'cover', 
                              borderRadius: 8,
                              border: '1px solid #e9ecef'
                            }} 
                          />
                        </div>
                      )}

                      <div style={{
                        color: '#6c757d',
                        lineHeight: '1.6',
                        marginBottom: 15,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {activity.description}
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: 15,
                        borderTop: '1px solid #e9ecef',
                        fontSize: '14px',
                        color: '#6c757d'
                      }}>
                        <div>
                          点赞: {activity.likes || 0} | 收藏: {activity.favorites?.length || 0} | 评论: {activity.comments?.length || 0}
                        </div>
                        <span>{new Date(activity.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎯</div>
                  <div>暂无活动</div>
                  <div style={{ fontSize: '14px', marginTop: '10px' }}>
                    点击"创建活动"按钮开始设计第一个活动
                  </div>
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

      {/* 创建活动表单 */}
      {showCreateActivity && <CreateActivityForm />}
    </div>
  );

  // 创建活动表单组件
  function CreateActivityForm() {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      image: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!formData.title || !formData.description || !formData.startDate || !formData.endDate) {
        alert('请填写所有必要信息');
        return;
      }

      if (!userInfo || !userInfo.name || !userInfo.class) {
        alert('用户信息不完整，无法创建活动');
        return;
      }

      try {
        setSubmitting(true);
        const res = await fetch(buildApiUrl('/api/activities'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            authorName: userInfo.name,
            authorClass: userInfo.class,
            authorAvatar: userInfo.avatar || ''
          })
        });

        if (res.ok) {
          const newActivity = await res.json();
          setActivities(prev => [newActivity, ...prev]);
          setFormData({ title: '', description: '', startDate: '', endDate: '', image: '' });
          setShowCreateActivity(false);
          alert('活动创建成功！');
        } else {
          const error = await res.json();
          alert(error.error || '创建失败');
        }
      } catch (error) {
        console.error('创建失败:', error);
        alert('创建失败');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: 15,
          padding: 30,
          maxWidth: 600,
          width: '90%',
          maxHeight: '90%',
          overflowY: 'auto'
        }}>
          <h3 style={{ marginBottom: 20, color: '#2c3e50', textAlign: 'center' }}>
            创建活动
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
                活动名称 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="请输入活动名称"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 8,
                  border: '2px solid #ecf0f1',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
                活动详细介绍 *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入活动详细介绍"
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 8,
                  border: '2px solid #ecf0f1',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 15, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
                  开始时间 *
                </label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 8,
                    border: '2px solid #ecf0f1',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
                  结束时间 *
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 8,
                    border: '2px solid #ecf0f1',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
                活动配图（可选）
              </label>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 20, 
                marginBottom: 15,
                padding: '20px',
                border: '2px dashed #ecf0f1',
                borderRadius: 8,
                backgroundColor: '#f8f9fa'
              }}>
                {formData.image ? (
                  <div style={{ textAlign: 'center' }}>
                    <img 
                      src={formData.image} 
                      alt="活动配图" 
                      style={{ 
                        maxWidth: '200px', 
                        maxHeight: 150, 
                        borderRadius: 8,
                        border: '2px solid #e9ecef',
                        marginBottom: '10px'
                      }} 
                    />
                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '10px' }}>
                      点击下方按钮更换图片
                    </div>
                    <FileUploader 
                      onUpload={(url) => setFormData(prev => ({ ...prev, image: url }))}
                      accept="image/*"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                      style={{
                        marginTop: '10px',
                        padding: '6px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      移除图片
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', color: '#6c757d', marginBottom: '10px' }}>📷</div>
                    <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '15px' }}>
                      点击下方按钮上传活动配图
                    </div>
                    <FileUploader 
                      onUpload={(url) => setFormData(prev => ({ ...prev, image: url }))}
                      accept="image/*"
                    />
                    <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '10px' }}>
                      支持 JPG、PNG、GIF 格式，建议尺寸 800x600
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 15, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowCreateActivity(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '12px 24px',
                  backgroundColor: submitting ? '#bdc3c7' : '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {submitting ? '创建中...' : '创建活动'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}
