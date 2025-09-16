// 常量定义
export const ART_TABS = [
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

// 保持向后兼容
export const ART_CATEGORIES = ART_TABS;

export const SORT_OPTIONS = [
  { key: 'time', label: '按时间排序' },
  { key: 'hot', label: '按热度排序' }
];

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  FOUNDER: 'founder'
};

export const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  LIKED_ART_IDS: 'liked_art_ids',
  FAVORITE_ART_IDS: 'favorite_art_ids',
  LIKED_ACTIVITY_IDS: 'liked_activity_ids',
  FAVORITE_ACTIVITY_IDS: 'favorite_activity_ids',
  NAME_LOCKED: 'name_locked'
};

export const API_ENDPOINTS = {
  ART: '/api/art',
  ACTIVITIES: '/api/activities',
  FEEDBACK: '/api/feedback',
  UPLOAD: '/api/upload',
  ADMIN: '/api/admin',
  USER: '/api/user',
  SEARCH: '/api/search'
};
