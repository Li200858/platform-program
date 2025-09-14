// API工具函数
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? ''  // 生产环境使用相对路径
    : 'http://localhost:5000');  // 开发环境使用完整URL

export const api = {
  // 通用fetch函数
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
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
    
    return response.json();
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
    
    getMyWorks: (authorName) => api.request(`/api/art/my-works?authorName=${encodeURIComponent(authorName)}`),
    
    getFavorites: (authorName) => api.request(`/api/art/favorites?authorName=${encodeURIComponent(authorName)}`),
    
    getLikes: (authorName) => api.request(`/api/art/likes?authorName=${encodeURIComponent(authorName)}`),
    
    delete: (id, authorName) => api.request(`/api/art/${id}?authorName=${encodeURIComponent(authorName)}`, {
      method: 'DELETE',
    }),
  },

  // 反馈相关API
  feedback: {
    create: (data) => api.request('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
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
    
    getMaintenanceStatus: () => api.request('/api/admin/maintenance/status'),
    
    toggleMaintenance: (data) => api.request('/api/admin/maintenance/toggle', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  // 身份验证API
  verifyIdentity: (data) => api.request('/api/verify-identity', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export default api;
