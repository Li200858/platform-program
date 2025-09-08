import React from 'react';

export default function DefaultAvatar({ size = 40, name = '用户', style = {} }) {
  // 根据姓名生成背景色
  const getBackgroundColor = (name) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // 获取姓名首字母
  const getInitials = (name) => {
    if (!name || name.trim() === '') return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const backgroundColor = getBackgroundColor(name);
  const initials = getInitials(name);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: size * 0.4,
        fontWeight: 'bold',
        border: '2px solid #fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        ...style
      }}
      title={name}
    >
      {initials}
    </div>
  );
}
