// 通用卡片组件
import React from 'react';

const Card = ({
  children,
  title = '',
  subtitle = '',
  actions = null,
  className = '',
  style = {},
  hover = false,
  ...props
}) => {
  const cardStyles = {
    background: '#fff',
    borderRadius: '15px',
    padding: '20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    border: '1px solid #e9ecef',
    transition: hover ? 'all 0.3s ease' : 'none',
    ...style
  };

  const headerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: title || subtitle ? '15px' : '0',
    paddingBottom: title || subtitle ? '15px' : '0',
    borderBottom: title || subtitle ? '1px solid #ecf0f1' : 'none'
  };

  const titleStyles = {
    margin: '0',
    color: '#2c3e50',
    fontSize: '18px',
    fontWeight: 'bold'
  };

  const subtitleStyles = {
    margin: '5px 0 0 0',
    color: '#7f8c8d',
    fontSize: '14px'
  };

  return (
    <div
      className={className}
      style={cardStyles}
      onMouseEnter={hover ? (e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
      } : undefined}
      onMouseLeave={hover ? (e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
      } : undefined}
      {...props}
    >
      {(title || subtitle || actions) && (
        <div style={headerStyles}>
          <div>
            {title && <h3 style={titleStyles}>{title}</h3>}
            {subtitle && <p style={subtitleStyles}>{subtitle}</p>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
