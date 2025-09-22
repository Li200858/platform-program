import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';
import FilePreview from './FilePreview';
import api from './api';

export default function MyWorks({ userInfo, onBack }) {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (userInfo && userInfo.name) {
      loadWorks();
    } else {
      setLoading(false);
    }
  }, [userInfo]);

  const loadWorks = async () => {
    if (!userInfo || !userInfo.name) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.art.getMyWorks(userInfo.name);
      setWorks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载作品失败:', error);
      setWorks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!userInfo || !userInfo.name) {
      setMessage('请先完善个人信息');
      return;
    }

    if (!window.confirm('确定要删除这个作品吗？此操作不可恢复。')) {
      return;
    }

    try {
      await api.art.delete(id, userInfo.name, userInfo.isAdmin || false);
      setWorks(prev => prev.filter(item => item._id !== id));
      setMessage('作品已删除');
    } catch (error) {
      console.error('删除作品失败:', error);
      setMessage('删除失败，请重试');
    }
  };

  const renderMedia = (urls) => (
    <FilePreview 
      urls={urls} 
      apiBaseUrl={process.env.REACT_APP_API_URL || 'http://localhost:5000'} 
    />
  );

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              marginRight: '15px',
              color: '#7f8c8d'
            }}
          >
            ←
          </button>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>我的作品</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
          加载中...
        </div>
      </div>
    );
  }

  if (!userInfo || !userInfo.name) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              marginRight: '15px',
              color: '#7f8c8d'
            }}
          >
            ←
          </button>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>我的作品</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
          请先完善个人信息
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            marginRight: '15px',
            color: '#7f8c8d'
          }}
        >
          ←
        </button>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>我的作品</h2>
      </div>

      {/* 消息显示 */}
      {message && (
        <div style={{ 
          padding: '15px', 
          background: message.includes('成功') || message.includes('已删除') ? '#d4edda' : '#f8d7da',
          color: message.includes('成功') || message.includes('已删除') ? '#155724' : '#721c24',
          borderRadius: 8,
          border: `1px solid ${message.includes('成功') || message.includes('已删除') ? '#c3e6cb' : '#f5c6cb'}`,
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {works.map(item => (
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
                  <span>班级: {item.authorClass}</span>
                  <span>日期: {new Date(item.createdAt).toLocaleString()}</span>
                  <span>浏览 {item.views || 0} 次</span>
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 15 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', color: '#2c3e50', flex: 1 }}>{item.title}</h3>
                <button
                  onClick={() => handleDelete(item._id)}
                  style={{
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    marginLeft: '10px',
                    boxShadow: '0 2px 8px rgba(255, 107, 107, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 2px 8px rgba(255, 107, 107, 0.3)';
                  }}
                >
                  删除作品
                </button>
              </div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontSize: '14px', color: '#7f8c8d' }}>
                  👍 {item.likes || 0} 喜欢
                </span>
                <span style={{ fontSize: '14px', color: '#7f8c8d' }}>
                  ⭐ {item.favorites?.length || 0} 收藏
                </span>
                <span style={{ fontSize: '14px', color: '#7f8c8d' }}>
                  💬 {item.comments?.length || 0} 评论
                </span>
              </div>
            </div>
          </div>
        ))}

        {works.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎨</div>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>暂无作品</div>
            <div style={{ fontSize: '14px' }}>去艺术作品页面发布您的第一个作品吧！</div>
          </div>
        )}
      </div>
    </div>
  );
}