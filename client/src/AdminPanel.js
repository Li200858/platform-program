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
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyContent, setReplyContent] = useState('');

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
    try {
      await api.admin.addAdmin({
        userName: userName,
        adminName: userInfo.name,
        adminClass: userInfo.class
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
        adminName: userInfo.name,
        adminClass: userInfo.class
      });
      setMessage(`已移除 ${userName} 的管理员权限`);
      loadUsers();
    } catch (error) {
      console.error('移除管理员失败:', error);
      setMessage('移除管理员失败，请重试');
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
                placeholder="搜索用户名..."
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
                style={{
                  padding: '10px 20px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                搜索
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
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px',
                    borderBottom: '1px solid #dee2e6',
                    background: '#fff',
                    borderRadius: 6,
                    marginBottom: 8
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
    </div>
  );
}