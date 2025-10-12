import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';
import api from './api';

export default function Notifications({ userInfo, onBack }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (userInfo && userInfo.name) {
      loadNotifications();
      // 每5秒刷新一次通知
      const interval = setInterval(loadNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [userInfo]);

  const loadNotifications = async () => {
    try {
      const data = await api.notifications.getNotifications(userInfo.name);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载通知失败:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === id 
            ? { ...notification, isRead: true, readAt: new Date() }
            : notification
        )
      );
    } catch (error) {
      console.error('标记通知失败:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead(userInfo.name);
      setNotifications(prev => 
        prev.map(notification => ({ 
          ...notification, 
          isRead: true, 
          readAt: new Date() 
        }))
      );
      setMessage('所有通知已标记为已读');
    } catch (error) {
      console.error('标记所有通知失败:', error);
      setMessage('操作失败，请重试');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like': return '♥';
      case 'comment': return '[评论]';
      case 'follow': return '[关注]';
      case 'mention': return '@';
      default: return '[通知]';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'like': return '#e74c3c';
      case 'comment': return '#3498db';
      case 'follow': return '#27ae60';
      case 'mention': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
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
          <h2 style={{ margin: 0, color: '#2c3e50' }}>通知</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
          加载中...
        </div>
      </div>
    );
  }

  if (!userInfo || !userInfo.name) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
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
          <h2 style={{ margin: 0, color: '#2c3e50' }}>通知</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
          请先完善个人信息
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
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
        <h2 style={{ margin: 0, color: '#2c3e50', flex: 1 }}>通知</h2>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            style={{
              padding: '8px 16px',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            全部已读
          </button>
        )}
      </div>

      {/* 消息显示 */}
      {message && (
        <div style={{ 
          marginBottom: 20, 
          padding: '15px', 
          background: '#d4edda',
          color: '#155724',
          borderRadius: 8,
          border: '1px solid #c3e6cb'
        }}>
          {message}
        </div>
      )}

      {/* 通知统计 */}
      <div style={{ marginBottom: 20, padding: '15px', background: '#f8f9fa', borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '14px', color: '#2c3e50' }}>
            共 {notifications.length} 条通知
          </div>
          {unreadCount > 0 && (
            <div style={{ 
              fontSize: '14px', 
              color: '#e74c3c', 
              fontWeight: 'bold',
              padding: '4px 8px',
              background: '#fff',
              borderRadius: 4,
              border: '1px solid #e74c3c'
            }}>
              {unreadCount} 条未读
            </div>
          )}
        </div>
      </div>

      {/* 通知列表 */}
      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}></div>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>暂无通知</div>
          <div style={{ fontSize: '14px' }}>当有人关注你、点赞你的作品或评论时会收到通知</div>
        </div>
      ) : (
        <div>
          {notifications.map(notification => (
            <div
              key={notification._id}
              onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
              style={{
                border: '1px solid #ecf0f1',
                borderRadius: 12,
                padding: 20,
                marginBottom: 15,
                background: notification.isRead ? '#f8f9fa' : '#fff',
                cursor: notification.isRead ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                borderLeft: `4px solid ${getNotificationColor(notification.type)}`
              }}
              onMouseEnter={(e) => {
                if (!notification.isRead) {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!notification.isRead) {
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 15 }}>
                <div style={{
                  fontSize: '24px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${getNotificationColor(notification.type)}20`,
                  borderRadius: '50%'
                }}>
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: 8
                  }}>
                    <div style={{ 
                      fontWeight: 'bold', 
                      color: '#2c3e50', 
                      fontSize: '16px' 
                    }}>
                      {notification.content}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {!notification.isRead && (
                        <div style={{
                          width: '8px',
                          height: '8px',
                          background: '#e74c3c',
                          borderRadius: '50%'
                        }} />
                      )}
                      <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                        {formatTime(notification.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#7f8c8d',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                  }}>
                    <span>来自: {notification.sender}</span>
                    {notification.relatedType && (
                      <>
                        <span>•</span>
                        <span>
                          {notification.relatedType === 'art' ? '艺术作品' :
                           notification.relatedType === 'activity' ? '活动设计' :
                           notification.relatedType === 'feedback' ? '意见反馈' :
                           notification.relatedType === 'user' ? '用户' :
                           '未知'}
                        </span>
                      </>
                    )}
                  </div>
                  
                  {notification.isRead && notification.readAt && (
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#95a5a6',
                      marginTop: 5
                    }}>
                      已读于 {formatTime(notification.readAt)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
