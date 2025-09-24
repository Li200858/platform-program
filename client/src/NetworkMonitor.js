import { useState, useEffect } from 'react';

// 网络状态监控组件
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionQuality, setConnectionQuality] = useState('good');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionQuality('good');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionQuality('poor');
    };

    // 监听网络状态变化
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 定期检查网络质量
    const checkConnectionQuality = async () => {
      if (navigator.onLine) {
        try {
          const start = Date.now();
          const response = await fetch('/health', { 
            method: 'HEAD',
            cache: 'no-cache'
          });
          const duration = Date.now() - start;
          
          if (response.ok) {
            if (duration < 1000) {
              setConnectionQuality('good');
            } else if (duration < 3000) {
              setConnectionQuality('fair');
            } else {
              setConnectionQuality('poor');
            }
          } else {
            setConnectionQuality('poor');
          }
        } catch (error) {
          setConnectionQuality('poor');
        }
      }
    };

    // 每30秒检查一次网络质量
    const qualityInterval = setInterval(checkConnectionQuality, 30000);
    
    // 初始检查
    checkConnectionQuality();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(qualityInterval);
    };
  }, []);

  return { isOnline, connectionQuality };
};

// 网络状态显示组件
export const NetworkStatusIndicator = () => {
  const { isOnline, connectionQuality } = useNetworkStatus();

  if (isOnline) {
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        padding: '8px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold',
        zIndex: 1000,
        background: connectionQuality === 'good' ? '#27ae60' : 
                    connectionQuality === 'fair' ? '#f39c12' : '#e74c3c',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'white',
          animation: connectionQuality === 'good' ? 'pulse 2s infinite' : 'none'
        }} />
        {connectionQuality === 'good' ? '网络良好' : 
         connectionQuality === 'fair' ? '网络一般' : '网络较差'}
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      padding: '8px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 'bold',
      zIndex: 1000,
      background: '#e74c3c',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: 'white'
      }} />
      网络断开
    </div>
  );
};

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;
document.head.appendChild(style);
