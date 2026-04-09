import React, { useState, useEffect } from 'react';
import api from './api';

export default function Notifications({ userInfo, onBack }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userInfo && userInfo.name) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [userInfo]);

  const loadNotifications = async () => {
    if (!userInfo?.name) return;
    try {
      await api.notifications.markAllAsRead(userInfo.name);
      const data = await api.notifications.getNotifications(userInfo.name);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载通知失败:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like': return '♥';
      case 'comment': return '[评论]';
      case 'follow': return '[关注]';
      case 'mention': return '@';
      case 'favorite': return '★';
      default: return '[通知]';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'like': return '#e74c3c';
      case 'comment': return '#3498db';
      case 'follow': return '#27ae60';
      case 'mention': return '#f39c12';
      case 'favorite': return '#f39c12';
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
        <h2 style={{ margin: 0, color: '#2c3e50', flex: 1 }}>通知</h2>
      </div>

      <div style={{ marginBottom: 20, padding: '15px', background: '#f8f9fa', borderRadius: 8 }}>
        <div style={{ fontSize: '14px', color: '#2c3e50' }}>
          共 {notifications.length} 条通知
        </div>
      </div>

      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>暂无通知</div>
          <div style={{ fontSize: '14px' }}>当有人关注你、点赞你的作品或评论时会收到通知</div>
        </div>
      ) : (
        <div>
          {notifications.map(notification => (
            <div
              key={notification._id}
              style={{
                border: '1px solid #ecf0f1',
                borderRadius: 12,
                padding: 20,
                marginBottom: 15,
                background: '#f8f9fa',
                transition: 'all 0.2s ease',
                borderLeft: `4px solid ${getNotificationColor(notification.type)}`
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
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                      {formatTime(notification.createdAt)}
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
