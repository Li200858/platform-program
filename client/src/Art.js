
import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';
import FilePreview from './FilePreview';
import api from './api';

export default function Art({ userInfo, isAdmin, maintenanceStatus }) {
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
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);
  const [selectedArt, setSelectedArt] = useState(null);
  const [collaboratorSearch, setCollaboratorSearch] = useState('');
  const [collaboratorResults, setCollaboratorResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

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
  }, [tab, sort]);

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
      await api.art.delete(id, userInfo.name, isAdmin || false);
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
      const res = await fetch(`${process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://platform-program.onrender.com' : 'http://localhost:5000')}/api/art/${artId}/comment/${commentId}?authorName=${encodeURIComponent(userInfo.name)}`, {
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

  const renderMedia = (urls, allowDownload = true) => (
    <FilePreview 
      urls={urls} 
      apiBaseUrl={process.env.NODE_ENV === 'production' ? 'https://platform-program.onrender.com' : 'http://localhost:5000'}
      allowDownload={allowDownload}
    />
  );

  // 管理合作用户
  const handleManageCollaborators = (art) => {
    setSelectedArt(art);
    setShowCollaboratorModal(true);
    setCollaboratorSearch('');
    setCollaboratorResults([]);
  };

  // 搜索用户
  const handleSearchUsers = async () => {
    if (!collaboratorSearch.trim()) {
      setMessage('请输入搜索关键词');
      return;
    }

    setSearchLoading(true);
    try {
      const data = await api.search.global(collaboratorSearch.trim(), 'user');
      setCollaboratorResults(data.users || []);
      if (data.users && data.users.length === 0) {
        setMessage('未找到相关用户');
      }
    } catch (error) {
      console.error('搜索用户失败:', error);
      setMessage('搜索失败，请重试');
    } finally {
      setSearchLoading(false);
    }
  };

  // 邀请合作用户
  const handleInviteCollaborator = async (user) => {
    if (!selectedArt) return;

    try {
      await api.art.inviteCollaborator(selectedArt._id, {
        username: user.name,
        name: user.name,
        class: user.class,
        invitedBy: userInfo.name
      });
      setMessage('邀请已发送');
      // 重新加载作品列表
      const currentTab = tabs.find(t => t.key === tab);
      const dbTab = currentTab ? currentTab.dbValue : '';
      const data = await api.art.getAll(dbTab, sort === 'hot' ? 'hot' : '');
      setList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('邀请失败:', error);
      setMessage('邀请失败：' + (error.message || '请重试'));
    }
  };

  // 移除合作用户
  const handleRemoveCollaborator = async (username) => {
    if (!selectedArt) return;

    try {
      await api.art.removeCollaborator(selectedArt._id, username, userInfo.name);
      setMessage('合作用户已移除');
      // 重新加载作品列表
      const currentTab = tabs.find(t => t.key === tab);
      const dbTab = currentTab ? currentTab.dbValue : '';
      const data = await api.art.getAll(dbTab, sort === 'hot' ? 'hot' : '');
      setList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('移除失败:', error);
      setMessage('移除失败：' + (error.message || '请重试'));
    }
  };



  // 查看用户详情
  const handleViewUserProfile = (username, name, userClass) => {
    const targetUserInfo = {
      username: username,
      name: name,
      class: userClass
    };
    
    // 创建用户详情弹窗
    const userDetailModal = document.createElement('div');
    userDetailModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;
    
    // 创建弹窗内容
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: #fff;
      border-radius: 15px;
      padding: 30px;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    `;

    // 创建头像
    const avatar = document.createElement('div');
    avatar.style.cssText = `
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 15px;
      color: white;
      font-size: 32px;
      font-weight: bold;
    `;
    avatar.textContent = name.charAt(0).toUpperCase();

    // 创建用户信息
    const userInfoDiv = document.createElement('div');
    userInfoDiv.style.marginBottom = '20px';
    
    const nameH3 = document.createElement('h3');
    nameH3.style.cssText = 'margin: 0 0 10px 0; color: #2c3e50; font-size: 24px;';
    nameH3.textContent = name;
    
    const classP = document.createElement('p');
    classP.style.cssText = 'margin: 0 0 5px 0; color: #7f8c8d; font-size: 16px;';
    classP.textContent = `班级: ${userClass}`;
    
    const usernameP = document.createElement('p');
    usernameP.style.cssText = 'margin: 0; color: #7f8c8d; font-size: 14px;';
    usernameP.textContent = `用户名: ${username}`;

    userInfoDiv.appendChild(avatar);
    userInfoDiv.appendChild(nameH3);
    userInfoDiv.appendChild(classP);
    userInfoDiv.appendChild(usernameP);

    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 10px; justify-content: center;';

    // 创建关闭按钮
    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
      padding: 10px 20px;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
    `;
    closeButton.textContent = '关闭';
    closeButton.onclick = () => {
      document.body.removeChild(userDetailModal);
    };

    buttonContainer.appendChild(closeButton);


    // 组装弹窗内容
    modalContent.appendChild(userInfoDiv);
    modalContent.appendChild(buttonContainer);
    userDetailModal.appendChild(modalContent);
    
    document.body.appendChild(userDetailModal);
    
    // 点击背景关闭弹窗
    userDetailModal.addEventListener('click', (e) => {
      if (e.target === userDetailModal) {
        document.body.removeChild(userDetailModal);
      }
    });
  };

  if (showPublish) {
    return <PublishForm onBack={() => setShowPublish(false)} userInfo={userInfo} maintenanceStatus={maintenanceStatus} />;
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
          onClick={() => {
            if (maintenanceStatus.isEnabled && !userInfo?.isAdmin) {
              alert(maintenanceStatus.message || '网站正在维护中，暂时无法发布作品');
              return;
            }
            setShowPublish(true);
          }}
          disabled={maintenanceStatus.isEnabled && !userInfo?.isAdmin}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: (maintenanceStatus.isEnabled && !userInfo?.isAdmin) ? '#95a5a6' : '#3498db', 
            color: 'white', 
            border: 'none', 
            borderRadius: 8,
            cursor: (maintenanceStatus.isEnabled && !userInfo?.isAdmin) ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: (maintenanceStatus.isEnabled && !userInfo?.isAdmin) ? 'none' : '0 2px 8px rgba(52, 152, 219, 0.3)',
            transition: 'all 0.3s ease',
            opacity: (maintenanceStatus.isEnabled && !userInfo?.isAdmin) ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (!(maintenanceStatus.isEnabled && !userInfo?.isAdmin)) {
              e.target.style.backgroundColor = '#2980b9';
              e.target.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!(maintenanceStatus.isEnabled && !userInfo?.isAdmin)) {
              e.target.style.backgroundColor = '#3498db';
              e.target.style.transform = 'translateY(0)';
            }
          }}
        >
          {maintenanceStatus.isEnabled && !userInfo?.isAdmin ? '维护中' : '发布作品'}
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
          {sort === 'hot' ? '按时间排序' : '按热度排序'}
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {Array.isArray(list) && list.map(item => (
          <div key={item._id} data-art-id={item._id} style={{ 
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
                </div>
                {/* 合作用户信息 */}
                {item.collaborators && item.collaborators.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: '12px', color: '#7f8c8d' }}>
                    <span style={{ fontWeight: 'bold' }}>合作用户: </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                      {item.collaborators.map((collab, index) => (
                        <div
                          key={index}
                          onClick={() => handleViewUserProfile(collab.username, collab.name, collab.class)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            background: '#f8f9fa',
                            borderRadius: '12px',
                            border: '1px solid #e9ecef',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#e9ecef';
                            e.target.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = '#f8f9fa';
                            e.target.style.transform = 'scale(1)';
                          }}
                        >
                          <Avatar 
                            name={collab.name} 
                            size={20}
                            style={{ border: '1px solid #dee2e6' }}
                          />
                          <span style={{ fontSize: '11px', fontWeight: '500' }}>{collab.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ marginBottom: 15 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', color: '#2c3e50', flex: 1 }}>{item.title}</h3>
                {/* 管理按钮 - 作者可以管理自己的作品，管理员可以删除任何作品 */}
                {userInfo && userInfo.name && ((item.authorName === userInfo.name || item.author === userInfo.name) || isAdmin) && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleManageCollaborators(item)}
                      style={{
                        background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '8px 16px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(52, 152, 219, 0.3)'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'scale(1.05)';
                        e.target.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = '0 2px 8px rgba(52, 152, 219, 0.3)';
                      }}
                    >
                      管理合作
                    </button>
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
                )}
              </div>
              <p style={{ margin: 0, lineHeight: 1.6, color: '#34495e', fontSize: '15px' }}>{item.content}</p>
            </div>
            {renderMedia(item.media, item.allowDownload)}
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

      {/* 合作用户管理弹窗 */}
      <CollaboratorModal
        show={showCollaboratorModal}
        onClose={() => setShowCollaboratorModal(false)}
        art={selectedArt}
        searchQuery={collaboratorSearch}
        setSearchQuery={setCollaboratorSearch}
        searchResults={collaboratorResults}
        searchLoading={searchLoading}
        onSearch={handleSearchUsers}
        onInvite={handleInviteCollaborator}
        onRemove={handleRemoveCollaborator}
        message={message}
      />
    </div>
  );
}

// 发布表单组件
function PublishForm({ onBack, userInfo, maintenanceStatus }) {
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
    media: [],
    allowDownload: true
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]); // 保存选择的文件

  // 保存草稿到localStorage
  const saveDraft = () => {
    const draft = {
      tab: formData.tab,
      title: formData.title,
      content: formData.content,
      media: formData.media,
      allowDownload: formData.allowDownload,
      selectedFiles: selectedFiles
    };
    localStorage.setItem('art_draft', JSON.stringify(draft));
  };

  // 从localStorage恢复草稿
  const loadDraft = () => {
    const savedDraft = localStorage.getItem('art_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(prev => ({
          ...prev,
          tab: draft.tab || '音乐',
          title: draft.title || '',
          content: draft.content || '',
          media: draft.media || [],
          allowDownload: draft.allowDownload !== undefined ? draft.allowDownload : true
        }));
        setSelectedFiles(draft.selectedFiles || []);
      } catch (error) {
        console.error('恢复草稿失败:', error);
      }
    }
  };

  // 清除草稿
  const clearDraft = () => {
    localStorage.removeItem('art_draft');
    setFormData({
      tab: '音乐',
      title: '',
      content: '',
      authorName: userInfo?.name || '',
      authorClass: userInfo?.class || '',
      media: [],
      allowDownload: true
    });
    setSelectedFiles([]);
  };

  // 组件加载时恢复草稿
  useEffect(() => {
    loadDraft();
  }, []);

  // 当表单数据变化时自动保存草稿
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft();
    }, 1000); // 1秒后保存，避免频繁保存

    return () => clearTimeout(timer);
  }, [formData, selectedFiles]);

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
        setMessage('作品发布成功！');
        // 发布成功后清除草稿
        clearDraft();
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

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    // 保存选择的文件
    setSelectedFiles(Array.from(files));

    // 清除之前的消息
    setMessage('');
    setUploading(true);
    setUploadProgress(0);
    
    const uploadFormData = new FormData();
    let totalSize = 0;
    Array.from(files).forEach(file => {
      uploadFormData.append('files', file);
      totalSize += file.size;
    });

    const startTime = Date.now();
    let uploadedSize = 0;

    try {
      // 使用XMLHttpRequest来获取上传进度
      const xhr = new XMLHttpRequest();
      
      // 监听上传进度
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
          
          // 计算上传速度
          const elapsedTime = (Date.now() - startTime) / 1000; // 秒
          const speed = e.loaded / elapsedTime; // 字节/秒
          setUploadSpeed(speed);
          
          console.log(`📊 上传进度: ${percentComplete.toFixed(1)}% (${(speed / 1024 / 1024).toFixed(2)} MB/s)`);
        }
      });

      // 处理响应
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error('网络错误'));
        xhr.ontimeout = () => reject(new Error('上传超时'));
      });

      const baseUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://platform-program.onrender.com' : 'http://localhost:5000');
      
      xhr.open('POST', `${baseUrl}/api/upload`, true);
      xhr.timeout = 1800000; // 30分钟超时
      xhr.send(uploadFormData);

      const data = await uploadPromise;
      
      if (data && data.urls && data.urls.length > 0) {
        setFormData(prev => ({ ...prev, media: [...prev.media, ...data.urls] }));
        setMessage(`✅ 成功上传 ${data.urls.length} 个文件 (${(totalSize / 1024 / 1024).toFixed(2)}MB)`);
        setUploadProgress(100);
      } else {
        setMessage('文件上传失败，请重试');
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      setMessage('❌ 文件上传失败：' + (error.message || '请检查文件大小和格式'));
      setUploadProgress(0);
    } finally {
      setUploading(false);
      // 3秒后清除进度条
      setTimeout(() => setUploadProgress(0), 3000);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginBottom: 25, color: '#2c3e50' }}>发布艺术作品</h2>
      
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

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.allowDownload}
              onChange={(e) => setFormData(prev => ({ ...prev, allowDownload: e.target.checked }))}
              style={{ margin: 0 }}
            />
            <span style={{ fontSize: 14, color: '#2c3e50' }}>允许其他用户下载此作品</span>
          </label>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            取消勾选后，其他用户将无法下载您上传的文件
          </div>
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
              <Avatar name={userInfo.name} size={40} />
              <div>
                <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{userInfo.name}</div>
                <div style={{ fontSize: '14px', color: '#7f8c8d' }}>{userInfo.class}</div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#27ae60' }}>
              将以此身份发布作品
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
            上传文件（最大2GB，支持微电影）
          </label>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ width: '100%', padding: '10px', borderRadius: 8, border: '2px solid #ecf0f1' }}
          />
          
          {/* 实时上传进度条 */}
          {uploading && uploadProgress > 0 && (
            <div style={{ marginTop: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px',
                fontSize: '13px',
                color: '#2c3e50'
              }}>
                <span style={{ fontWeight: 'bold' }}>
                  📊 上传进度: {uploadProgress.toFixed(1)}%
                </span>
                <span style={{ color: '#3498db', fontWeight: '600' }}>
                  {uploadSpeed > 0 ? `⚡ ${(uploadSpeed / 1024 / 1024).toFixed(2)} MB/s` : '计算速度...'}
                </span>
              </div>
              
              <div style={{
                width: '100%',
                height: '28px',
                backgroundColor: '#ecf0f1',
                borderRadius: '14px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  backgroundColor: uploadProgress === 100 ? '#27ae60' : '#3498db',
                  transition: 'width 0.3s ease, background-color 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: uploadProgress === 100 
                    ? 'linear-gradient(90deg, #27ae60, #2ecc71)' 
                    : 'linear-gradient(90deg, #3498db, #5dade2)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  <span style={{ 
                    color: 'white', 
                    fontWeight: 'bold', 
                    fontSize: '13px',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }}>
                    {uploadProgress === 100 ? '✅ 完成' : `${uploadProgress.toFixed(0)}%`}
                  </span>
                </div>
              </div>
              
              {uploadProgress === 100 && (
                <div style={{ 
                  marginTop: '10px', 
                  color: '#27ae60', 
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  animation: 'fadeIn 0.5s'
                }}>
                  ✨ 上传完成！文件已添加到作品中
                </div>
              )}
              
              {uploadProgress < 100 && uploadSpeed > 0 && (
                <div style={{ 
                  marginTop: '8px', 
                  color: '#7f8c8d', 
                  fontSize: '12px',
                  textAlign: 'center'
                }}>
                  预计剩余时间: {(() => {
                    const totalSize = uploadSpeed > 0 ? (uploadProgress / 100) * 1000 : 0;
                    const remainingSize = totalSize * (1 - uploadProgress / 100);
                    const remainingTime = uploadSpeed > 0 ? remainingSize / uploadSpeed : 0;
                    if (remainingTime < 60) return `${Math.ceil(remainingTime)}秒`;
                    if (remainingTime < 3600) return `${Math.ceil(remainingTime / 60)}分钟`;
                    return `${Math.ceil(remainingTime / 3600)}小时`;
                  })()}
                </div>
              )}
            </div>
          )}
          
          {!uploading && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              💡 提示: 支持图片、视频、音频、文档等，单个文件最大2GB
            </div>
          )}
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

        <div style={{ display: 'flex', gap: 15, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={saveDraft}
              style={{
                padding: '8px 16px',
                background: '#f39c12',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold'
              }}
            >
              保存草稿
            </button>
            <button
              type="button"
              onClick={clearDraft}
              style={{
                padding: '8px 16px',
                background: '#e67e22',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold'
              }}
            >
              清除草稿
            </button>
          </div>
          <div style={{ display: 'flex', gap: 15 }}>
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
            {uploading ? '上传中...' : '发布作品'}
          </button>
        </div>
        </div>
      </form>
    </div>
  );
}

