import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';
import FilePreview from './FilePreview';
import api from './api';

export default function Art({ userInfo }) {
  const tabs = [
    { key: 'all', label: '全部', dbValue: '' },
    { key: 'music', label: '音乐', dbValue: '音乐' },
    { key: 'painting', label: '绘画', dbValue: '绘画' },
    { key: 'dance', label: '舞蹈', dbValue: '舞蹈' },
    { key: 'writing', label: '写作', dbValue: '写作' },
    { key: 'photography', label: '摄影', dbValue: '摄影' },
    { key: 'sculpture', label: '雕塑', dbValue: '雕塑' },
    { key: 'calligraphy', label: '书法', dbValue: '书法' },
    { key: 'design', label: '设计', dbValue: '设计' },
    { key: 'theater', label: '戏剧', dbValue: '戏剧' },
    { key: 'film', label: '影视', dbValue: '影视' },
    { key: 'craft', label: '手工艺', dbValue: '手工艺' },
    { key: 'digital', label: '数字艺术', dbValue: '数字艺术' }
  ];
  
  const [tab, setTab] = useState('all');
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
  const [showComments, setShowComments] = useState({});
  const [commentForm, setCommentForm] = useState({ author: '', authorClass: '', content: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const currentTab = tabs.find(t => t.key === tab);
    const dbTab = currentTab ? currentTab.dbValue : '';
    
    if (tab === 'all') {
      api.art.getAll('', sort === 'hot' ? 'hot' : '')
        .then(data => {
          if (Array.isArray(data)) {
            setList(data);
          } else {
            console.error('API返回的数据不是数组:', data);
            setList([]);
          }
        })
        .catch(error => {
          console.error('加载失败:', error);
          setList([]);
        });
    } else {
      api.art.getAll(dbTab, sort === 'hot' ? 'hot' : '')
        .then(data => {
          if (Array.isArray(data)) {
            setList(data);
          } else {
            console.error('API返回的数据不是数组:', data);
            setList([]);
          }
        })
        .catch(error => {
          console.error('加载失败:', error);
          setList([]);
        });
    }
  }, [tab, sort, tabs]);

  const handleLike = async (id) => {
    if (!userInfo || !userInfo.name) {
      setMessage('请先完善个人信息');
      return;
    }
    
    try {
      const data = await api.art.like(id, userInfo.name);
      setList(prev => Array.isArray(prev) ? prev.map(item => item._id === id ? data : item) : []);
      
      const isLiked = data.likedUsers && data.likedUsers.includes(userInfo.name);
      let newLiked;
      if (isLiked) {
        newLiked = likedIds.includes(id) ? likedIds : [...likedIds, id];
      } else {
        newLiked = likedIds.filter(_id => _id !== id);
      }
      setLikedIds(newLiked);
      localStorage.setItem('liked_art_ids', JSON.stringify(newLiked));
    } catch (error) {
      console.error('点赞失败:', error);
      setMessage('操作失败，请重试');
    }
  };

  const handleFavorite = async (id) => {
    if (!userInfo || !userInfo.name) {
      setMessage('请先完善个人信息');
      return;
    }
    
    try {
      const data = await api.art.favorite(id, userInfo.name);
      setList(prev => Array.isArray(prev) ? prev.map(item => item._id === id ? data : item) : []);
      
      const isFavorited = data.favorites && data.favorites.includes(userInfo.name);
      let newFavorites;
      if (isFavorited) {
        newFavorites = favoriteIds.includes(id) ? favoriteIds : [...favoriteIds, id];
      } else {
        newFavorites = favoriteIds.filter(_id => _id !== id);
      }
      setFavoriteIds(newFavorites);
      localStorage.setItem('favorite_art_ids', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('收藏失败:', error);
      setMessage('操作失败，请重试');
    }
  };

  // 删除作品
  const handleDeleteArt = async (id) => {
    if (!userInfo || !userInfo.name) {
      setMessage('请先登录');
      return;
    }

    if (!window.confirm('确定要删除这个作品吗？此操作不可恢复。')) {
      return;
    }

    try {
      await api.art.delete(id, userInfo.name, userInfo.isAdmin || false);
      setList(prev => prev.filter(item => item._id !== id));
      setMessage('作品已删除');
    } catch (error) {
      console.error('删除作品失败:', error);
      setMessage('删除失败，请重试');
    }
  };

  // 删除评论
  const handleDeleteComment = async (artId, commentId) => {
    if (!userInfo || !userInfo.name) {
      setMessage('请先登录');
      return;
    }

    if (!window.confirm('确定要删除这条评论吗？')) {
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/art/${artId}/comment/${commentId}?authorName=${encodeURIComponent(userInfo.name)}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setList(prev => prev.map(item => {
          if (item._id === artId) {
            return {
              ...item,
              comments: item.comments.filter(comment => comment.id !== commentId)
            };
          }
          return item;
        }));
        setMessage('评论已删除');
      } else {
        const data = await res.json();
        setMessage(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除评论失败:', error);
      setMessage('删除失败，请重试');
    }
  };

  const handleComment = async (id) => {
    if (!commentForm.content.trim()) {
      setMessage('请输入评论内容');
      return;
    }

    if (!userInfo || !userInfo.name || !userInfo.class) {
      setMessage('请先在个人信息页面填写姓名和班级信息');
      return;
    }

    const commentData = {
      author: userInfo.name,
      authorClass: userInfo.class,
      content: commentForm.content.trim()
    };

    try {
      const data = await api.art.comment(id, commentData);
      setList(Array.isArray(list) ? list.map(item => item._id === id ? data : item) : []);
      setCommentForm({ author: '', authorClass: '', content: '' });
    } catch (error) {
      setMessage('评论失败：' + (error.message || '请重试'));
    }
  };

  const renderMedia = (urls) => (
    <FilePreview 
      urls={urls} 
      apiBaseUrl={process.env.REACT_APP_API_URL || 'http://localhost:5000'} 
    />
  );

  if (showPublish) {
    return <PublishForm onBack={() => setShowPublish(false)} userInfo={userInfo} />;
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      {/* 消息显示 */}
      {message && (
        <div style={{ 
          padding: '15px', 
          background: message.includes('成功') ? '#d4edda' : '#f8d7da',
          color: message.includes('成功') ? '#155724' : '#721c24',
          borderRadius: 8,
          border: `1px solid ${message.includes('成功') ? '#c3e6cb' : '#f5c6cb'}`,
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
        <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '28px' }}>艺术作品展示</h2>
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
                  <span>班级: {item.authorClass}</span>
                  <span>日期: {new Date(item.createdAt).toLocaleString()}</span>
                  <span>浏览 {item.views || 0} 次</span>
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 15 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', color: '#2c3e50', flex: 1 }}>{item.title}</h3>
                {/* 删除按钮 - 只有作者可以删除自己的作品 */}
                {userInfo && userInfo.name && (item.authorName === userInfo.name || item.author === userInfo.name) && (
                  <button
                    onClick={() => handleDeleteArt(item._id)}
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
                )}
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
                    {likedIds.includes(item._id) ? '已喜欢' : '喜欢'}
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
                    {favoriteIds.includes(item._id) ? '已收藏' : '收藏'}
                  </span>
                  <span>{item.favorites?.length || 0}</span>
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
                  <span>评论 ({item.comments?.length || 0})</span>
                </button>

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
                <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>评论</h4>
                
                {/* 评论表单 */}
                <div style={{ marginBottom: 15, padding: '15px', backgroundColor: '#f8f9fa', borderRadius: 8, border: '1px solid #e9ecef' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <Avatar 
                      src={userInfo?.avatar} 
                      name={userInfo?.name || '用户'} 
                      size={32}
                    />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#2c3e50' }}>
                        {userInfo?.name || '未登录用户'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        {userInfo?.class || '请先完善个人信息'}
                      </div>
                    </div>
                  </div>
                  <textarea
                    placeholder="写下您的评论..."
                    value={commentForm.content}
                    onChange={(e) => setCommentForm(prev => ({ ...prev, content: e.target.value }))}
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      borderRadius: 6, 
                      border: '1px solid #ddd', 
                      resize: 'vertical',
                      fontSize: '14px',
                      fontFamily: 'inherit'
                    }}
                    rows={3}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button
                      onClick={() => handleComment(item._id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
                    >
                      发表评论
                    </button>
                  </div>
                </div>

                {/* 评论列表 */}
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {item.comments?.length > 0 ? (
                    item.comments.map(comment => (
                      <div key={comment.id} style={{ 
                        marginBottom: '10px', 
                        padding: '12px', 
                        backgroundColor: '#fff', 
                        borderRadius: 8,
                        border: '1px solid #e9ecef',
                        transition: 'all 0.2s ease'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '13px', color: '#2c3e50' }}>{comment.author}</strong>
                            <span style={{ fontSize: '11px', color: '#7f8c8d', background: '#f8f9fa', padding: '2px 6px', borderRadius: '10px' }}>
                              {comment.authorClass}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', color: '#7f8c8d' }}>
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                            {/* 删除评论按钮 - 只有评论作者可以删除自己的评论 */}
                            {userInfo && userInfo.name && comment.author === userInfo.name && (
                              <button
                                onClick={() => handleDeleteComment(item._id, comment.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#dc3545',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseOver={(e) => {
                                  e.target.style.backgroundColor = '#f8d7da';
                                }}
                                onMouseOut={(e) => {
                                  e.target.style.backgroundColor = 'transparent';
                                }}
                              >
                                删除
                              </button>
                            )}
                          </div>
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
function PublishForm({ onBack, userInfo }) {
  const tabs = [
    { key: 'music', label: '音乐', dbValue: '音乐' },
    { key: 'painting', label: '绘画', dbValue: '绘画' },
    { key: 'dance', label: '舞蹈', dbValue: '舞蹈' },
    { key: 'writing', label: '写作', dbValue: '写作' },
    { key: 'photography', label: '摄影', dbValue: '摄影' },
    { key: 'sculpture', label: '雕塑', dbValue: '雕塑' },
    { key: 'calligraphy', label: '书法', dbValue: '书法' },
    { key: 'design', label: '设计', dbValue: '设计' },
    { key: 'theater', label: '戏剧', dbValue: '戏剧' },
    { key: 'film', label: '影视', dbValue: '影视' },
    { key: 'craft', label: '手工艺', dbValue: '手工艺' },
    { key: 'digital', label: '数字艺术', dbValue: '数字艺术' }
  ];

  const [formData, setFormData] = useState({
    tab: '音乐',
    title: '',
    content: '',
    authorName: userInfo?.name || '',
    authorClass: userInfo?.class || '',
    media: []
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 清除之前的消息
    setMessage('');
    
    if (!formData.title.trim()) {
      setMessage('请输入作品标题！');
      return;
    }

    if (!formData.content.trim()) {
      setMessage('请输入作品描述！');
      return;
    }

    if (!userInfo || !userInfo.name || !userInfo.class) {
      setMessage('请先在个人信息页面填写姓名和班级信息！');
      return;
    }

    // 显示发布中状态
    setMessage('正在发布作品，请稍候...');

    try {
      const result = await api.art.create({
        tab: formData.tab,
        title: formData.title.trim(),
        content: formData.content.trim(),
        media: formData.media || [],
        authorName: userInfo.name,
        authorClass: userInfo.class
      });
      
      if (result) {
        setMessage('🎉 作品发布成功！');
        // 延迟1秒后返回，让用户看到成功消息
        setTimeout(() => {
          onBack();
        }, 1000);
      } else {
        setMessage('发布失败，请重试');
      }
    } catch (error) {
      console.error('发布作品失败:', error);
      setMessage('发布失败：' + (error.message || '网络错误，请检查连接后重试'));
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    // 清除之前的消息
    setMessage('');
    setUploading(true);
    
    const uploadFormData = new FormData();
    Array.from(files).forEach(file => uploadFormData.append('files', file));

    try {
      const data = await api.upload(uploadFormData);
      if (data && data.urls && data.urls.length > 0) {
        setFormData(prev => ({ ...prev, media: [...prev.media, ...data.urls] }));
        setMessage(`✅ 成功上传 ${data.urls.length} 个文件`);
      } else {
        setMessage('文件上传失败，请重试');
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      setMessage('文件上传失败：' + (error.message || '请检查文件大小和格式'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginBottom: 25, color: '#2c3e50' }}>✨ 发布艺术作品</h2>
      
      {/* 消息显示 */}
      {message && (
        <div style={{ 
          padding: '15px', 
          background: message.includes('成功') ? '#d4edda' : '#f8d7da',
          color: message.includes('成功') ? '#155724' : '#721c24',
          borderRadius: 8,
          border: `1px solid ${message.includes('成功') ? '#c3e6cb' : '#f5c6cb'}`,
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}
      
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
            {tabs.map(tabItem => (
              <option key={tabItem.key} value={tabItem.dbValue}>
                {tabItem.label}
              </option>
            ))}
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

        {/* 用户信息显示 */}
        {userInfo && userInfo.name && userInfo.class ? (
          <div style={{ 
            marginBottom: 20, 
            padding: '15px', 
            backgroundColor: '#e8f5e8', 
            borderRadius: 8,
            border: '1px solid #c3e6c3'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Avatar src={userInfo.avatar} name={userInfo.name} size={40} />
              <div>
                <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{userInfo.name}</div>
                <div style={{ fontSize: '14px', color: '#7f8c8d' }}>{userInfo.class}</div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#27ae60' }}>
              ✓ 将以此身份发布作品
            </div>
          </div>
        ) : (
          <div style={{ 
            marginBottom: 20, 
            padding: '15px', 
            backgroundColor: '#fef9e7', 
            borderRadius: 8,
            border: '1px solid #f4d03f',
            textAlign: 'center'
          }}>
            <div style={{ color: '#f39c12', fontWeight: 'bold', marginBottom: 5 }}>
              请先设置个人信息
            </div>
            <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
              请先在个人信息页面填写姓名和班级信息
            </div>
          </div>
        )}

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
                apiBaseUrl={process.env.REACT_APP_API_URL || 'http://localhost:5000'} 
              />
              <div style={{ 
                position: 'absolute', 
                top: 10, 
                right: 10, 
                display: 'flex', 
                gap: 5 
              }}>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, media: [] }))}
                  style={{ 
                    background: '#e74c3c', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: 4, 
                    padding: '5px 10px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  清空所有
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 15, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onBack}
            disabled={uploading}
            style={{
              padding: '12px 24px',
              background: uploading ? '#bdc3c7' : '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              opacity: uploading ? 0.6 : 1
            }}
          >
            取消
          </button>
          <button
            type="submit"
            disabled={uploading}
            style={{
              padding: '12px 24px',
              background: uploading ? '#bdc3c7' : '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              opacity: uploading ? 0.6 : 1,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (!uploading) {
                e.target.style.background = '#229954';
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!uploading) {
                e.target.style.background = '#27ae60';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            {uploading ? '⏳ 上传中...' : '🚀 发布作品'}
          </button>
        </div>
      </form>
    </div>
  );
}