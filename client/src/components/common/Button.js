// 通用按钮组件
import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  loading = false,
  variant = 'primary', // primary, secondary, danger, success, warning
  size = 'medium', // small, medium, large
  type = 'button',
  className = '',
  style = {},
  ...props 
}) => {
  const baseStyles = {
    border: 'none',
    borderRadius: '8px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    ...style
  };

  const sizeStyles = {
    small: { padding: '6px 12px', fontSize: '12px' },
    medium: { padding: '10px 20px', fontSize: '14px' },
    large: { padding: '12px 24px', fontSize: '16px' }
  };

  const variantStyles = {
    primary: {
      backgroundColor: '#3498db',
      color: 'white',
      '&:hover': { backgroundColor: '#2980b9' }
    },
    secondary: {
      backgroundColor: '#95a5a6',
      color: 'white',
      '&:hover': { backgroundColor: '#7f8c8d' }
    },
    danger: {
      backgroundColor: '#e74c3c',
      color: 'white',
      '&:hover': { backgroundColor: '#c0392b' }
    },
    success: {
      backgroundColor: '#27ae60',
      color: 'white',
      '&:hover': { backgroundColor: '#229954' }
    },
    warning: {
      backgroundColor: '#f39c12',
      color: 'white',
      '&:hover': { backgroundColor: '#e67e22' }
    }
  };

  const combinedStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    opacity: disabled || loading ? 0.6 : 1,
    ...style
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      style={combinedStyles}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'none';
        }
      }}
      {...props}
    >
      {loading && <span>⏳</span>}
      {children}
    </button>
  );
};

export default Button;
