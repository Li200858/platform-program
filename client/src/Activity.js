import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';
import FilePreview from './FilePreview';
import api from './api';

export default function Activity({ userInfo, onBack, maintenanceStatus }) {
  const [activities, setActivities] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [message, setMessage] = useState('');
  const [likedIds, setLikedIds] = useState(() => {
    const saved = localStorage.getItem('liked_activity_ids');
    return saved ? JSON.parse(saved) : [];
  });
  const [favoriteIds, setFavoriteIds] = useState(() => {
    const saved = localStorage.getItem('favorite_activity_ids');
    return saved ? JSON.parse(saved) : [];
  });
  const [followStatus, setFollowStatus] = useState({});

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

  const handleDelete = async (id) => {
    if (!userInfo || !userInfo.name) {
      setMessage('请先完善个人信息');
      return;
    }

    if (!window.confirm('确定要删除这个活动吗？此操作不可恢复。')) {
      return;
    }

    try {
      await api.activity.delete(id, userInfo.name, userInfo.isAdmin || false);
      setActivities(prev => prev.filter(item => item._id !== id));
      setMessage('活动已删除');
    } catch (error) {
      console.error('删除失败:', error);
      setMessage('删除失败，请重试');
    }
  };

  // 关注/取消关注用户
  const handleFollow = async (username) => {
    if (!userInfo || !userInfo.name) {
      setMessage('请先完善个人信息');
      return;
    }

    if (username === userInfo.name) {
      setMessage('不能关注自己');
      return;
    }

    try {
      const isFollowing = followStatus[username];
      if (isFollowing) {
        await api.follow.unfollow(userInfo.name, username);
        setMessage(`已取消关注 ${username}`);
      } else {
        await api.follow.follow({
          follower: userInfo.name,
          following: username
        });
        setMessage(`已关注 ${username}`);
      }
      
      // 更新关注状态
      setFollowStatus(prev => ({
        ...prev,
        [username]: !isFollowing
      }));
    } catch (error) {
      console.error('关注操作失败:', error);
      setMessage('操作失败：' + (error.message || '请重试'));
    }
  };

  // 检查关注状态
  const checkFollowStatus = async (username) => {
    if (!userInfo || !userInfo.name || username === userInfo.name) return;
    
    try {
      const status = await api.follow.getStatus(userInfo.name, username);
      setFollowStatus(prev => ({
        ...prev,
        [username]: status.isFollowing
      }));
    } catch (error) {
      console.error('检查关注状态失败:', error);
    }
  };

  // 私信用户
  const handleMessageUser = (username) => {
    if (window.setSection) {
      window.setSection('messages');
      // 设置私信目标用户
      if (window.setMessageTarget) {
        window.setMessageTarget(username);
      }
    }
  };

  if (showCreate) {
    return <CreateActivityForm onBack={() => setShowCreate(false)} userInfo={userInfo} onSuccess={loadActivities} maintenanceStatus={maintenanceStatus} />;
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
          onClick={() => {
            if (maintenanceStatus.isEnabled && !userInfo?.isAdmin) {
              alert(maintenanceStatus.message || '网站正在维护中，暂时无法创建活动');
              return;
            }
            setShowCreate(true);
          }}
          disabled={maintenanceStatus.isEnabled && !userInfo?.isAdmin}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: (maintenanceStatus.isEnabled && !userInfo?.isAdmin) ? '#95a5a6' : '#27ae60', 
            color: 'white', 
            border: 'none', 
            borderRadius: 8,
            cursor: (maintenanceStatus.isEnabled && !userInfo?.isAdmin) ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            opacity: (maintenanceStatus.isEnabled && !userInfo?.isAdmin) ? 0.6 : 1
          }}
        >
          {maintenanceStatus.isEnabled && !userInfo?.isAdmin ? '+ 维护中' : '+ 创建活动'}
        </button>
      </div>

      {/* 消息显示 */}
      {message && (
        <div style={{ 
          marginBottom: 20, 
          padding: '15px', 
          background: message.includes('成功') || message.includes('已') ? '#d4edda' : '#f8d7da',
          color: message.includes('成功') || message.includes('已') ? '#155724' : '#721c24',
          borderRadius: 8,
          border: `1px solid ${message.includes('成功') || message.includes('已') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {activities.map(activity => (
          <div key={activity._id} data-activity-id={activity._id} style={{ 
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
                <div style={{ fontSize: '14px', color: '#7f8c8d', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>{activity.authorClass} • {new Date(activity.createdAt).toLocaleString()}</span>
                  {/* 关注和私信按钮 */}
                  {userInfo && userInfo.name && activity.authorName !== userInfo.name && (
                    <div style={{ display: 'flex', gap: '8px', marginLeft: '10px' }}>
                      <button
                        onClick={() => {
                          checkFollowStatus(activity.authorName);
                          handleFollow(activity.authorName);
                        }}
                        style={{
                          padding: '4px 8px',
                          background: followStatus[activity.authorName] ? '#e74c3c' : '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        {followStatus[activity.authorName] ? '取消关注' : '关注'}
                      </button>
                      <button
                        onClick={() => handleMessageUser(activity.authorName)}
                        style={{
                          padding: '4px 8px',
                          background: '#27ae60',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        私信
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {/* 删除按钮 - 只有作者本人或管理员可以删除 */}
              {(userInfo && (activity.authorName === userInfo.name || userInfo.isAdmin)) && (
                <button
                  onClick={() => handleDelete(activity._id)}
                  style={{
                    padding: '6px 12px',
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  删除
                </button>
              )}
            </div>

            <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#2c3e50' }}>
              {activity.title}
            </h3>
            
            <p style={{ margin: '0 0 15px 0', lineHeight: 1.6, color: '#34495e' }}>
              {activity.description}
            </p>

            {activity.media && activity.media.length > 0 && (
              <div style={{ marginBottom: 15 }}>
                <FilePreview 
                  urls={activity.media} 
                  apiBaseUrl={process.env.NODE_ENV === 'production' ? 'https://platform-program.onrender.com' : 'http://localhost:5000'} 
                />
              </div>
            )}

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
                <span>点赞</span>
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
                <span>收藏</span>
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
function CreateActivityForm({ onBack, userInfo, onSuccess, maintenanceStatus }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    image: '',
    media: []
  });
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    setUploading(true);
    
    const uploadFormData = new FormData();
    Array.from(files).forEach(file => uploadFormData.append('files', file));

    try {
      const data = await api.upload(uploadFormData);
      if (data && data.urls && data.urls.length > 0) {
        setFormData(prev => ({ ...prev, media: [...prev.media, ...data.urls] }));
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      alert('文件上传失败：' + (error.message || '请检查文件大小和格式'));
    } finally {
      setUploading(false);
    }
  };

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

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
            上传文件（可选）
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
              已上传文件预览
            </label>
            <div style={{ 
              border: '1px solid #ecf0f1', 
              borderRadius: 8, 
              padding: 15, 
              background: '#f8f9fa',
              position: 'relative'
            }}>
              <FilePreview 
                urls={formData.media} 
                apiBaseUrl={process.env.NODE_ENV === 'production' ? 'https://platform-program.onrender.com' : 'http://localhost:5000'} 
              />
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
            创建活动
          </button>
        </div>
      </form>
    </div>
  );
}