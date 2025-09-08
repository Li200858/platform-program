import React, { useState, useEffect } from 'react';
import ContentPublish from './ContentPublish';
import Avatar from './Avatar';
import config from './config';

export default function CrossCampus({ user }) {
  const [list, setList] = useState([]);
  const [showPublish, setShowPublish] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetch('/api/crosscampus')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setList(data);
        } else {
          console.error('API返回的数据不是数组:', data);
          setList([]);
        }
      });
  }, []);

  const renderMedia = (urls) => (
    <div style={{ marginTop: 8 }}>
      {urls && urls.map((url, idx) => {
        const ext = url.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
          return (
            <img 
              key={idx} 
              src={`${config.API_BASE_URL}${url}`} 
              alt="" 
              style={{ maxWidth: 120, marginRight: 8, cursor: 'pointer' }} 
              onClick={() => setSelectedImage(`${config.API_BASE_URL}${url}`)}
            />
          );
        }
        if (['mp4', 'webm', 'ogg'].includes(ext)) {
          return <video key={idx} src={`${config.API_BASE_URL}${url}`} controls style={{ maxWidth: 180, marginRight: 8 }} />;
        }
        return (
          <a 
            key={idx} 
            href={`${config.API_BASE_URL}${url}`} 
            download 
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              marginRight: 8, 
              color: '#007bff', 
              textDecoration: 'underline',
              display: 'inline-block',
              padding: '4px 8px',
              border: '1px solid #007bff',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            下载文件{idx + 1}
          </a>
        );
      })}
    </div>
  );

  if (showPublish) {
    return (
      <ContentPublish 
        type="crosscampus" 
        onBack={() => setShowPublish(false)}
      />
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', background: '#fff', borderRadius: 10, padding: 30, boxShadow: '0 2px 8px #eee' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>跨校联合板块</h2>
        <button 
          onClick={() => setShowPublish(true)}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#3498db', 
            color: 'white', 
            border: 'none', 
            borderRadius: 5,
            cursor: 'pointer'
          }}
        >
          发布内容
        </button>
      </div>
      
      <ul>
        {Array.isArray(list) && list.map(item => (
          <li key={item._id} style={{ 
            marginBottom: 20, 
            border: '1px solid #eee', 
            borderRadius: 8,
            padding: 15,
            background: '#f8f9fa'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <Avatar 
                src={item.authorAvatar ? `${config.API_BASE_URL}${item.authorAvatar}` : ''} 
                name={item.authorName || item.author || '用户'} 
                size={40}
                style={{ 
                  marginRight: 12,
                  border: '2px solid #fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: 2 }}>
                  {item.authorName || item.author}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {item.authorClass && `${item.authorClass} · `}
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{item.title}</h3>
              <p style={{ margin: 0, lineHeight: 1.6, color: '#333' }}>{item.content}</p>
            </div>
            {renderMedia(item.media)}
          </li>
        ))}
      </ul>

      {/* 图片放大弹窗 */}
      {selectedImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={() => setSelectedImage(null)}
        >
          <img 
            src={selectedImage} 
            alt="" 
            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}