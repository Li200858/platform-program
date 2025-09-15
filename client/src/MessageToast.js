import React, { useState, useEffect } from 'react';

// 消息提示组件
export default function MessageToast({ message, type = 'info', duration = 3000, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!visible || !message) return null;

  const getStyle = () => {
    const baseStyle = {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '8px',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '14px',
      zIndex: 9999,
      maxWidth: '300px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      transform: visible ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease-in-out',
      cursor: 'pointer'
    };

    switch (type) {
      case 'success':
        return { ...baseStyle, backgroundColor: '#27ae60' };
      case 'error':
        return { ...baseStyle, backgroundColor: '#e74c3c' };
      case 'warning':
        return { ...baseStyle, backgroundColor: '#f39c12' };
      case 'info':
      default:
        return { ...baseStyle, backgroundColor: '#3498db' };
    }
  };

  return (
    <div style={getStyle()} onClick={() => setVisible(false)}>
      {message}
    </div>
  );
}

// 消息管理Hook
export function useMessageToast() {
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');

  const showMessage = (msg, msgType = 'info') => {
    setMessage(msg);
    setType(msgType);
  };

  const showSuccess = (msg) => showMessage(msg, 'success');
  const showError = (msg) => showMessage(msg, 'error');
  const showWarning = (msg) => showMessage(msg, 'warning');
  const showInfo = (msg) => showMessage(msg, 'info');

  const hideMessage = () => setMessage('');

  return {
    message,
    type,
    showMessage,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideMessage
  };
}
