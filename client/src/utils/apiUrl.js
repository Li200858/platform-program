// API URL工具函数
export const getApiUrl = () => {
  // 优先使用环境变量
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 根据环境自动选择
  if (process.env.NODE_ENV === 'production') {
    return 'https://platform-program-production.up.railway.app';
  }
  
  // 开发环境
  return 'http://localhost:5000';
};

// 构建完整的API URL
export const buildApiUrl = (endpoint) => {
  if (!endpoint) return getApiUrl();
  
  const baseUrl = getApiUrl();
  if (endpoint.startsWith('/')) {
    return `${baseUrl}${endpoint}`;
  }
  return `${baseUrl}/${endpoint}`;
};

// 构建文件URL
export const buildFileUrl = (filePath) => {
  if (!filePath) return '';
  
  // 如果已经是完整URL，直接返回
  if (filePath.startsWith('http')) {
    return filePath;
  }
  
  // 如果是Cloudinary的public_id，构建Cloudinary URL
  if (filePath.startsWith('platform-program/')) {
    return `https://res.cloudinary.com/dpilqeizp/image/upload/${filePath}`;
  }
  
  // 如果是旧的本地路径，尝试从Cloudinary获取
  if (filePath.startsWith('/uploads/')) {
    // 提取文件名并尝试从Cloudinary获取
    const fileName = filePath.split('/').pop();
    return `https://res.cloudinary.com/dpilqeizp/image/upload/platform-program/${fileName}`;
  }
  
  // 其他情况，构建完整URL
  const baseUrl = getApiUrl();
  if (filePath.startsWith('/')) {
    return `${baseUrl}${filePath}`;
  }
  return `${baseUrl}/${filePath}`;
};

export default {
  getApiUrl,
  buildApiUrl,
  buildFileUrl
};
