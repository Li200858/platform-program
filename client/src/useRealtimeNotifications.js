/**
 * WebSocket实时通知Hook
 * 无需轮询，服务器主动推送
 */

import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export function useRealtimeNotifications(userInfo) {
  const [socket, setSocket] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (!userInfo || !userInfo.name) {
      return;
    }

    // 连接WebSocket服务器
    const baseUrl = process.env.REACT_APP_API_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://platform-program.onrender.com' 
        : 'http://localhost:5000');

    const newSocket = io(baseUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    console.log('🔌 连接WebSocket服务器...', baseUrl);

    // 连接成功
    newSocket.on('connect', () => {
      console.log(' WebSocket连接成功');
      // 注册用户
      newSocket.emit('register', userInfo.name);
    });

    // 接收实时通知
    newSocket.on('new-notification', (notification) => {
      console.log(' 收到实时通知:', notification);
      
      // 更新通知数量
      setNotificationCount(prev => prev + 1);
      
      // 显示弹窗提醒
      showNotificationToast(notification);
      
      // 如果浏览器支持，发送系统通知
      if (Notification.permission === 'granted') {
        new Notification('新通知', {
          body: notification.message || notification.content,
          icon: '/favicon.ico',
          tag: 'notification-' + notification._id
        });
      }
    });

    // 连接错误（静默处理，不影响页面）
    newSocket.on('connect_error', (error) => {
      console.log('WebSocket连接失败（不影响使用）:', error.message);
    });

    // 断开连接
    newSocket.on('disconnect', () => {
      console.log('🔌 WebSocket断开连接');
    });

    setSocket(newSocket);

    // 清理
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [userInfo?.name]);

  return { socket, notificationCount, setNotificationCount };
}

// 显示通知弹窗
function showNotificationToast(notification) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
    z-index: 10000;
    font-size: 14px;
    max-width: 320px;
    animation: slideInRight 0.4s ease-out;
    cursor: pointer;
  `;

  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="font-size: 24px;"></div>
      <div style="flex: 1;">
        <div style="font-weight: bold; margin-bottom: 4px;">新通知</div>
        <div style="font-size: 13px; opacity: 0.95;">
          ${notification.message || notification.content}
        </div>
      </div>
    </div>
  `;

  // 点击跳转到通知页面
  toast.onclick = () => {
    if (window.setSection) {
      window.setSection('notifications');
    }
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  };

  document.body.appendChild(toast);

  // 5秒后自动消失
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = 'slideOutRight 0.4s ease-in';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 400);
    }
  }, 5000);
}

// 添加动画样式
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

