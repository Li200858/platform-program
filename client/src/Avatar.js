import React, { useState } from 'react';
import DefaultAvatar from './DefaultAvatar';

export default function Avatar({ 
  src, 
  name = '用户', 
  size = 40, 
  style = {},
  className = '',
  alt = '头像'
}) {
  const [imageError, setImageError] = useState(false);
  
  // 如果没有头像URL或URL无效，或图片加载失败，显示默认头像
  if (!src || src.trim() === '' || src.includes('picsum.photos') || imageError) {
    return (
      <DefaultAvatar 
        name={name} 
        size={size} 
        style={style}
        className={className}
      />
    );
  }

  // 有有效头像URL时显示真实头像
  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        border: '2px solid #fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        ...style
      }}
      className={className}
      onError={() => setImageError(true)}
    />
  );
}
