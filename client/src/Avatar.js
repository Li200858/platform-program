import React from 'react';

export default function Avatar({ name, size = 40, style = {} }) {
  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const getColor = (name) => {
    if (!name) return '#95a5a6';
    const colors = [
      '#e74c3c', '#3498db', '#2ecc71', '#f39c12', 
      '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size * 0.4,
    fontWeight: 'bold',
    color: 'white',
    background: getColor(name),
    border: '2px solid #fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    ...style
  };

  return (
    <div style={avatarStyle}>
      {getInitials(name)}
    </div>
  );
}