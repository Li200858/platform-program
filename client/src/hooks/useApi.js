// API调用Hook
import { useState, useCallback } from 'react';
import { buildApiUrl } from '../utils/apiUrl';
import { useMessage } from '../MessageContext';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useMessage();

  // 通用API调用函数
  const callApi = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    try {
      const url = buildApiUrl(endpoint);
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '请求失败' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API调用失败:', error);
      showError(error.message || '请求失败，请重试');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // 艺术作品相关API
  const artApi = {
    // 获取艺术作品列表
    getList: (tab = '', sort = '') => callApi(`/api/art?tab=${tab}&sort=${sort}`),
    
    // 创建艺术作品
    create: (data) => callApi('/api/art', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    // 点赞/取消点赞
    toggleLike: (id, userId) => callApi(`/api/art/${id}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
    
    // 收藏/取消收藏
    toggleFavorite: (id, userId) => callApi(`/api/art/${id}/favorite`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
    
    // 添加评论
    addComment: (id, data) => callApi(`/api/art/${id}/comment`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    // 删除作品
    delete: (id, authorName, isAdmin = false) => callApi(`/api/art/${id}?authorName=${encodeURIComponent(authorName)}&isAdmin=${isAdmin}`, {
      method: 'DELETE',
    }),
    
    // 获取我的作品
    getMyWorks: (authorName) => callApi(`/api/art/my-works?authorName=${encodeURIComponent(authorName)}`),
    
    // 获取收藏的作品
    getFavorites: (authorName) => callApi(`/api/art/favorites?authorName=${encodeURIComponent(authorName)}`),
    
    // 获取喜欢的作品
    getLikes: (authorName) => callApi(`/api/art/likes?authorName=${encodeURIComponent(authorName)}`),
  };

  // 活动相关API
  const activityApi = {
    // 获取活动列表
    getList: () => callApi('/api/activities'),
    
    // 创建活动
    create: (data) => callApi('/api/activities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    // 点赞/取消点赞
    toggleLike: (id, userId) => callApi(`/api/activities/${id}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
    
    // 收藏/取消收藏
    toggleFavorite: (id, userId) => callApi(`/api/activities/${id}/favorite`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
    
    // 添加评论
    addComment: (id, data) => callApi(`/api/activities/${id}/comment`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    // 删除活动
    delete: (id, authorName, isAdmin = false) => callApi(`/api/activities/${id}?authorName=${encodeURIComponent(authorName)}&isAdmin=${isAdmin}`, {
      method: 'DELETE',
    }),
    
    // 获取我的活动
    getMyActivities: (authorName) => callApi(`/api/activities/my-activities?authorName=${encodeURIComponent(authorName)}`),
    
    // 获取收藏的活动
    getFavorites: (authorName) => callApi(`/api/activities/favorites?authorName=${encodeURIComponent(authorName)}`),
    
    // 获取喜欢的活动
    getLikes: (authorName) => callApi(`/api/activities/likes?authorName=${encodeURIComponent(authorName)}`),
  };

  // 反馈相关API
  const feedbackApi = {
    // 创建反馈
    create: (data) => callApi('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  };

  // 用户相关API
  const userApi = {
    // 保存用户信息
    save: (data) => callApi('/api/user', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    // 获取用户信息
    get: (userId) => callApi(`/api/user/${userId}`),
    
    // 检查管理员状态
    checkAdmin: (userName) => callApi(`/api/admin/check?userName=${encodeURIComponent(userName)}`),
  };

  // 管理员相关API
  const adminApi = {
    // 获取反馈列表
    getFeedbacks: () => callApi('/api/admin/feedback'),
    
    // 删除反馈
    deleteFeedback: (id, adminName) => callApi(`/api/admin/feedback/${id}?adminName=${encodeURIComponent(adminName)}`, {
      method: 'DELETE',
    }),
    
    // 获取用户列表
    getUsers: () => callApi('/api/admin/users'),
    
    // 搜索用户
    searchUsers: (query) => callApi(`/api/admin/search-users?q=${encodeURIComponent(query)}`),
    
    // 添加管理员
    addAdmin: (data) => callApi('/api/admin/add-admin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    // 移除管理员
    removeAdmin: (data) => callApi('/api/admin/remove-admin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  };

  // 搜索API
  const searchApi = {
    search: (query) => callApi(`/api/search?q=${encodeURIComponent(query)}`),
  };

  // 文件上传API
  const uploadApi = {
    upload: async (files) => {
      setLoading(true);
      try {
        const formData = new FormData();
        if (Array.isArray(files)) {
          files.forEach(file => formData.append('files', file));
        } else {
          formData.append('files', files);
        }

        const response = await fetch(buildApiUrl('/api/upload'), {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: '上传失败' }));
          throw new Error(errorData.error || '上传失败');
        }

        const data = await response.json();
        showSuccess('文件上传成功！');
        return data;
      } catch (error) {
        console.error('文件上传失败:', error);
        showError(error.message || '文件上传失败');
        throw error;
      } finally {
        setLoading(false);
      }
    },
  };

  return {
    loading,
    callApi,
    art: artApi,
    activity: activityApi,
    feedback: feedbackApi,
    user: userApi,
    admin: adminApi,
    search: searchApi,
    upload: uploadApi,
  };
};
