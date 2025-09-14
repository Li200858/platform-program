import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';
import FileUploader from './FileUploader';

export default function Activity({ userInfo, onBack }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [likedIds, setLikedIds] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState({});

  useEffect(() => {
    loadActivities();
    loadUserData();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/activities');
      const data = await res.json();
      setActivities(data || []);
    } catch (error) {
      console.error('加载活动失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = () => {
    const liked = JSON.parse(localStorage.getItem('liked_activity_ids') || '[]');
    const favorites = JSON.parse(localStorage.getItem('favorite_activity_ids') || '[]');
    setLikedIds(liked);
    setFavoriteIds(favorites);
  };

  const handleLike = async (id) => {
    if (!userInfo || !userInfo.name) {
      alert('请先完善个人信息');
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:5000/api/activities/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userInfo.name })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setActivities(prev => prev.map(item => item._id === id ? data : item));
      // 根据服务器返回的数据更新本地状态
      const isLiked = data.likedUsers && data.likedUsers.includes(userInfo.name);
      let newLiked;
      if (isLiked) {
        // 如果已点赞，添加到本地列表
        newLiked = likedIds.includes(id) ? likedIds : [...likedIds, id];
      } else {
        // 如果未点赞，从本地列表移除
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
      const res = await fetch(`http://localhost:5000/api/activities/${id}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userInfo.name })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setActivities(prev => prev.map(item => item._id === id ? data : item));
      // 根据服务器返回的数据更新本地状态
      const isFavorited = data.favorites && data.favorites.includes(userInfo.name);
      let newFavorites;
      if (isFavorited) {
        // 如果已收藏，添加到本地列表
        newFavorites = favoriteIds.includes(id) ? favoriteIds : [...favoriteIds, id];
      } else {
        // 如果未收藏，从本地列表移除
        newFavorites = favoriteIds.filter(_id => _id !== id);
      }
      setFavoriteIds(newFavorites);
      localStorage.setItem('favorite_activity_ids', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('收藏失败:', error);
      alert('操作失败，请重试');
    }
  };

  const handleComment = async (id) => {
    if (!userInfo || !userInfo.name || !commentText.trim()) {
      alert('请先完善个人信息并填写评论内容');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/activities/${id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentText.trim(),
          author: userInfo.name,
          authorClass: userInfo.class,
          authorAvatar: userInfo.avatar || ''
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActivities(prev => prev.map(item => item._id === id ? data : item));
        setCommentText('');
        alert('评论提交成功！');
      } else {
        const error = await res.json();
        alert(error.error || '评论失败');
      }
    } catch (error) {
      console.error('评论失败:', error);
      alert('评论失败');
    }
  };

  const handleDeleteActivity = async (id) => {
    if (!userInfo || !userInfo.name) {
      alert('用户信息不完整，无法操作');
      return;
    }

    if (!confirm('确定要删除这个活动吗？')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/activities/${id}?authorName=${encodeURIComponent(userInfo.name)}&isAdmin=${userInfo.isAdmin || false}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setActivities(prev => prev.filter(item => item._id !== id));
        alert('活动删除成功！');
      } else {
        const error = await res.json();
        alert(error.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  const CreateActivityForm = () => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      image: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!formData.title || !formData.description || !formData.startDate || !formData.endDate || !formData.image) {
        alert('请填写所有必要信息');
        return;
      }

      if (!userInfo || !userInfo.name || !userInfo.class) {
        alert('请先在个人信息页面填写姓名和班级信息！');
        return;
      }

      try {
        setSubmitting(true);
        const res = await fetch('http://localhost:5000/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            authorName: userInfo.name,
            authorClass: userInfo.class,
            authorAvatar: userInfo.avatar || ''
          })
        });

        if (res.ok) {
          const newActivity = await res.json();
          setActivities(prev => [newActivity, ...prev]);
          setFormData({ title: '', description: '', startDate: '', endDate: '', image: '' });
          setShowCreateForm(false);
          alert('活动创建成功！');
        } else {
          const error = await res.json();
          alert(error.error || '创建失败');
        }
      } catch (error) {
        console.error('创建失败:', error);
        alert('创建失败');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: 15,
          padding: 30,
          maxWidth: 600,
          width: '90%',
          maxHeight: '90%',
          overflowY: 'auto'
        }}>
          <h3 style={{ marginBottom: 20, color: '#2c3e50', textAlign: 'center' }}>
            创建活动
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
                活动名称 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="请输入活动名称"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 8,
                  border: '2px solid #ecf0f1',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
                活动详细介绍 *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入活动详细介绍"
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 8,
                  border: '2px solid #ecf0f1',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
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
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 8,
                    border: '2px solid #ecf0f1',
                    fontSize: '14px'
                  }}
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
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 8,
                    border: '2px solid #ecf0f1',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
                活动配图 *
              </label>
              <FileUploader
                onUpload={(url) => setFormData(prev => ({ ...prev, image: url }))}
                accept="image/*"
              />
              {formData.image && (
                <div style={{ marginTop: 10 }}>
                  <img 
                    src={formData.image} 
                    alt="活动配图" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: 200, 
                      borderRadius: 8,
                      border: '2px solid #ecf0f1'
                    }} 
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 15, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '12px 24px',
                  backgroundColor: submitting ? '#bdc3c7' : '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {submitting ? '创建中...' : '创建活动'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderActivity = (activity) => (
    <div key={activity._id} style={{
      background: '#fff',
      borderRadius: 15,
      padding: 20,
      marginBottom: 20,
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      border: '1px solid #e9ecef'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar 
            src={activity.authorAvatar} 
            name={activity.authorName} 
            size={40}
          />
          <div>
            <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{activity.authorName}</div>
            <div style={{ fontSize: '14px', color: '#7f8c8d' }}>{activity.authorClass}</div>
          </div>
        </div>
        {(userInfo && (userInfo.name === activity.author || userInfo.name === activity.authorName || userInfo.isAdmin)) && (
          <button
            onClick={() => handleDeleteActivity(activity._id)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '12px',
              color: '#721c24'
            }}
          >
            删除
          </button>
        )}
      </div>

      <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '18px' }}>
        {activity.title}
      </h3>

      <div style={{ marginBottom: 15 }}>
        <img 
          src={activity.image} 
          alt={activity.title}
          style={{ 
            width: '100%', 
            height: 200, 
            objectFit: 'cover', 
            borderRadius: 8,
            border: '1px solid #e9ecef'
          }} 
        />
      </div>

      <p style={{
        color: '#6c757d',
        lineHeight: '1.6',
        marginBottom: 15,
        whiteSpace: 'pre-wrap'
      }}>
        {activity.description}
      </p>

      <div style={{
        marginBottom: 15,
        padding: '10px 15px',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        border: '1px solid #e9ecef'
      }}>
        <div style={{ fontSize: '14px', color: '#495057', marginBottom: 5 }}>
          <strong>活动时间：</strong>
          {new Date(activity.startDate).toLocaleString()} - {new Date(activity.endDate).toLocaleString()}
        </div>
        <div style={{ fontSize: '14px', color: '#495057' }}>
          <strong>状态：</strong>
          {new Date() < new Date(activity.startDate) ? '未开始' : 
           new Date() > new Date(activity.endDate) ? '已结束' : '进行中'}
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        paddingTop: 15,
        borderTop: '1px solid #e9ecef',
        fontSize: '14px',
        color: '#6c757d'
      }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <button
            onClick={() => handleLike(activity._id)}
            style={{
              background: 'none',
              border: 'none',
              color: likedIds.includes(activity._id) ? '#e74c3c' : '#6c757d',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            {likedIds.includes(activity._id) ? '已喜欢' : '喜欢'} {activity.likes || 0}
          </button>
          <button
            onClick={() => handleFavorite(activity._id)}
            style={{
              background: 'none',
              border: 'none',
              color: favoriteIds.includes(activity._id) ? '#f39c12' : '#6c757d',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            {favoriteIds.includes(activity._id) ? '已收藏' : '收藏'} {activity.favorites?.length || 0}
          </button>
          <button
            onClick={() => setShowComments(prev => ({ ...prev, [activity._id]: !prev[activity._id] }))}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              cursor: 'pointer',
              fontSize: '14px',
              textDecoration: 'underline'
            }}
          >
            评论 {activity.comments?.length || 0}
          </button>
        </div>
        <span>{new Date(activity.createdAt).toLocaleString()}</span>
      </div>

      {/* 评论区域 */}
      {showComments[activity._id] && (
        <div style={{ 
          marginTop: 15, 
          padding: 15, 
          backgroundColor: '#f8f9fa', 
          borderRadius: 8,
          border: '1px solid #e9ecef'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#495057', fontSize: '16px' }}>
            评论 ({activity.comments?.length || 0})
          </h4>
          
          {/* 评论输入框 */}
          {userInfo && userInfo.name && (
            <div style={{ marginBottom: 15 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Avatar 
                  src={userInfo.avatar} 
                  name={userInfo.name} 
                  size={24}
                />
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#495057' }}>
                    {userInfo.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    {userInfo.class}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="写下你的评论..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #dee2e6',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={() => handleComment(activity._id)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  评论
                </button>
              </div>
            </div>
          )}

          {/* 评论列表 */}
          {activity.comments && activity.comments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activity.comments.map((comment, index) => (
                <div key={comment.id || index} style={{
                  padding: 10,
                  backgroundColor: '#fff',
                  borderRadius: 6,
                  border: '1px solid #dee2e6'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Avatar 
                      src={comment.authorAvatar} 
                      name={comment.author} 
                      size={24}
                    />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#495057' }}>
                        {comment.author}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        {comment.authorClass}
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d', marginLeft: 'auto' }}>
                      {new Date(comment.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ color: '#495057', fontSize: '14px', lineHeight: '1.5' }}>
                    {comment.content}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              color: '#6c757d', 
              fontStyle: 'italic',
              padding: '20px 0'
            }}>
              暂无评论
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (!userInfo || !userInfo.name) {
    return (
      <div style={{ 
        maxWidth: 800, 
        margin: '40px auto', 
        background: '#fff', 
        borderRadius: 15, 
        padding: 30, 
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: 30,
          paddingBottom: 20,
          borderBottom: '2px solid #ecf0f1'
        }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              marginRight: 15,
              color: '#7f8c8d'
            }}
          >
            ←
          </button>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>
            活动展示
          </h2>
        </div>
        <div style={{ color: '#7f8c8d', fontSize: '16px' }}>
          请先在个人信息页面填写姓名信息
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: 800, 
      margin: '40px auto', 
      background: '#fff', 
      borderRadius: 15, 
      padding: 30, 
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 30,
        paddingBottom: 20,
        borderBottom: '2px solid #ecf0f1'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              marginRight: 15,
              color: '#7f8c8d'
            }}
          >
            ←
          </button>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>
            活动展示
          </h2>
        </div>
        {userInfo.isAdmin && (
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = 'none';
            }}
          >
            创建活动
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#7f8c8d' }}>
          加载中...
        </div>
      ) : activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#7f8c8d' }}>
          暂无活动
        </div>
      ) : (
        <div>
          {activities.map(renderActivity)}
        </div>
      )}

      {showCreateForm && <CreateActivityForm />}
    </div>
  );
}
