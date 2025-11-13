// 简化的API工具函数
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://platform-program.onrender.com'  // 生产环境指向后端API服务
    : 'http://localhost:5000');

export const api = {
  // 通用fetch函数 - 简化版本，减少重试
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const timeout = options.timeout || 15000; // 增加到15秒超时
    const maxRetries = options.maxRetries || 1; // 减少重试次数
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          credentials: 'include',
          signal: controller.signal,
          ...options,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          // 如果是认证错误，立即抛出
          if (response.status === 401 || response.status === 403) {
            throw new Error(`认证失败: ${response.status}`);
          }
          // 其他错误，根据重试次数决定是否重试
          if (attempt < maxRetries && response.status >= 500) {
            console.warn(`请求失败，第${attempt}次重试:`, response.status);
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            continue;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn(`请求超时，第${attempt}次重试`);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            continue;
          }
          throw new Error('请求超时，请检查网络连接');
        }
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        console.warn(`请求失败，第${attempt}次重试:`, error.message);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  },

  // 艺术作品相关API
  art: {
    getAll: (tab, sort) => {
      const params = new URLSearchParams();
      if (tab) params.append('tab', tab);
      if (sort) params.append('sort', sort);
      return api.request(`/api/art?${params.toString()}`);
    },
    
    create: (data) => api.request('/api/art', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    like: (id, userId) => api.request(`/api/art/${id}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
    
    favorite: (id, userId) => api.request(`/api/art/${id}/favorite`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
    
    comment: (id, data) => api.request(`/api/art/${id}/comment`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    inviteCollaborator: (id, data) => api.request(`/api/art/${id}/collaborate`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    removeCollaborator: (id, username, removedBy) => api.request(`/api/art/${id}/collaborate/${username}`, {
      method: 'DELETE',
      body: JSON.stringify({ removedBy }),
    }),
    
    getMyWorks: (authorName) => api.request(`/api/art/my-works?authorName=${encodeURIComponent(authorName)}`),
    
    getFavorites: (authorName) => api.request(`/api/art/favorites?authorName=${encodeURIComponent(authorName)}`),
    
    getLikes: (authorName) => api.request(`/api/art/likes?authorName=${encodeURIComponent(authorName)}`),
    
    delete: (id, authorName, isAdmin) => api.request(`/api/art/${id}?authorName=${encodeURIComponent(authorName)}&isAdmin=${isAdmin}`, {
      method: 'DELETE',
    }),
  },

  // 活动相关API
  activity: {
    getAll: async () => {
      const data = await api.request('/api/activities');
      if (Array.isArray(data)) {
        return {
          items: data,
          serverTime: new Date().toISOString()
        };
      }
      if (data && Array.isArray(data.items)) {
        return {
          items: data.items,
          serverTime: data.serverTime || new Date().toISOString()
        };
      }
      return { items: [], serverTime: new Date().toISOString() };
    },
    
    create: (data) => api.request('/api/activities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    update: (id, data) => api.request(`/api/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
    like: (id, userId) => api.request(`/api/activities/${id}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
    
    favorite: (id, userId) => api.request(`/api/activities/${id}/favorite`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
    
    comment: (id, data) => api.request(`/api/activities/${id}/comment`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    delete: (id, authorName, isAdmin) => api.request(`/api/activities/${id}?authorName=${encodeURIComponent(authorName)}&isAdmin=${isAdmin}`, {
      method: 'DELETE',
    }),
  },

  time: () => api.request('/api/time'),

  // 反馈相关API
  feedback: {
    create: (data) => api.request('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    getMy: (authorName) => api.request(`/api/feedback/my?authorName=${encodeURIComponent(authorName)}`),
    
    reply: (id, data) => api.request(`/api/feedback/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  // 管理员反馈API
  adminFeedback: {
    getAll: () => api.request('/api/admin/feedback'),
    
    getById: (id) => api.request(`/api/admin/feedback/${id}`),
    
    reply: (id, data) => api.request(`/api/admin/feedback/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    markReceived: (id) => api.request(`/api/admin/feedback/${id}/received`, {
      method: 'POST',
    }),
  },

  // 搜索API
  search: (query) => api.request(`/api/search?q=${encodeURIComponent(query)}`),

  // 文件上传API
  upload: (formData) => {
    const url = `${API_BASE_URL}/api/upload`;
    return fetch(url, {
      method: 'POST',
      body: formData,
    }).then(response => response.json());
  },

  // 用户相关API
  user: {
    sync: (data) => api.request('/api/user/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    getByID: (userID) => api.request(`/api/user/${userID}`),
    
    checkName: (data) => api.request('/api/user/check-name', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  // 管理员相关API
  admin: {
    check: (userName) => api.request(`/api/admin/check?userName=${encodeURIComponent(userName)}`),
    
    getFeedbacks: () => api.request('/api/admin/feedback'),
    
    getUsers: () => api.request('/api/admin/users'),
    
    searchUsers: (query) => api.request(`/api/admin/search-users?q=${encodeURIComponent(query)}`),
    
    addAdmin: (data) => api.request('/api/admin/add-admin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    removeAdmin: (data) => api.request('/api/admin/remove-admin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    setSuperAdmin: (data) => api.request('/api/admin/set-super-admin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    removeSuperAdmin: (data) => api.request('/api/admin/remove-super-admin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  // 维护模式相关API
  maintenance: {
    getStatus: () => api.request('/api/maintenance/status'),
    enable: (data) => api.request('/api/admin/maintenance/enable', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    disable: () => api.request('/api/admin/maintenance/disable', {
      method: 'POST',
    }),
  },



  notifications: {
    getNotifications: (username) => api.request(`/api/notifications/${encodeURIComponent(username)}`),
    markAsRead: (id) => api.request(`/api/notifications/${id}/read`, {
      method: 'PUT',
    }),
    markAllAsRead: (username) => api.request(`/api/notifications/${encodeURIComponent(username)}/read-all`, {
      method: 'PUT',
    }),
    create: (data) => api.request('/api/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },


  // 作品集功能API
  portfolio: {
    create: (data) => api.request('/api/portfolio', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getUserPortfolios: (username) => api.request(`/api/portfolio/user/${username}`),
    getPublicPortfolios: () => api.request('/api/portfolio/public'),
    getPortfolio: (id) => api.request(`/api/portfolio/${id}`),
    update: (id, data) => api.request(`/api/portfolio/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id, authorName, isAdmin) => api.request(`/api/portfolio/${id}?authorName=${encodeURIComponent(authorName)}&isAdmin=${isAdmin}`, {
      method: 'DELETE',
    }),
    addWork: (id, data) => api.request(`/api/portfolio/${id}/works`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    removeWork: (id, workId) => api.request(`/api/portfolio/${id}/works/${workId}`, {
      method: 'DELETE',
    }),
    uploadContent: (formData) => {
      const url = `${API_BASE_URL}/api/portfolio/upload-content`;
      return fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      }).then(response => response.json());
    },
  },

  // 学习资料库API
  resources: {
    getAll: () => api.request('/api/resources'),
    getCategories: () => api.request('/api/resources/categories'),
    upload: (formData) => {
      const url = `${API_BASE_URL}/api/resources/upload`;
      return fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      }).then(response => response.json());
    },
    delete: (id) => api.request(`/api/resources/${id}`, {
      method: 'DELETE',
    }),
    download: (id) => api.request(`/api/resources/${id}/download`),
  },

  // 搜索功能API
  search: {
    global: (query, type = 'all', limit = 20) => {
      const params = new URLSearchParams();
      params.append('q', query);
      params.append('type', type);
      params.append('limit', limit.toString());
      return api.request(`/api/search?${params.toString()}`);
    },
    users: (query) => api.request(`/api/users/search?q=${encodeURIComponent(query)}`),
  },
};

export default api;