import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';
import FilePreview from './FilePreview';
import api from './api';

export default function Messages({ userInfo, onBack }) {
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (userInfo && userInfo.name) {
      loadMessages();
    }
  }, [userInfo]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await api.messages.getMessages(userInfo.name);
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载私信失败:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (otherUser) => {
    try {
      const data = await api.messages.getConversation(userInfo.name, otherUser);
      setConversation(Array.isArray(data) ? data : []);
      setSelectedUser(otherUser);
    } catch (error) {
      console.error('加载对话失败:', error);
      setConversation([]);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    try {
      await api.messages.send({
        sender: userInfo.name,
        receiver: selectedUser,
        content: newMessage.trim()
      });

      setNewMessage('');
      loadConversation(selectedUser); // 重新加载对话
      loadMessages(); // 重新加载消息列表
    } catch (error) {
      console.error('发送消息失败:', error);
      setMessage('发送失败，请重试');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 获取对话列表（去重）
  const getConversationList = () => {
    const conversations = new Map();
    
    messages.forEach(msg => {
      const otherUser = msg.sender === userInfo.name ? msg.receiver : msg.sender;
      if (!conversations.has(otherUser) || conversations.get(otherUser).createdAt < msg.createdAt) {
        conversations.set(otherUser, msg);
      }
    });

    return Array.from(conversations.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  if (loading) {
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
          <h2 style={{ margin: 0, color: '#2c3e50' }}>私信</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
          加载中...
        </div>
      </div>
    );
  }

  if (!userInfo || !userInfo.name) {
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
          <h2 style={{ margin: 0, color: '#2c3e50' }}>私信</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
          请先完善个人信息
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      {/* 头部 */}
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
        <h2 style={{ margin: 0, color: '#2c3e50', flex: 1 }}>私信</h2>
      </div>

      {/* 消息显示 */}
      {message && (
        <div style={{ 
          marginBottom: 20, 
          padding: '15px', 
          background: message.includes('发送') ? '#d4edda' : '#f8d7da',
          color: message.includes('发送') ? '#155724' : '#721c24',
          borderRadius: 8,
          border: `1px solid ${message.includes('发送') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: 20, height: '600px' }}>
        {/* 对话列表 */}
        <div style={{ 
          width: '300px', 
          border: '1px solid #ecf0f1', 
          borderRadius: 8, 
          overflow: 'auto',
          background: '#f8f9fa'
        }}>
          <div style={{ padding: '15px', borderBottom: '1px solid #ecf0f1', background: '#fff' }}>
            <h3 style={{ margin: 0, color: '#2c3e50' }}>对话列表</h3>
          </div>
          
          {getConversationList().length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>
              暂无对话
            </div>
          ) : (
            getConversationList().map(msg => {
              const otherUser = msg.sender === userInfo.name ? msg.receiver : msg.sender;
              const isSelected = selectedUser === otherUser;
              
              return (
                <div
                  key={`${msg.sender}-${msg.receiver}`}
                  onClick={() => loadConversation(otherUser)}
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid #ecf0f1',
                    cursor: 'pointer',
                    background: isSelected ? '#e3f2fd' : '#fff',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = '#f8f9fa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = '#fff';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={otherUser} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '14px' }}>
                        {otherUser}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#7f8c8d',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {msg.content.length > 30 ? `${msg.content.substring(0, 30)}...` : msg.content}
                      </div>
                      <div style={{ fontSize: '11px', color: '#95a5a6' }}>
                        {new Date(msg.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {msg.receiver === userInfo.name && !msg.isRead && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: '#e74c3c',
                        borderRadius: '50%'
                      }} />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 对话内容 */}
        <div style={{ 
          flex: 1, 
          border: '1px solid #ecf0f1', 
          borderRadius: 8, 
          display: 'flex',
          flexDirection: 'column',
          background: '#fff'
        }}>
          {selectedUser ? (
            <>
              {/* 对话头部 */}
              <div style={{ 
                padding: '15px', 
                borderBottom: '1px solid #ecf0f1', 
                background: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <Avatar name={selectedUser} size={35} />
                <div>
                  <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    {selectedUser}
                  </div>
                </div>
              </div>

              {/* 消息列表 */}
              <div style={{ 
                flex: 1, 
                padding: '15px', 
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}>
                {conversation.map(msg => (
                  <div
                    key={msg._id}
                    style={{
                      display: 'flex',
                      justifyContent: msg.sender === userInfo.name ? 'flex-end' : 'flex-start',
                      marginBottom: 10
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      padding: '10px 15px',
                      borderRadius: '15px',
                      background: msg.sender === userInfo.name ? '#3498db' : '#ecf0f1',
                      color: msg.sender === userInfo.name ? 'white' : '#2c3e50',
                      fontSize: '14px',
                      lineHeight: 1.4
                    }}>
                      {msg.content}
                      <div style={{
                        fontSize: '11px',
                        opacity: 0.7,
                        marginTop: 5,
                        textAlign: 'right'
                      }}>
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 发送消息 */}
              <div style={{ 
                padding: '15px', 
                borderTop: '1px solid #ecf0f1',
                display: 'flex',
                gap: 10
              }}>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入消息..."
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    resize: 'none',
                    fontSize: '14px',
                    minHeight: '40px',
                    maxHeight: '100px'
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  style={{
                    padding: '10px 20px',
                    background: newMessage.trim() ? '#3498db' : '#95a5a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  发送
                </button>
              </div>
            </>
          ) : (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#7f8c8d',
              fontSize: '16px'
            }}>
              选择一个对话开始聊天
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
