// 艺术作品主组件
import React, { useState, useEffect, useCallback } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import ArtList from './ArtList';
import ArtForm from './ArtForm';
import { ART_TABS, SORT_OPTIONS } from '../../utils/constants';
import { interactionStorage } from '../../utils/storage';
import { useApiMinimal as useApi } from '../../hooks/useApiMinimal';
import { useUserBasic as useUser } from '../../hooks/useUserBasic';

const Art = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [sort, setSort] = useState('time');
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showComments, setShowComments] = useState({});
  const [commentForm, setCommentForm] = useState({ content: '' });
  
  const api = useApi();
  const { userInfo, isLoggedIn, hasPermission } = useUser();

  // 加载艺术作品列表
  const loadItems = useCallback(async () => {
    try {
      const currentTab = ART_TABS.find(t => t.key === activeTab);
      const dbTab = currentTab ? currentTab.dbValue : '';
      const sortParam = sort === 'hot' ? 'hot' : '';
      
      const data = await api.art.getList(dbTab, sortParam);
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载艺术作品失败:', error);
      setItems([]);
    }
  }, [activeTab, sort, api.art]);

  // 处理点赞
  const handleLike = useCallback(async (id) => {
    if (!isLoggedIn) {
      alert('请先完善个人信息');
      return;
    }

    try {
      const data = await api.art.toggleLike(id, userInfo.name);
      setItems(prev => prev.map(item => item._id === id ? data : item));
      
      // 更新本地存储
      const isLiked = data.likedUsers && data.likedUsers.includes(userInfo.name);
      if (isLiked) {
        interactionStorage.addLike(id, 'art');
      } else {
        interactionStorage.removeLike(id, 'art');
      }
    } catch (error) {
      console.error('点赞失败:', error);
    }
  }, [isLoggedIn, userInfo, api.art]);

  // 处理收藏
  const handleFavorite = useCallback(async (id) => {
    if (!isLoggedIn) {
      alert('请先完善个人信息');
      return;
    }

    try {
      const data = await api.art.toggleFavorite(id, userInfo.name);
      setItems(prev => prev.map(item => item._id === id ? data : item));
      
      // 更新本地存储
      const isFavorited = data.favorites && data.favorites.includes(userInfo.name);
      if (isFavorited) {
        interactionStorage.addFavorite(id, 'art');
      } else {
        interactionStorage.removeFavorite(id, 'art');
      }
    } catch (error) {
      console.error('收藏失败:', error);
    }
  }, [isLoggedIn, userInfo, api.art]);

  // 处理评论
  const handleComment = useCallback(async (id) => {
    if (!commentForm.content.trim()) {
      alert('请输入评论内容');
      return;
    }

    if (!isLoggedIn) {
      alert('请先在个人信息页面填写姓名和班级信息');
      return;
    }

    try {
      const data = await api.art.addComment(id, {
        author: userInfo.name,
        authorClass: userInfo.class,
        content: commentForm.content.trim()
      });
      
      setItems(prev => prev.map(item => item._id === id ? data : item));
      setCommentForm({ content: '' });
    } catch (error) {
      console.error('评论失败:', error);
    }
  }, [commentForm.content, isLoggedIn, userInfo, api.art]);

  // 处理删除
  const handleDelete = useCallback(async (id) => {
    if (!isLoggedIn) {
      alert('请先登录');
      return;
    }

    if (!window.confirm('确定要删除这个作品吗？此操作不可恢复。')) {
      return;
    }

    try {
      await api.art.delete(id, userInfo.name, userInfo.isAdmin);
      setItems(prev => prev.filter(item => item._id !== id));
    } catch (error) {
      console.error('删除作品失败:', error);
    }
  }, [isLoggedIn, userInfo, api.art]);

  // 切换评论显示
  const handleToggleComments = useCallback((id) => {
    setShowComments(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // 评论表单变化
  const handleCommentChange = useCallback((field, value) => {
    setCommentForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // 提交评论
  const handleCommentSubmit = useCallback((id) => {
    handleComment(id);
  }, [handleComment]);

  // 处理发布作品
  const handlePublish = useCallback(async (formData) => {
    try {
      await api.art.create(formData);
      setShowForm(false);
      loadItems(); // 重新加载列表
    } catch (error) {
      console.error('发布作品失败:', error);
    }
  }, [api.art, loadItems]);

  // 加载数据
  useEffect(() => {
    loadItems();
  }, [activeTab, sort]); // 只依赖真正需要的状态

  // 加载本地交互数据
  useEffect(() => {
    if (items.length > 0) {
      // 这里可以加载本地存储的点赞和收藏状态
      // 但主要状态由服务器管理
    }
  }, [items]);

  if (showForm) {
    return (
      <ArtForm
        userInfo={userInfo}
        onSubmit={handlePublish}
        onCancel={() => setShowForm(false)}
        loading={api.loading}
      />
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto' }}>
      {/* 头部 */}
      <Card style={{ marginBottom: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '28px' }}>
            艺术作品展示
          </h2>
          <Button
            variant="primary"
            onClick={() => setShowForm(true)}
            disabled={!hasPermission('create')}
          >
            ✨ 发布作品
          </Button>
        </div>
      </Card>

      {/* 分类和排序 */}
      <Card style={{ marginBottom: '25px' }}>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
          {ART_TABS.map(tabItem => (
            <Button
              key={tabItem.key}
              variant={activeTab === tabItem.key ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setActiveTab(tabItem.key)}
            >
              {tabItem.label}
            </Button>
          ))}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant={sort === 'hot' ? 'warning' : 'secondary'}
            size="small"
            onClick={() => setSort(sort === 'hot' ? 'time' : 'hot')}
          >
            {sort === 'hot' ? '⏰ 按时间排序' : '🔥 按热度排序'}
          </Button>
        </div>
      </Card>

      {/* 内容区域 */}
      {api.loading ? (
        <LoadingSpinner text="加载中..." />
      ) : (
        <ArtList
          items={items}
          userInfo={userInfo}
          onLike={handleLike}
          onFavorite={handleFavorite}
          onComment={handleComment}
          onDelete={handleDelete}
          showComments={showComments}
          onToggleComments={handleToggleComments}
          commentForm={commentForm}
          onCommentChange={handleCommentChange}
          onCommentSubmit={handleCommentSubmit}
        />
      )}
    </div>
  );
};

export default Art;
