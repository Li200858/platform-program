import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';
import api from './api';

export default function MyCollection({ userInfo, onBack }) {
  const [activeTab, setActiveTab] = useState('favorites');
  const [favorites, setFavorites] = useState([]);
  const [likes, setLikes] = useState([]);
  const [activityFavorites, setActivityFavorites] = useState([]);
  const [activityLikes, setActivityLikes] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = React.useCallback(async () => {
    if (!userInfo || !userInfo.name) {
      console.log('用户信息不完整:', userInfo);
      return;
    }
    
    setLoading(true);
    try {
      console.log('加载数据，用户:', userInfo.name, '标签:', activeTab);
      if (activeTab === 'favorites') {
        // 加载艺术作品收藏
        const artData = await api.art.getFavorites(userInfo.name);
        console.log('艺术作品收藏数据:', artData);
        
        // 加载活动收藏
        const activityRes = await fetch(`http://localhost:5000/api/activities/favorites?authorName=${encodeURIComponent(userInfo.name)}`);
        if (!activityRes.ok) {
          throw new Error(`HTTP error! status: ${activityRes.status}`);
        }
        const activityData = await activityRes.json();
        console.log('活动收藏数据:', activityData);
        
        // 合并数据，添加类型标识
        const artWithType = (artData || []).map(item => ({ ...item, type: 'art' }));
        const activityWithType = (activityData || []).map(item => ({ ...item, type: 'activity' }));
        
        setFavorites([...artWithType, ...activityWithType]);
      } else {
        // 加载艺术作品喜欢
        const artData = await api.art.getLikes(userInfo.name);
        console.log('艺术作品喜欢数据:', artData);
        
        // 加载活动喜欢
        const activityRes = await fetch(`http://localhost:5000/api/activities/likes?authorName=${encodeURIComponent(userInfo.name)}`);
        if (!activityRes.ok) {
          throw new Error(`HTTP error! status: ${activityRes.status}`);
        }
        const activityData = await activityRes.json();
        console.log('活动喜欢数据:', activityData);
        
        // 合并数据，添加类型标识
        const artWithType = (artData || []).map(item => ({ ...item, type: 'art' }));
        const activityWithType = (activityData || []).map(item => ({ ...item, type: 'activity' }));
        
        setLikes([...artWithType, ...activityWithType]);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, userInfo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUnfavorite = async (id, type) => {
    if (!userInfo || !userInfo.name) {
      alert('用户信息不完整，无法操作');
      return;
    }

    try {
      const endpoint = type === 'activity' ? `http://localhost:5000/api/activities/${id}/favorite` : `http://localhost:5000/api/art/${id}/favorite`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userInfo.name })
      });
      
      if (res.ok) {
        setFavorites(prev => prev.filter(item => item._id !== id));
        alert('已取消收藏');
      } else {
        const errorData = await res.json();
        alert(errorData.error || '操作失败');
      }
    } catch (error) {
      alert('操作失败');
    }
  };

  const handleUnlike = async (id, type) => {
    if (!userInfo || !userInfo.name) {
      alert('用户信息不完整，无法操作');
      return;
    }

    try {
      const endpoint = type === 'activity' ? `http://localhost:5000/api/activities/${id}/like` : `http://localhost:5000/api/art/${id}/like`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userInfo.name })
      });
      
      if (res.ok) {
        setLikes(prev => prev.filter(item => item._id !== id));
        alert('已取消喜欢');
      } else {
        const errorData = await res.json();
        alert(errorData.error || '操作失败');
      }
    } catch (error) {
      alert('操作失败');
    }
  };

  const renderMedia = (urls) => (
    <div style={{ marginTop: 8 }}>
      {urls && urls.map((url, idx) => {
        const ext = url.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) {
          return (
            <img
              key={idx}
              src={url}
              alt={`媒体 ${idx + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: 200,
                borderRadius: 8,
                marginRight: 8,
                marginBottom: 8,
                objectFit: 'cover'
              }}
            />
          );
        } else if (['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(ext)) {
          return (
            <video
              key={idx}
              src={url}
              controls
              style={{
                maxWidth: '100%',
                maxHeight: 200,
                borderRadius: 8,
                marginRight: 8,
                marginBottom: 8
              }}
            />
          );
        } else {
          return (
            <div
              key={idx}
              style={{
                display: 'inline-block',
                padding: '8px 12px',
                backgroundColor: '#f8f9fa',
                borderRadius: 8,
                marginRight: 8,
                marginBottom: 8,
                fontSize: '14px',
                color: '#6c757d'
              }}
            >
              📎 {url.split('/').pop()}
            </div>
          );
        }
      })}
    </div>
  );

  const renderItem = (item, isFavorite = false) => (
    <div key={item._id} style={{
      background: '#fff',
      borderRadius: 12,
      padding: 20,
      marginBottom: 15,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '1px solid #e9ecef'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar src={item.authorAvatar} name={item.authorName} size={40} />
          <div>
            <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{item.authorName}</div>
            <div style={{ fontSize: '14px', color: '#7f8c8d' }}>{item.authorClass}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{
            padding: '4px 8px',
            backgroundColor: item.type === 'activity' ? '#e8f5e8' : '#e3f2fd',
            color: item.type === 'activity' ? '#2e7d32' : '#1976d2',
            borderRadius: 12,
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {item.type === 'activity' ? '活动' : (item.tab || '作品')}
          </span>
          <button
            onClick={() => isFavorite ? handleUnfavorite(item._id, item.type) : handleUnlike(item._id, item.type)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '12px',
              color: '#6c757d'
            }}
          >
            {isFavorite ? '取消收藏' : '取消喜欢'}
          </button>
        </div>
      </div>

      <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '18px' }}>
        {item.title}
      </h3>

      <p style={{
        color: '#6c757d',
        lineHeight: '1.6',
        marginBottom: 15,
        whiteSpace: 'pre-wrap'
      }}>
        {item.content || item.description}
      </p>

      {/* 活动图片显示 */}
      {item.type === 'activity' && item.image && (
        <div style={{ marginBottom: 15 }}>
          <img 
            src={item.image} 
            alt={item.title}
            style={{ 
              width: '100%', 
              height: 200, 
              objectFit: 'cover', 
              borderRadius: 8,
              border: '1px solid #e9ecef'
            }} 
          />
        </div>
      )}

      {/* 艺术作品媒体显示 */}
      {item.type === 'art' && renderMedia(item.media)}

      {/* 活动时间信息 */}
      {item.type === 'activity' && item.startDate && item.endDate && (
        <div style={{
          marginBottom: 15,
          padding: '10px 15px',
          backgroundColor: '#f8f9fa',
          borderRadius: 8,
          border: '1px solid #e9ecef'
        }}>
          <div style={{ fontSize: '14px', color: '#495057', marginBottom: 5 }}>
            <strong>活动时间：</strong>
            {new Date(item.startDate).toLocaleString()} - {new Date(item.endDate).toLocaleString()}
          </div>
          <div style={{ fontSize: '14px', color: '#495057' }}>
            <strong>状态：</strong>
            {new Date() < new Date(item.startDate) ? '未开始' : 
             new Date() > new Date(item.endDate) ? '已结束' : '进行中'}
          </div>
        </div>
      )}

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
        <div style={{ display: 'flex', gap: 20 }}>
          <span>喜欢 {item.likes || 0}</span>
          {item.type === 'art' && <span>浏览 {item.views || 0}</span>}
          <span>评论 {item.comments?.length || 0}</span>
          {item.type === 'activity' && <span>收藏 {item.favorites?.length || 0}</span>}
        </div>
        <span>{new Date(item.createdAt).toLocaleString()}</span>
      </div>
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
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        textAlign: 'center'
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
            我的收藏与喜欢
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
            我的收藏与喜欢
          </h2>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 16px',
            fontSize: '14px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            transition: 'all 0.3s ease',
            opacity: loading ? 0.6 : 1
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
            }
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = 'none';
          }}
        >
          {loading ? '加载中...' : '刷新'}
        </button>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: 10, 
        marginBottom: 25,
        borderBottom: '1px solid #e9ecef'
      }}>
        <button
          onClick={() => setActiveTab('favorites')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'favorites' ? '#3498db' : '#f8f9fa',
            color: activeTab === 'favorites' ? 'white' : '#6c757d',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          我的收藏 ({favorites.length})
        </button>
        <button
          onClick={() => setActiveTab('likes')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'likes' ? '#3498db' : '#f8f9fa',
            color: activeTab === 'likes' ? 'white' : '#6c757d',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          我的喜欢 ({likes.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
          加载中...
        </div>
      ) : (
        <div>
          {activeTab === 'favorites' ? (
            favorites.length > 0 ? (
              favorites.map(item => renderItem(item, true))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
                <div>还没有收藏任何内容</div>
                <div style={{ fontSize: '14px', marginTop: '10px' }}>
                  去艺术作品页面或活动展示页面收藏喜欢的内容吧！
                </div>
              </div>
            )
          ) : (
            likes.length > 0 ? (
              likes.map(item => renderItem(item, false))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
                <div>还没有喜欢任何内容</div>
                <div style={{ fontSize: '14px', marginTop: '10px' }}>
                  去艺术作品页面或活动展示页面点赞喜欢的内容吧！
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