// 合作用户管理弹窗组件
function CollaboratorModal({ 
  show, 
  onClose, 
  art, 
  searchQuery, 
  setSearchQuery, 
  searchResults, 
  searchLoading, 
  onSearch, 
  onInvite, 
  onRemove, 
  message 
}) {
  if (!show || !art) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 15,
        padding: 30,
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: '#2c3e50' }}>管理合作用户 - {art.title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#7f8c8d'
            }}
          >
            ×
          </button>
        </div>

        {/* 消息显示 */}
        {message && (
          <div style={{ 
            marginBottom: 20, 
            padding: '10px 15px', 
            backgroundColor: message.includes('成功') ? '#d4edda' : '#f8d7da',
            color: message.includes('成功') ? '#155724' : '#721c24',
            borderRadius: 6,
            border: `1px solid ${message.includes('成功') ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {message}
          </div>
        )}

        {/* 当前合作用户 */}
        <div style={{ marginBottom: 30 }}>
          <h4 style={{ marginBottom: 15, color: '#2c3e50' }}>当前合作用户</h4>
          {art.collaborators && art.collaborators.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {art.collaborators.map((collab, index) => (
                <div key={index} style={{
                  border: '1px solid #ecf0f1',
                  borderRadius: 8,
                  padding: 15,
                  background: '#f8f9fa',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{collab.name}</div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                      班级: {collab.class} • 加入时间: {new Date(collab.joinedAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => onRemove(collab.username)}
                    style={{
                      padding: '6px 12px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    移除
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>
              暂无合作用户
            </div>
          )}
        </div>

        {/* 搜索和邀请新用户 */}
        <div>
          <h4 style={{ marginBottom: 15, color: '#2c3e50' }}>邀请新合作用户</h4>
          <div style={{ display: 'flex', gap: '10px', marginBottom: 20 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => { if (e.key === 'Enter') onSearch(); }}
              placeholder="搜索用户姓名或班级..."
              style={{ 
                flex: 1, 
                padding: '10px', 
                border: '1px solid #ddd', 
                borderRadius: 6, 
                fontSize: '14px' 
              }}
            />
            <button
              onClick={onSearch}
              disabled={searchLoading}
              style={{
                padding: '10px 20px',
                background: searchLoading ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: searchLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {searchLoading ? '搜索中...' : '搜索'}
            </button>
          </div>

          {/* 搜索结果 */}
          {searchResults.length > 0 && (
            <div>
              <h5 style={{ marginBottom: 10, color: '#2c3e50' }}>搜索结果</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {searchResults.map(user => (
                  <div key={user._id || user.name} style={{
                    border: '1px solid #ecf0f1',
                    borderRadius: 6,
                    padding: 12,
                    background: '#f8f9fa',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{user.name}</div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d' }}>班级: {user.class}</div>
                    </div>
                    <button
                      onClick={() => onInvite(user)}
                      style={{
                        padding: '6px 12px',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      邀请
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}