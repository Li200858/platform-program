// 最简API调用Hook
import { useState, useCallback } from 'react';
import { buildApiUrl } from '../utils/apiUrl';

export const useApiMinimal = () => {
  const [loading, setLoading] = useState(false);

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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API调用失败:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 艺术相关API
  const art = {
    getList: (category = '', sort = '') => {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (sort) params.append('sort', sort);
      const query = params.toString();
      return callApi(`/api/art${query ? `?${query}` : ''}`);
    },
    getById: (id) => callApi(`/api/art/${id}`),
    getMyWorks: (authorName) => callApi(`/api/art/my-works?authorName=${encodeURIComponent(authorName)}`),
    create: (data) => callApi('/api/art', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => callApi(`/api/art/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => callApi(`/api/art/${id}`, { method: 'DELETE' }),
    toggleLike: (id, userName) => callApi(`/api/art/${id}/like`, { 
      method: 'POST', 
      body: JSON.stringify({ userName }) 
    }),
    toggleFavorite: (id, userName) => callApi(`/api/art/${id}/favorite`, { 
      method: 'POST', 
      body: JSON.stringify({ userName }) 
    }),
    addComment: (id, data) => callApi(`/api/art/${id}/comment`, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  };

  // 活动相关API
  const activity = {
    getList: () => callApi('/api/activities'),
    getById: (id) => callApi(`/api/activities/${id}`),
    create: (data) => callApi('/api/activities', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => callApi(`/api/activities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => callApi(`/api/activities/${id}`, { method: 'DELETE' }),
    join: (id, userName) => callApi(`/api/activities/${id}/join`, { 
      method: 'POST', 
      body: JSON.stringify({ userName }) 
    }),
    leave: (id, userName) => callApi(`/api/activities/${id}/leave`, { 
      method: 'POST', 
      body: JSON.stringify({ userName }) 
    }),
  };

  // 反馈相关API
  const feedback = {
    getList: () => callApi('/api/feedback'),
    create: (data) => callApi('/api/feedback', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => callApi(`/api/feedback/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => callApi(`/api/feedback/${id}`, { method: 'DELETE' }),
  };

  // 用户相关API
  const user = {
    get: (userId) => callApi(`/api/user/${userId}`),
    getProfile: (userName) => callApi(`/api/user/${userName}`),
    updateProfile: (userName, data) => callApi(`/api/user/${userName}`, { method: 'PUT', body: JSON.stringify(data) }),
    checkAdmin: (userName) => callApi(`/api/user/${userName}/admin`),
  };

  // 管理员相关API
  const admin = {
    getUsers: () => callApi('/api/admin/users'),
    updateUser: (userId, data) => callApi(`/api/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteUser: (userId) => callApi(`/api/admin/users/${userId}`, { method: 'DELETE' }),
    getMaintenanceMode: () => callApi('/api/admin/maintenance'),
    setMaintenanceMode: (enabled) => callApi('/api/admin/maintenance', { method: 'POST', body: JSON.stringify({ enabled }) }),
  };

  // 搜索相关API
  const search = {
    search: (query) => callApi(`/api/search?q=${encodeURIComponent(query)}`),
  };

  // 上传相关API
  const upload = {
    uploadFile: (file, type) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      return callApi('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {}, // 让浏览器自动设置Content-Type
      });
    },
  };

  return {
    loading,
    art,
    activity,
    feedback,
    user,
    admin,
    search,
    upload,
  };
};
