import React, { useState, useEffect } from 'react';
import FilePreview from './FilePreview';
import api from './api';

export default function AdminPanel({ userInfo, onBack }) {
  const [activeTab, setActiveTab] = useState('feedbacks');
  const [feedbacks, setFeedbacks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [maintenanceStatus, setMaintenanceStatus] = useState({ isEnabled: false, message: '' });
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  useEffect(() => {
    if (activeTab === 'feedbacks') {
      loadFeedbacks();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'maintenance') {
      loadMaintenanceStatus();
    }
  }, [activeTab]);

  // 加载维护模式状态
  const loadMaintenanceStatus = async () => {
    try {
      const status = await api.maintenance.getStatus();
      setMaintenanceStatus(status);
      setMaintenanceMessage(status.message || '');
    } catch (error) {
      console.error('加载维护状态失败:', error);
      setMessage('加载维护状态失败');
    }
  };

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const data = await api.adminFeedback.getAll();
      setFeedbacks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载反馈失败:', error);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackClick = async (feedbackId) => {
    try {
      const feedback = await api.adminFeedback.getById(feedbackId);
      setSelectedFeedback(feedback);
    } catch (error) {
      console.error('获取反馈详情失败:', error);
      setMessage('获取反馈详情失败');
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim() || !selectedFeedback) return;

    try {
      await api.adminFeedback.reply(selectedFeedback._id, {
        content: replyContent,
        adminName: userInfo.name,
        adminClass: userInfo.class
      });
      
      setReplyContent('');
      setMessage('回复成功！');
      
      // 重新加载反馈详情
      const updatedFeedback = await api.adminFeedback.getById(selectedFeedback._id);
      setSelectedFeedback(updatedFeedback);
      
      // 重新加载反馈列表
      loadFeedbacks();
    } catch (error) {
      console.error('回复失败:', error);
      setMessage('回复失败，请重试');
    }
  };

  const handleMarkReceived = async (feedbackId) => {
    try {
      await api.adminFeedback.markReceived(feedbackId);
      setMessage('已标记为收到');
      loadFeedbacks();
      
      if (selectedFeedback && selectedFeedback._id === feedbackId) {
        const updatedFeedback = await api.adminFeedback.getById(feedbackId);
        setSelectedFeedback(updatedFeedback);
      }
    } catch (error) {
      console.error('标记失败:', error);
      setMessage('标记失败，请重试');
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
      setMessage('请输入搜索关键词');
      return;
    }

    try {
      setSearchLoading(true);
      setMessage('');
      const data = await api.admin.searchUsers(searchQuery);
      const results = Array.isArray(data) ? data : [];
      setSearchResults(results);
      
      if (results.length === 0) {
        setMessage('未找到匹配的用户');
      } else {
        setMessage(`找到 ${results.length} 个匹配的用户`);
      }
    } catch (error) {
      console.error('搜索用户失败:', error);
      setSearchResults([]);
      setMessage('搜索失败，请重试');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddAdmin = async (userName) => {
    try {
      await api.admin.addAdmin({
        userName: userName,
        addedBy: userInfo.name
      });
      setMessage(`已添加 ${userName} 为管理员`);
      loadUsers();
    } catch (error) {
      console.error('添加管理员失败:', error);
      setMessage('添加管理员失败，请重试');
    }
  };

  const handleRemoveAdmin = async (userName) => {
    try {
      await api.admin.removeAdmin({
        userName: userName,
        removedBy: userInfo.name
      });
      setMessage(`已移除 ${userName} 的管理员权限`);
      loadUsers();
    } catch (error) {
      console.error('移除管理员失败:', error);
      setMessage('移除管理员失败，请重试');
    }
  };

  // 维护模式管理函数
  const handleEnableMaintenance = async () => {
    try {
      await api.maintenance.enable({
        message: maintenanceMessage,
        adminName: userInfo.name
      });
      setMessage('维护模式已开启');
      loadMaintenanceStatus();
    } catch (error) {
      console.error('开启维护模式失败:', error);
      setMessage('开启维护模式失败，请重试');
    }
  };

  const handleDisableMaintenance = async () => {
    try {
      await api.maintenance.disable();
      setMessage('维护模式已关闭');
      loadMaintenanceStatus();
    } catch (error) {
      console.error('关闭维护模式失败:', error);
      setMessage('关闭维护模式失败，请重试');
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
        <h2 style={{ margin: 0, color: '#2c3e50' }}>管理员面板</h2>
      </div>

      {/* 消息显示 */}
      {message && (
        <div style={{ 
          marginBottom: 20, 
          padding: '15px', 
          background: message.includes('成功') || message.includes('已') ? '#d4edda' : '#f8d7da',
          color: message.includes('成功') || message.includes('已') ? '#155724' : '#721c24',
          borderRadius: 8,
          border: `1px solid ${message.includes('成功') || message.includes('已') ? '#c3e6cb' : '#f5c6cb'}`
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
        <button
          onClick={() => setActiveTab('maintenance')}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: activeTab === 'maintenance' ? '2px solid #3498db' : '2px solid #ecf0f1',
            background: activeTab === 'maintenance' ? '#3498db' : '#fff',
            color: activeTab === 'maintenance' ? '#fff' : '#2c3e50',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          维护模式
        </button>
      </div>

      {activeTab === 'feedbacks' && (
        <div>
          <h3 style={{ marginBottom: 20, color: '#2c3e50' }}>意见反馈管理</h3>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
              加载中...
            </div>
          ) : selectedFeedback ? (
            <div>
              <button
                onClick={() => setSelectedFeedback(null)}
                style={{
                  padding: '8px 16px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  marginBottom: 20
                }}
              >
                ← 返回列表
              </button>
              
              <div style={{ 
                border: '1px solid #ecf0f1', 
                borderRadius: 8,
                padding: 20,
                background: '#f8f9fa',
                marginBottom: 20
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' }}>
                      {selectedFeedback.authorName} ({selectedFeedback.authorClass})
                    </div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                      {new Date(selectedFeedback.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 12,
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: selectedFeedback.status === 'received' ? '#d4edda' : 
                                 selectedFeedback.status === 'processing' ? '#fff3cd' : '#f8d7da',
                      color: selectedFeedback.status === 'received' ? '#155724' : 
                             selectedFeedback.status === 'processing' ? '#856404' : '#721c24'
                    }}>
                      {selectedFeedback.status === 'received' ? '已收到' : 
                       selectedFeedback.status === 'processing' ? '处理中' : '待处理'}
                    </span>
                    {selectedFeedback.status !== 'received' && (
                      <button
                        onClick={() => handleMarkReceived(selectedFeedback._id)}
                        style={{
                          padding: '4px 12px',
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        已收到
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '14px', color: '#34495e', lineHeight: 1.5, marginBottom: 15 }}>
                  {selectedFeedback.content}
                </div>

                {selectedFeedback.media && selectedFeedback.media.length > 0 && (
                  <div style={{ marginBottom: 15 }}>
                    <h4 style={{ marginBottom: 10, color: '#2c3e50', fontSize: '14px' }}>附件文件</h4>
                    <FilePreview 
                      urls={selectedFeedback.media} 
                      apiBaseUrl={process.env.NODE_ENV === 'production' ? 'https://platform-program.onrender.com' : 'http://localhost:5000'} 
                    />
                  </div>
                )}
              </div>

              {/* 对话记录 */}
              {selectedFeedback.conversations && selectedFeedback.conversations.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ marginBottom: 15, color: '#2c3e50' }}>对话记录</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selectedFeedback.conversations.map(conv => (
                      <div key={conv.id} style={{
                        padding: 15,
                        borderRadius: 8,
                        background: conv.isAdmin ? '#e3f2fd' : '#f5f5f5',
                        borderLeft: `4px solid ${conv.isAdmin ? '#2196f3' : '#4caf50'}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                            {conv.authorName} {conv.isAdmin && '(管理员)'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                            {new Date(conv.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div style={{ fontSize: '14px', color: '#34495e' }}>
                          {conv.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 回复框 */}
              <div style={{ 
                border: '1px solid #ecf0f1', 
                borderRadius: 8,
                padding: 20,
                background: '#fff'
              }}>
                <h4 style={{ marginBottom: 15, color: '#2c3e50' }}>回复反馈</h4>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="请输入回复内容..."
                  style={{
                    width: '100%',
                    height: '100px',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    fontSize: '14px',
                    resize: 'vertical',
                    marginBottom: 15
                  }}
                />
                <button
                  onClick={handleReply}
                  disabled={!replyContent.trim()}
                  style={{
                    padding: '10px 20px',
                    background: replyContent.trim() ? '#007bff' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: replyContent.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  发送回复
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              {feedbacks.map(feedback => (
                <div 
                  key={feedback._id} 
                  onClick={() => handleFeedbackClick(feedback._id)}
                  style={{ 
                    border: '1px solid #ecf0f1', 
                    borderRadius: 8,
                    padding: 20,
                    background: '#f8f9fa',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#e9ecef';
                    e.target.style.borderColor = '#007bff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#f8f9fa';
                    e.target.style.borderColor = '#ecf0f1';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50' }}>
                      {feedback.authorName} ({feedback.authorClass})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 12,
                        fontSize: '12px',
                        fontWeight: 'bold',
                        background: feedback.status === 'received' ? '#d4edda' : 
                                   feedback.status === 'processing' ? '#fff3cd' : '#f8d7da',
                        color: feedback.status === 'received' ? '#155724' : 
                               feedback.status === 'processing' ? '#856404' : '#721c24'
                      }}>
                        {feedback.status === 'received' ? '已收到' : 
                         feedback.status === 'processing' ? '处理中' : '待处理'}
                      </span>
                      <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                        {new Date(feedback.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', color: '#34495e', lineHeight: 1.5 }}>
                    {feedback.content.length > 100 ? 
                      feedback.content.substring(0, 100) + '...' : 
                      feedback.content
                    }
                  </div>
                  {feedback.conversations && feedback.conversations.length > 0 && (
                    <div style={{ fontSize: '12px', color: '#007bff', marginTop: 8 }}>
                      有 {feedback.conversations.length} 条对话记录
                    </div>
                  )}
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
          
          {/* 搜索用户 */}
          <div style={{ marginBottom: 30 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchUsers();
                  }
                }}
                placeholder="搜索用户名或班级..."
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: '14px'
                }}
              />
              <button
                onClick={handleSearchUsers}
                disabled={searchLoading}
                style={{
                  padding: '10px 20px',
                  background: searchLoading ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: searchLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  minWidth: '80px'
                }}
              >
                {searchLoading ? '搜索中...' : '搜索'}
              </button>
            </div>
            
            {searchResults.length > 0 && (
              <div style={{ 
                border: '1px solid #ecf0f1', 
                borderRadius: 8,
                background: '#f8f9fa',
                padding: 15
              }}>
                <h4 style={{ marginBottom: 10, color: '#2c3e50' }}>搜索结果</h4>
                {searchResults.map((user, index) => (
                  <div key={user.userID || index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '15px',
                    borderBottom: '1px solid #dee2e6',
                    background: '#fff',
                    borderRadius: 6,
                    marginBottom: 8
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '16px' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '4px' }}>
                        班级: {user.class}
                      </div>
                      {user.userID && user.userID !== 'unknown' && (
                        <div style={{ fontSize: '11px', color: '#95a5a6', marginTop: '2px' }}>
                          ID: {user.userID}
                        </div>
                      )}
                      {user.isAdmin && (
                        <div style={{ 
                          fontSize: '10px', 
                          color: '#e74c3c', 
                          fontWeight: 'bold',
                          marginTop: '4px'
                        }}>
                          当前是管理员
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!user.isAdmin ? (
                        <button
                          onClick={() => handleAddAdmin(user.name)}
                          style={{
                            padding: '6px 12px',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          设为管理员
                        </button>
                      ) : (
                        <span style={{
                          padding: '6px 12px',
                          background: '#6c757d',
                          color: 'white',
                          borderRadius: 4,
                          fontSize: '12px'
                        }}>
                          已是管理员
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 管理员列表 */}
          <div>
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
                      <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                        班级: {user.class}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAdmin(user.name)}
                      style={{
                        padding: '6px 12px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      移除管理员
                    </button>
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
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div>
          <h3 style={{ marginBottom: 20, color: '#2c3e50' }}>维护模式管理</h3>
          
          {/* 当前状态显示 */}
          <div style={{ 
            marginBottom: 30, 
            padding: '20px', 
            background: maintenanceStatus.isEnabled ? '#fff3cd' : '#d4edda',
            border: `1px solid ${maintenanceStatus.isEnabled ? '#ffeaa7' : '#c3e6cb'}`,
            borderRadius: 8
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: 10 
            }}>
              <div style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: maintenanceStatus.isEnabled ? '#f39c12' : '#27ae60',
                marginRight: 10
              }}></div>
              <strong style={{ 
                color: maintenanceStatus.isEnabled ? '#856404' : '#155724',
                fontSize: '16px'
              }}>
                {maintenanceStatus.isEnabled ? '维护模式已开启' : '维护模式已关闭'}
              </strong>
            </div>
            {maintenanceStatus.isEnabled && (
              <div style={{ 
                color: '#856404',
                fontSize: '14px',
                marginTop: 10
              }}>
                维护信息：{maintenanceStatus.message}
              </div>
            )}
            {maintenanceStatus.enabledBy && (
              <div style={{ 
                color: '#6c757d',
                fontSize: '12px',
                marginTop: 5
              }}>
                操作者：{maintenanceStatus.enabledBy} | 
                时间：{maintenanceStatus.enabledAt ? new Date(maintenanceStatus.enabledAt).toLocaleString() : '未知'}
              </div>
            )}
          </div>

          {/* 维护模式控制 */}
          <div style={{ 
            padding: '20px', 
            background: '#f8f9fa', 
            borderRadius: 8,
            border: '1px solid #ecf0f1'
          }}>
            <h4 style={{ marginBottom: 15, color: '#2c3e50' }}>
              {maintenanceStatus.isEnabled ? '关闭维护模式' : '开启维护模式'}
            </h4>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: 'block', 
                marginBottom: 8, 
                fontWeight: 'bold', 
                color: '#2c3e50' 
              }}>
                维护提示信息
              </label>
              <textarea
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="请输入维护期间的提示信息..."
                rows={3}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: 8, 
                  border: '2px solid #ecf0f1', 
                  resize: 'vertical',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {maintenanceStatus.isEnabled ? (
                <button
                  onClick={handleDisableMaintenance}
                  style={{
                    padding: '12px 24px',
                    background: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  关闭维护模式
                </button>
              ) : (
                <button
                  onClick={handleEnableMaintenance}
                  style={{
                    padding: '12px 24px',
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  开启维护模式
                </button>
              )}
            </div>
          </div>

          {/* 维护模式说明 */}
          <div style={{ 
            marginTop: 20, 
            padding: '15px', 
            background: '#e3f2fd', 
            borderRadius: 8,
            border: '1px solid #bbdefb'
          }}>
            <h5 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>维护模式说明：</h5>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#1976d2', fontSize: '14px' }}>
              <li>开启维护模式后，普通用户将无法发布作品、活动或评论</li>
              <li>用户将看到维护提示信息，但可以正常浏览内容</li>
              <li>管理员可以正常使用所有功能</li>
              <li>维护模式可以随时开启或关闭</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}