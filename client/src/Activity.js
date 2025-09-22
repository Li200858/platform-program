import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';
import api from './api';

export default function Activity({ userInfo, onBack }) {
  const [activities, setActivities] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [likedIds, setLikedIds] = useState(() => {
    const saved = localStorage.getItem('liked_activity_ids');
    return saved ? JSON.parse(saved) : [];
  });
  const [favoriteIds, setFavoriteIds] = useState(() => {
    const saved = localStorage.getItem('favorite_activity_ids');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const data = await api.activity.getAll();
      setActivities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载活动失败:', error);
      setActivities([]);
    }
  };

  const handleLike = async (id) => {
    if (!userInfo || !userInfo.name) {
      alert('请先完善个人信息');
      return;
    }
    
    try {
      const data = await api.activity.like(id, userInfo.name);
      setActivities(prev => prev.map(item => item._id === id ? data : item));
      
      const isLiked = data.likedUsers && data.likedUsers.includes(userInfo.name);
      let newLiked;
      if (isLiked) {
        newLiked = likedIds.includes(id) ? likedIds : [...likedIds, id];
      } else {
        newLiked = likedIds.filter(_id => _id !== id);
      }
      setLikedIds(newLiked);
      localStorage.setItem('liked_activity_ids', JSON.stringify(newLiked));
    } catch (error) {
      console.error('点赞失败:', error);
      alert('操作失败，请重试');
    }
  };

  const handleFavorite = async (id) => {
    if (!userInfo || !userInfo.name) {
      alert('请先完善个人信息');
      return;
    }
    
    try {
      const data = await api.activity.favorite(id, userInfo.name);
      setActivities(prev => prev.map(item => item._id === id ? data : item));
      
      const isFavorited = data.favorites && data.favorites.includes(userInfo.name);
      let newFavorites;
      if (isFavorited) {
        newFavorites = favoriteIds.includes(id) ? favoriteIds : [...favoriteIds, id];
      } else {
        newFavorites = favoriteIds.filter(_id => _id !== id);
      }
      setFavoriteIds(newFavorites);
      localStorage.setItem('favorite_activity_ids', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('收藏失败:', error);
      alert('操作失败，请重试');
    }
  };

  if (showCreate) {
    return <CreateActivityForm onBack={() => setShowCreate(false)} userInfo={userInfo} onSuccess={loadActivities} />;
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
        <h2 style={{ margin: 0, color: '#2c3e50', flex: 1 }}>活动展示</h2>
        <button 
          onClick={() => setShowCreate(true)}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#27ae60', 
            color: 'white', 
            border: 'none', 
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          + 创建活动
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {activities.map(activity => (
          <div key={activity._id} style={{ 
            border: '1px solid #ecf0f1', 
            borderRadius: 12,
            padding: 20,
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 15 }}>
              <Avatar 
                name={activity.authorName || activity.author || '用户'} 
                size={45}
                style={{ marginRight: 15 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: 4, color: '#2c3e50' }}>
                  {activity.authorName || activity.author}
                </div>
                <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                  {activity.authorClass} • {new Date(activity.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#2c3e50' }}>
              {activity.title}
            </h3>
            
            <p style={{ margin: '0 0 15px 0', lineHeight: 1.6, color: '#34495e' }}>
              {activity.description}
            </p>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '15px',
              padding: '10px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '14px', color: '#2c3e50' }}>
                <strong>活动时间：</strong>
                {new Date(activity.startDate).toLocaleDateString()} - {new Date(activity.endDate).toLocaleDateString()}
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '15px',
              padding: '10px 0',
              borderTop: '1px solid #ecf0f1'
            }}>
              <button
                onClick={() => handleLike(activity._id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: likedIds.includes(activity._id) ? '2px solid #e74c3c' : '2px solid #bdc3c7',
                  background: likedIds.includes(activity._id) ? '#fff5f5' : '#fff',
                  color: likedIds.includes(activity._id) ? '#e74c3c' : '#7f8c8d',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                <span>👍</span>
                <span>{activity.likes || 0}</span>
              </button>

              <button
                onClick={() => handleFavorite(activity._id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: favoriteIds.includes(activity._id) ? '2px solid #f39c12' : '2px solid #bdc3c7',
                  background: favoriteIds.includes(activity._id) ? '#fff8e1' : '#fff',
                  color: favoriteIds.includes(activity._id) ? '#f39c12' : '#7f8c8d',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                <span>⭐</span>
                <span>{activity.favorites?.length || 0}</span>
              </button>
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
            暂无活动，快来创建第一个活动吧！
          </div>
        )}
      </div>
    </div>
  );
}

// 创建活动表单
function CreateActivityForm({ onBack, userInfo, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    image: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.startDate || !formData.endDate) {
      alert('请填写所有必要信息！');
      return;
    }

    if (!userInfo || !userInfo.name || !userInfo.class) {
      alert('请先在个人信息页面填写姓名和班级信息！');
      return;
    }

    try {
      await api.activity.create({
        ...formData,
        authorName: userInfo.name,
        authorClass: userInfo.class
      });
      
      alert('活动创建成功！');
      onSuccess();
      onBack();
    } catch (error) {
      alert('创建失败：' + (error.message || '请重试'));
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
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
        <h2 style={{ margin: 0, color: '#2c3e50' }}>创建活动</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
            活动标题 *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="请输入活动标题"
            style={{ width: '100%', padding: '12px', borderRadius: 8, border: '2px solid #ecf0f1' }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
            活动描述 *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="请描述活动内容..."
            rows={4}
            style={{ width: '100%', padding: '12px', borderRadius: 8, border: '2px solid #ecf0f1', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 15, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
              开始时间 *
            </label>
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              style={{ width: '100%', padding: '12px', borderRadius: 8, border: '2px solid #ecf0f1' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
              结束时间 *
            </label>
            <input
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              style={{ width: '100%', padding: '12px', borderRadius: 8, border: '2px solid #ecf0f1' }}
            />
          </div>
        </div>

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
            创建活动
          </button>
        </div>
      </form>
    </div>
  );
}