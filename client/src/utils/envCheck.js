// 环境变量检查和诊断工具
export const checkEnvironment = () => {
  const env = {
    NODE_ENV: process.env.NODE_ENV,
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development'
  };
  
  console.log('🔍 环境变量检查:', env);
  
  // 检查关键环境变量
  const warnings = [];
  const errors = [];
  
  if (!env.REACT_APP_API_URL) {
    // 在生产环境中，如果没有设置环境变量但有回退机制，只显示警告而不是错误
    if (env.isProduction) {
      warnings.push('REACT_APP_API_URL 环境变量未设置，使用默认Railway URL');
    } else {
      errors.push('REACT_APP_API_URL 环境变量未设置');
    }
  } else if (env.REACT_APP_API_URL.includes('localhost')) {
    warnings.push('REACT_APP_API_URL 指向localhost，生产环境应该指向Railway');
  }
  
  // 移除生产环境的强制错误检查，因为代码有回退机制
  
  if (errors.length > 0) {
    console.error('❌ 环境配置错误:', errors);
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️ 环境配置警告:', warnings);
  }
  
  return {
    env,
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// 获取API基础URL
export const getApiBaseUrl = () => {
  const envCheck = checkEnvironment();
  
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  if (process.env.NODE_ENV === 'production') {
    return 'https://platform-program-production.up.railway.app';
  }
  
  return 'http://localhost:5000';
};

// 测试API连接
export const testApiConnection = async () => {
  const apiUrl = getApiBaseUrl();
  console.log('🧪 测试API连接:', apiUrl);
  
  try {
    const response = await fetch(`${apiUrl}/api/health`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API连接成功:', data);
      return { success: true, data };
    } else {
      console.error('❌ API连接失败:', response.status, response.statusText);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.error('❌ API连接错误:', error);
    return { success: false, error: error.message };
  }
};

// 在应用启动时自动检查
if (typeof window !== 'undefined') {
  // 只在浏览器环境中运行
  setTimeout(() => {
    const envResult = checkEnvironment();
    // 只有在环境检查通过或只是警告时才测试API连接
    if (envResult.isValid || envResult.warnings.length > 0) {
      testApiConnection();
    }
  }, 1000);
}

export default {
  checkEnvironment,
  getApiBaseUrl,
  testApiConnection
};
