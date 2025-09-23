// 简化的API工具函数
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://platform-program.onrender.com' 
    : 'http://localhost:5000');

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
    getAll: () => api.request('/api/activities'),
    
    create: (data) => api.request('/api/activities', {
      method: 'POST',
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

  // 用户互动功能API
  messages: {
    send: (data) => api.request('/api/messages/send', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getMessages: (username) => api.request(`/api/messages/${username}`),
    getConversation: (username1, username2) => api.request(`/api/messages/${username1}/${username2}`),
  },

  follow: {
    follow: (data) => api.request('/api/follow', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    unfollow: (follower, following) => api.request(`/api/follow/${follower}/${following}`, {
      method: 'DELETE',
    }),
    getFollowing: (username) => api.request(`/api/follow/following/${username}`),
    getFollowers: (username) => api.request(`/api/follow/followers/${username}`),
    getStatus: (follower, following) => api.request(`/api/follow/status/${follower}/${following}`),
  },

  notifications: {
    getNotifications: (username) => api.request(`/api/notifications/${username}`),
    markAsRead: (id) => api.request(`/api/notifications/${id}/read`, {
      method: 'PUT',
    }),
    markAllAsRead: (username) => api.request(`/api/notifications/${username}/read-all`, {
      method: 'PUT',
    }),
  },

  // 团队协作功能API
  teams: {
    create: (data) => api.request('/api/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getUserTeams: (username) => api.request(`/api/teams/user/${username}`),
    getTeam: (id) => api.request(`/api/teams/${id}`),
    inviteUser: (teamId, data) => api.request(`/api/teams/${teamId}/invite`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    joinTeam: (teamId, data) => api.request(`/api/teams/${teamId}/join`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    processJoinRequest: (teamId, requestId, data) => api.request(`/api/teams/${teamId}/join-requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    disbandTeam: (teamId, data) => api.request(`/api/teams/${teamId}`, {
      method: 'DELETE',
      body: JSON.stringify(data),
    }),
    createProject: (teamId, data) => api.request(`/api/teams/${teamId}/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateProject: (teamId, projectId, data) => api.request(`/api/teams/${teamId}/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
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