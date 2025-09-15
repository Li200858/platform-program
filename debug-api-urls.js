#!/usr/bin/env node

// 模拟前端环境变量
process.env.NODE_ENV = 'production';
process.env.REACT_APP_API_URL = 'https://platform-program-production.up.railway.app';

// 模拟API URL工具函数
const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  if (process.env.NODE_ENV === 'production') {
    return 'https://platform-program-production.up.railway.app';
  }
  
  return 'http://localhost:5000';
};

const buildApiUrl = (endpoint) => {
  if (!endpoint) return getApiUrl();
  
  const baseUrl = getApiUrl();
  if (endpoint.startsWith('/')) {
    return `${baseUrl}${endpoint}`;
  }
  return `${baseUrl}/${endpoint}`;
};

const buildFileUrl = (filePath) => {
  if (!filePath) return '';
  
  if (filePath.startsWith('http')) {
    return filePath;
  }
  
  const baseUrl = getApiUrl();
  if (filePath.startsWith('/')) {
    return `${baseUrl}${filePath}`;
  }
  return `${baseUrl}/${filePath}`;
};

console.log('🔍 API URL调试工具');
console.log('==========================================');

console.log('环境变量:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`REACT_APP_API_URL: ${process.env.REACT_APP_API_URL}`);

console.log('\nAPI URL构建测试:');
console.log(`getApiUrl(): ${getApiUrl()}`);
console.log(`buildApiUrl('/api/upload'): ${buildApiUrl('/api/upload')}`);
console.log(`buildApiUrl('/api/art'): ${buildApiUrl('/api/art')}`);

console.log('\n文件URL构建测试:');
const testFiles = [
  '/uploads/1757977489400-399788432-test.txt',
  '/uploads/image.png',
  'uploads/file.jpg',
  'https://example.com/file.jpg'
];

testFiles.forEach(file => {
  console.log(`buildFileUrl('${file}'): ${buildFileUrl(file)}`);
});

console.log('\n🧪 测试实际API调用:');
const https = require('https');

async function testApiCall() {
  try {
    const uploadUrl = buildApiUrl('/api/upload');
    console.log(`测试上传API: ${uploadUrl}`);
    
    // 测试健康检查
    const healthUrl = buildApiUrl('/api/health');
    console.log(`测试健康检查: ${healthUrl}`);
    
    const healthResponse = await fetch(healthUrl);
    if (healthResponse.ok) {
      const data = await healthResponse.json();
      console.log('✅ 健康检查成功:', data.status);
    } else {
      console.log('❌ 健康检查失败:', healthResponse.status);
    }
    
  } catch (error) {
    console.log('❌ API测试失败:', error.message);
  }
}

testApiCall();
