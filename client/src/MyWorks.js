import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';
import api from './api';
import { buildApiUrl } from './utils/apiUrl';

export default function MyWorks({ userInfo, onBack }) {
  const [works, setWorks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState({});
  const [activeCategory, setActiveCategory] = useState('all');

  const loadMyWorks = React.useCallback(async () => {
    setLoading(true);
    try {
      if (userInfo && userInfo.name) {
        console.log('加载我的作品，作者姓名:', userInfo.name);
        
        // 加载艺术作品
        const artData = await api.art.getMyWorks(userInfo.name);
        console.log('我的艺术作品数据:', artData);
        setWorks(artData || []);
        
        // 加载活动设计
        const activityRes = await fetch(buildApiUrl(`/api/activities/my-activities?authorName=${encodeURIComponent(userInfo.name)}`));
        const activityData = await activityRes.json();
        console.log('我的活动数据:', activityData);
        setActivities(activityData || []);
      } else {
        console.log('用户信息不完整:', userInfo);
      }
    } catch (error) {
      console.error('加载我的作品失败:', error);
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  useEffect(() => {
    if (userInfo && userInfo.name) {
      loadMyWorks();
    }
  }, [userInfo, loadMyWorks]);

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个作品吗？此操作不可恢复。')) {
      return;
    }

    if (!userInfo || !userInfo.name) {
      alert('用户信息不完整，无法删除作品');
      return;
    }

    try {
      const res = await fetch(buildApiUrl(`/api/art/${id}?authorName=${encodeURIComponent(userInfo.name)}&isAdmin=${userInfo.isAdmin || false}`), {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setWorks(prev => prev.filter(item => item._id !== id));
        alert('作品已删除');
      } else {
        const error = await res.json();
        alert('删除失败：' + (error.error || '请重试'));
      }
    } catch (error) {
      alert('删除失败：' + error.message);
    }
  };

  const renderMedia = (urls) => (
    <div style={{ marginTop: 8 }}>
      {urls && urls.map((url, idx) => {
        if (!url || url.trim() === '') return null;
        
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
        <div style={{
          padding: '4px 8px',
          backgroundColor: '#e8f5e8',
          color: '#27ae60',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          活动设计
        </div>
      </div>

      <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '18px' }}>
        {activity.title}
      </h3>

      {activity.image && (
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
      )}

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
          <span>喜欢 {activity.likes || 0}</span>
          <span>浏览 {activity.views || 0}</span>
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
          <span>收藏 {activity.favorites?.length || 0}</span>
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

  const renderWork = (work) => (
    <div key={work._id} style={{
      background: '#fff',
      borderRadius: 12,
      padding: 20,
      marginBottom: 15,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '1px solid #e9ecef'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar src={work.authorAvatar} name={work.authorName} size={40} />
          <div>
            <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{work.authorName}</div>
            <div style={{ fontSize: '14px', color: '#7f8c8d' }}>{work.authorClass}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            padding: '4px 8px',
            backgroundColor: '#e3f2fd',
            color: '#1976d2',
            borderRadius: 12,
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {work.tab}
          </span>
          <button
            onClick={() => handleDelete(work._id)}
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
        </div>
      </div>

      <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '18px' }}>
        {work.title}
      </h3>

      <p style={{
        color: '#6c757d',
        lineHeight: '1.6',
        marginBottom: 15,
        whiteSpace: 'pre-wrap'
      }}>
        {work.content}
      </p>

      {renderMedia(work.media)}

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
          <span>喜欢 {work.likes || 0}</span>
          <span>浏览 {work.views || 0}</span>
          <button
            onClick={() => setShowComments(prev => ({ ...prev, [work._id]: !prev[work._id] }))}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              cursor: 'pointer',
              fontSize: '14px',
              textDecoration: 'underline'
            }}
          >
            评论 {work.comments?.length || 0}
          </button>
          <span>收藏 {work.favorites?.length || 0}</span>
        </div>
        <span>{new Date(work.createdAt).toLocaleString()}</span>
      </div>

      {/* 评论区域 */}
      {showComments[work._id] && (
        <div style={{ 
          marginTop: 15, 
          padding: 15, 
          backgroundColor: '#f8f9fa', 
          borderRadius: 8,
          border: '1px solid #e9ecef'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#495057', fontSize: '16px' }}>
            评论 ({work.comments?.length || 0})
          </h4>
          {work.comments && work.comments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {work.comments.map((comment, index) => (
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
            我的作品
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
            我的作品 ({activeCategory === 'all' ? works.length + activities.length : activeCategory === 'art' ? works.length : activities.length})
          </h2>
        </div>
        <button
          onClick={loadMyWorks}
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

      {/* 分类按钮 */}
      <div style={{ 
        display: 'flex', 
        gap: 10, 
        marginBottom: 25,
        borderBottom: '1px solid #e9ecef',
        paddingBottom: 15
      }}>
        <button
          onClick={() => setActiveCategory('all')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeCategory === 'all' ? '#3498db' : '#ecf0f1',
            color: activeCategory === 'all' ? 'white' : '#2c3e50',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.3s ease'
          }}
        >
          全部 ({works.length + activities.length})
        </button>
        <button
          onClick={() => setActiveCategory('art')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeCategory === 'art' ? '#3498db' : '#ecf0f1',
            color: activeCategory === 'art' ? 'white' : '#2c3e50',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.3s ease'
          }}
        >
          艺术作品 ({works.length})
        </button>
        <button
          onClick={() => setActiveCategory('activity')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeCategory === 'activity' ? '#3498db' : '#ecf0f1',
            color: activeCategory === 'activity' ? 'white' : '#2c3e50',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.3s ease'
          }}
        >
          活动设计 ({activities.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
          加载中...
        </div>
      ) : (
        <div>
          {(() => {
            const allItems = [];
            
            if (activeCategory === 'all' || activeCategory === 'art') {
              works.forEach(work => {
                allItems.push({ ...work, type: 'art' });
              });
            }
            
            if (activeCategory === 'all' || activeCategory === 'activity') {
              activities.forEach(activity => {
                allItems.push({ ...activity, type: 'activity' });
              });
            }
            
            // 按创建时间排序
            allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            if (allItems.length > 0) {
              return allItems.map(item => 
                item.type === 'art' ? renderWork(item) : renderActivity(item)
              );
            } else {
              return (
                <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
                  <div>还没有发布任何{activeCategory === 'art' ? '艺术作品' : activeCategory === 'activity' ? '活动设计' : '作品'}</div>
                  <div style={{ fontSize: '14px', marginTop: '10px' }}>
                    去{activeCategory === 'activity' ? '活动展示' : '艺术作品'}页面发布您的第一个{activeCategory === 'art' ? '艺术作品' : activeCategory === 'activity' ? '活动设计' : '作品'}吧！
                  </div>
                </div>
              );
            }
          })()}
        </div>
      )}
    </div>
  );
}
