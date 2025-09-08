import React, { useState, useEffect, useMemo } from 'react';
import ContentPublish from './ContentPublish';
import Avatar from './Avatar';

export default function Art({ user }) {
  const tabs = useMemo(() => [
    { key: 'music', label: '音乐', dbValue: '音乐' },
    { key: 'painting', label: '绘画', dbValue: '绘画' },
    { key: 'dance', label: '舞蹈', dbValue: '舞蹈' },
    { key: 'writing', label: '写作', dbValue: '写作' }
  ], []);
  
  const [tab, setTab] = useState('music');
  const [list, setList] = useState([]);
  const [sort, setSort] = useState('time');
  const [showPublish, setShowPublish] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [likedIds, setLikedIds] = useState(() => {
    // 本地存储防止刷新丢失（可选）
    const saved = localStorage.getItem('liked_art_ids');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const currentTab = tabs.find(t => t.key === tab);
    const dbTab = currentTab ? currentTab.dbValue : tab;
    fetch(`/api/art?tab=${encodeURIComponent(dbTab)}&sort=${sort === 'hot' ? 'hot' : ''}`)
      .then(res => res.json())
      .then(data => setList(data));
  }, [tab, sort, tabs]);

  const handleLike = async (id) => {
    const res = await fetch(`/api/art/${id}/like`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });
    const data = await res.json();
    if (res.ok) {
      setList(list.map(item => item._id === id ? data : item));
      let newLiked;
      if (likedIds.includes(id)) {
        // 取消点赞
        newLiked = likedIds.filter(_id => _id !== id);
      } else {
        // 点赞
        newLiked = [...likedIds, id];
      }
      setLikedIds(newLiked);
      localStorage.setItem('liked_art_ids', JSON.stringify(newLiked));
    } else {
      alert(data.error || '操作失败');
    }
  };

  const renderMedia = (urls) => (
    <div style={{ marginTop: 8 }}>
      {urls && urls.map((url, idx) => {
        const ext = url.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
          return (
            <img 
              key={idx} 
              src={`http://localhost:5000${url}`} 
              alt="" 
              style={{ maxWidth: 120, marginRight: 8, cursor: 'pointer' }} 
              onClick={() => setSelectedImage(`http://localhost:5000${url}`)}
            />
          );
        }
        if (['mp4', 'webm', 'ogg'].includes(ext)) {
          return <video key={idx} src={`http://localhost:5000${url}`} controls style={{ maxWidth: 180, marginRight: 8 }} />;
        }
        return (
          <a 
            key={idx} 
            href={`http://localhost:5000${url}`} 
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
        type="art" 
        onBack={() => setShowPublish(false)}
      />
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', background: '#fff', borderRadius: 10, padding: 30, boxShadow: '0 2px 8px #eee' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>艺术板块</h2>
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
      
      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        {tabs.map(tabItem => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key)}
            style={{
              padding: '8px 20px',
              borderRadius: 5,
              border: tab === tabItem.key ? '2px solid #222' : '1px solid #ccc',
              background: tab === tabItem.key ? '#222' : '#fff',
              color: tab === tabItem.key ? '#fff' : '#222',
              cursor: 'pointer'
            }}
          >
            {tabItem.label}
          </button>
        ))}
        <button
          style={{
            marginLeft: 'auto',
            padding: '8px 20px',
            borderRadius: 5,
            border: sort === 'hot' ? '2px solid #e67e22' : '1px solid #ccc',
            background: sort === 'hot' ? '#e67e22' : '#fff',
            color: sort === 'hot' ? '#fff' : '#222',
            cursor: 'pointer'
          }}
          onClick={() => setSort(sort === 'hot' ? 'time' : 'hot')}
        >
{sort === 'hot' ? '按时间排序' : '按热度排序'}
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
                src={item.authorAvatar ? `http://localhost:5000${item.authorAvatar}` : ''} 
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
            <div style={{ 
              marginTop: 15, 
              padding: '12px 0',
              borderTop: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => handleLike(item._id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: likedIds.includes(item._id) ? '2px solid #e67e22' : '2px solid #ddd',
                    background: likedIds.includes(item._id) ? '#fff3e0' : '#fff',
                    color: likedIds.includes(item._id) ? '#e67e22' : '#666',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => {
                    if (!likedIds.includes(item._id)) {
                      e.target.style.background = '#fff3e0';
                      e.target.style.color = '#e67e22';
                      e.target.style.borderColor = '#e67e22';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!likedIds.includes(item._id)) {
                      e.target.style.background = '#fff';
                      e.target.style.color = '#666';
                      e.target.style.borderColor = '#ddd';
                    }
                  }}
                >
                  <span style={{ fontSize: '16px' }}>
                    {likedIds.includes(item._id) ? '❤️' : '🤍'}
                  </span>
                  <span>{item.likes || 0}</span>
                  <span>{likedIds.includes(item._id) ? '已点赞' : '点赞'}</span>
                </button>
              </div>
              
              <div style={{ 
                fontSize: '12px', 
                color: '#999',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>📅 {new Date(item.createdAt).toLocaleDateString()}</span>
                {item.authorClass && <span>🏫 {item.authorClass}</span>}
              </div>
            </div>
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