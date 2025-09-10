import React, { useState, useEffect, useMemo } from 'react';
import Avatar from './Avatar';
import config from './config';

export default function Art() {
  const tabs = useMemo(() => [
    { key: 'music', label: '🎵 音乐', dbValue: '音乐' },
    { key: 'painting', label: '🎨 绘画', dbValue: '绘画' },
    { key: 'dance', label: '💃 舞蹈', dbValue: '舞蹈' },
    { key: 'writing', label: '✍️ 写作', dbValue: '写作' }
  ], []);
  
  const [tab, setTab] = useState('music');
  const [list, setList] = useState([]);
  const [sort, setSort] = useState('time');
  const [showPublish, setShowPublish] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [likedIds, setLikedIds] = useState(() => {
    const saved = localStorage.getItem('liked_art_ids');
    return saved ? JSON.parse(saved) : [];
  });
  const [favoriteIds, setFavoriteIds] = useState(() => {
    const saved = localStorage.getItem('favorite_art_ids');
    return saved ? JSON.parse(saved) : [];
  });
  const [ratedIds, setRatedIds] = useState(() => {
    const saved = localStorage.getItem('rated_art_ids');
    return saved ? JSON.parse(saved) : [];
  });
  const [userId] = useState(() => {
    // 生成临时用户ID
    let id = localStorage.getItem('temp_user_id');
    if (!id) {
      id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('temp_user_id', id);
    }
    return id;
  });
  const [showComments, setShowComments] = useState({});
  const [commentForm, setCommentForm] = useState({ author: '', authorClass: '', content: '' });

  useEffect(() => {
    const currentTab = tabs.find(t => t.key === tab);
    const dbTab = currentTab ? currentTab.dbValue : tab;
    fetch(`/api/art?tab=${encodeURIComponent(dbTab)}&sort=${sort === 'hot' ? 'hot' : ''}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setList(data);
        } else {
          console.error('API返回的数据不是数组:', data);
          setList([]);
        }
      });
  }, [tab, sort, tabs]);

  const handleLike = async (id) => {
    const res = await fetch(`/api/art/${id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    const data = await res.json();
    if (res.ok) {
      setList(Array.isArray(list) ? list.map(item => item._id === id ? data : item) : []);
      let newLiked;
      if (likedIds.includes(id)) {
        newLiked = likedIds.filter(_id => _id !== id);
      } else {
        newLiked = [...likedIds, id];
      }
      setLikedIds(newLiked);
      localStorage.setItem('liked_art_ids', JSON.stringify(newLiked));
    } else {
      alert(data.error || '操作失败');
    }
  };

  const handleFavorite = async (id) => {
    const res = await fetch(`/api/art/${id}/favorite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    const data = await res.json();
    if (res.ok) {
      setList(Array.isArray(list) ? list.map(item => item._id === id ? data : item) : []);
      let newFavorites;
      if (favoriteIds.includes(id)) {
        newFavorites = favoriteIds.filter(_id => _id !== id);
      } else {
        newFavorites = [...favoriteIds, id];
      }
      setFavoriteIds(newFavorites);
      localStorage.setItem('favorite_art_ids', JSON.stringify(newFavorites));
    } else {
      alert(data.error || '操作失败');
    }
  };

  const handleRate = async (id, rating) => {
    const res = await fetch(`/api/art/${id}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, rating })
    });
    const data = await res.json();
    if (res.ok) {
      setList(Array.isArray(list) ? list.map(item => item._id === id ? data : item) : []);
      if (!ratedIds.includes(id)) {
        const newRated = [...ratedIds, id];
        setRatedIds(newRated);
        localStorage.setItem('rated_art_ids', JSON.stringify(newRated));
      }
    } else {
      alert(data.error || '评分失败');
    }
  };

  const handleComment = async (id) => {
    if (!commentForm.author || !commentForm.authorClass || !commentForm.content) {
      alert('请填写完整信息');
      return;
    }

    const res = await fetch(`/api/art/${id}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentForm)
    });
    const data = await res.json();
    if (res.ok) {
      setList(Array.isArray(list) ? list.map(item => item._id === id ? data : item) : []);
      setCommentForm({ author: '', authorClass: '', content: '' });
    } else {
      alert(data.error || '评论失败');
    }
  };

  const handleView = async (id) => {
    fetch(`/api/art/${id}/view`, { method: 'POST' });
  };

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
    return <PublishForm onBack={() => setShowPublish(false)} />;
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
        <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '28px' }}>🎨 艺术作品展示</h2>
        <button 
          onClick={() => setShowPublish(true)}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: '#3498db', 
            color: 'white', 
            border: 'none', 
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(52, 152, 219, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#2980b9';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#3498db';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          ✨ 发布作品
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: 15, marginBottom: 25, flexWrap: 'wrap' }}>
        {tabs.map(tabItem => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key)}
            style={{
              padding: '10px 20px',
              borderRadius: 25,
              border: tab === tabItem.key ? '2px solid #e74c3c' : '2px solid #ecf0f1',
              background: tab === tabItem.key ? '#e74c3c' : '#fff',
              color: tab === tabItem.key ? '#fff' : '#2c3e50',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            {tabItem.label}
          </button>
        ))}
        <button
          style={{
            marginLeft: 'auto',
            padding: '10px 20px',
            borderRadius: 25,
            border: sort === 'hot' ? '2px solid #f39c12' : '2px solid #ecf0f1',
            background: sort === 'hot' ? '#f39c12' : '#fff',
            color: sort === 'hot' ? '#fff' : '#2c3e50',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
          onClick={() => setSort(sort === 'hot' ? 'time' : 'hot')}
        >
          {sort === 'hot' ? '⏰ 按时间排序' : '🔥 按热度排序'}
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {Array.isArray(list) && list.map(item => (
          <div key={item._id} style={{ 
            border: '1px solid #ecf0f1', 
            borderRadius: 12,
            padding: 20,
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 15 }}>
              <Avatar 
                name={item.authorName || item.author || '用户'} 
                size={45}
                style={{ 
                  marginRight: 15,
                  border: '3px solid #fff',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.1)'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: 4, color: '#2c3e50' }}>
                  {item.authorName || item.author}
                </div>
                <div style={{ fontSize: '14px', color: '#7f8c8d', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>🏫 {item.authorClass}</span>
                  <span>📅 {new Date(item.createdAt).toLocaleString()}</span>
                  <span>👁️ {item.views || 0} 次浏览</span>
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 15 }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#2c3e50' }}>{item.title}</h3>
              <p style={{ margin: 0, lineHeight: 1.6, color: '#34495e', fontSize: '15px' }}>{item.content}</p>
            </div>
            {renderMedia(item.media)}
            <div style={{ 
              marginTop: 20, 
              padding: '15px 0',
              borderTop: '1px solid #ecf0f1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleLike(item._id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: likedIds.includes(item._id) ? '2px solid #e74c3c' : '2px solid #bdc3c7',
                    background: likedIds.includes(item._id) ? '#fff5f5' : '#fff',
                    color: likedIds.includes(item._id) ? '#e74c3c' : '#7f8c8d',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>
                    {likedIds.includes(item._id) ? '❤️' : '🤍'}
                  </span>
                  <span>{item.likes || 0}</span>
                </button>

                <button
                  onClick={() => handleFavorite(item._id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: favoriteIds.includes(item._id) ? '2px solid #f39c12' : '2px solid #bdc3c7',
                    background: favoriteIds.includes(item._id) ? '#fff8e1' : '#fff',
                    color: favoriteIds.includes(item._id) ? '#f39c12' : '#7f8c8d',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>
                    {favoriteIds.includes(item._id) ? '⭐' : '☆'}
                  </span>
                  <span>收藏</span>
                </button>

                <button
                  onClick={() => setShowComments(prev => ({ ...prev, [item._id]: !prev[item._id] }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '2px solid #3498db',
                    background: '#fff',
                    color: '#3498db',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>💬</span>
                  <span>评论 ({item.comments?.length || 0})</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '13px', color: '#7f8c8d' }}>评分:</span>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => handleRate(item._id, star)}
                      disabled={ratedIds.includes(item._id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: ratedIds.includes(item._id) ? 'not-allowed' : 'pointer',
                        fontSize: '18px',
                        color: star <= (item.rating?.average || 0) ? '#f39c12' : '#ddd',
                        opacity: ratedIds.includes(item._id) ? 0.5 : 1
                      }}
                    >
                      ⭐
                    </button>
                  ))}
                  <span style={{ fontSize: '12px', color: '#7f8c8d' }}>
                    ({item.rating?.average?.toFixed(1) || 0})
                  </span>
                </div>
              </div>
            </div>

            {/* 评论区域 */}
            {showComments[item._id] && (
              <div style={{ 
                marginTop: 15, 
                padding: '15px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: 8,
                border: '1px solid #e9ecef'
              }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>💬 评论</h4>
                
                {/* 评论表单 */}
                <div style={{ marginBottom: 15, padding: '10px', backgroundColor: '#fff', borderRadius: 6 }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      placeholder="您的姓名"
                      value={commentForm.author}
                      onChange={(e) => setCommentForm(prev => ({ ...prev, author: e.target.value }))}
                      style={{ flex: 1, padding: '8px', borderRadius: 4, border: '1px solid #ddd' }}
                    />
                    <input
                      type="text"
                      placeholder="班级"
                      value={commentForm.authorClass}
                      onChange={(e) => setCommentForm(prev => ({ ...prev, authorClass: e.target.value }))}
                      style={{ flex: 1, padding: '8px', borderRadius: 4, border: '1px solid #ddd' }}
                    />
                  </div>
                  <textarea
                    placeholder="写下您的评论..."
                    value={commentForm.content}
                    onChange={(e) => setCommentForm(prev => ({ ...prev, content: e.target.value }))}
                    style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #ddd', resize: 'vertical' }}
                    rows={2}
                  />
                  <button
                    onClick={() => handleComment(item._id)}
                    style={{
                      marginTop: '8px',
                      padding: '6px 12px',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    发表评论
                  </button>
                </div>

                {/* 评论列表 */}
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {item.comments?.length > 0 ? (
                    item.comments.map(comment => (
                      <div key={comment.id} style={{ 
                        marginBottom: '10px', 
                        padding: '8px', 
                        backgroundColor: '#fff', 
                        borderRadius: 6,
                        border: '1px solid #e9ecef'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                          <strong style={{ fontSize: '13px', color: '#2c3e50' }}>{comment.author}</strong>
                          <span style={{ fontSize: '11px', color: '#7f8c8d' }}>
                            {comment.authorClass} · {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#34495e', lineHeight: '1.4' }}>
                          {comment.content}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '13px', padding: '20px' }}>
                      暂无评论，快来抢沙发吧！
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 图片放大弹窗 */}
      {selectedImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
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

// 发布表单组件
function PublishForm({ onBack }) {
  const [formData, setFormData] = useState({
    tab: '音乐',
    title: '',
    content: '',
    authorName: '',
    authorClass: '',
    media: []
  });
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content || !formData.authorName || !formData.authorClass) {
      alert('请填写完整信息！');
      return;
    }

    try {
      const res = await fetch('/api/art', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        alert('发布成功！');
        onBack();
      } else {
        const error = await res.json();
        alert(error.error || '发布失败');
      }
    } catch (error) {
      alert('发布失败，请重试');
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('files', file));

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setFormData(prev => ({ ...prev, media: [...prev.media, ...data.urls] }));
      } else {
        alert('文件上传失败');
      }
    } catch (error) {
      alert('文件上传失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginBottom: 25, color: '#2c3e50' }}>✨ 发布艺术作品</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
            作品分类 *
          </label>
          <select
            value={formData.tab}
            onChange={(e) => setFormData(prev => ({ ...prev, tab: e.target.value }))}
            style={{ width: '100%', padding: '10px', borderRadius: 8, border: '2px solid #ecf0f1' }}
          >
            <option value="音乐">🎵 音乐</option>
            <option value="绘画">🎨 绘画</option>
            <option value="舞蹈">💃 舞蹈</option>
            <option value="写作">✍️ 写作</option>
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
            作品标题 *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="请输入作品标题"
            style={{ width: '100%', padding: '10px', borderRadius: 8, border: '2px solid #ecf0f1' }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
            作品描述 *
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="请描述您的作品..."
            rows={4}
            style={{ width: '100%', padding: '10px', borderRadius: 8, border: '2px solid #ecf0f1', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 15, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
              姓名 *
            </label>
            <input
              type="text"
              value={formData.authorName}
              onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
              placeholder="请输入您的姓名"
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '2px solid #ecf0f1' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
              班级 *
            </label>
            <input
              type="text"
              value={formData.authorClass}
              onChange={(e) => setFormData(prev => ({ ...prev, authorClass: e.target.value }))}
              placeholder="请输入您的班级"
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '2px solid #ecf0f1' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
            上传文件
          </label>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ width: '100%', padding: '10px', borderRadius: 8, border: '2px solid #ecf0f1' }}
          />
          {uploading && <div style={{ color: '#3498db', marginTop: 5 }}>上传中...</div>}
        </div>

        {formData.media.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
              已上传文件
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {formData.media.map((url, idx) => (
                <div key={idx} style={{ 
                  padding: '5px 10px', 
                  background: '#ecf0f1', 
                  borderRadius: 5, 
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <span>📎</span>
                  <span>{url.split('/').pop()}</span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      media: prev.media.filter((_, i) => i !== idx) 
                    }))}
                    style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 15, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              padding: '12px 24px',
              background: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            取消
          </button>
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            ✨ 发布作品
          </button>
        </div>
      </form>
    </div>
  );
}