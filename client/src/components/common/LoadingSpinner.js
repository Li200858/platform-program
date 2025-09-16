// 加载动画组件
import React from 'react';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = '#3498db', 
  text = '加载中...',
  showText = true,
  style = {} 
}) => {
  const sizeStyles = {
    small: { width: '20px', height: '20px' },
    medium: { width: '40px', height: '40px' },
    large: { width: '60px', height: '60px' }
  };

  const spinnerStyles = {
    border: `3px solid #f3f3f3`,
    borderTop: `3px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    ...sizeStyles[size],
    ...style
  };

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '20px'
  };

  const textStyles = {
    color: '#7f8c8d',
    fontSize: '14px',
    margin: 0
  };

  return (
    <div style={containerStyles}>
      <div style={spinnerStyles}></div>
      {showText && <p style={textStyles}>{text}</p>}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
