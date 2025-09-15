#!/usr/bin/env node

// 测试Cloudinary连接
const https = require('https');

const RAILWAY_URL = 'https://platform-program-production.up.railway.app';

console.log('☁️  测试Cloudinary连接状态...');
console.log('目标URL:', RAILWAY_URL);

// 测试存储配置
function testStorageConfig() {
  return new Promise((resolve, reject) => {
    const url = `${RAILWAY_URL}/api/storage-config`;
    console.log('📊 检查存储配置:', url);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ 存储配置获取成功:');
          console.log(JSON.stringify(result, null, 2));
          
          // 检查Cloudinary配置
          if (result.cloudinary) {
            console.log('');
            console.log('☁️  Cloudinary配置状态:');
            console.log('- 已配置:', result.cloudinary.configured ? '✅ 是' : '❌ 否');
            console.log('- 云名称:', result.cloudinary.cloudName || '未设置');
            
            if (result.cloudinary.configured) {
              console.log('✅ Cloudinary已正确配置');
            } else {
              console.log('⚠️  Cloudinary未完全配置');
              console.log('需要设置的环境变量:');
              console.log('- CLOUDINARY_CLOUD_NAME');
              console.log('- CLOUDINARY_API_KEY');
              console.log('- CLOUDINARY_API_SECRET');
            }
          }
          
          // 检查当前存储类型
          console.log('');
          console.log('📁 当前存储类型:', result.storageType);
          if (result.storageType === 'local') {
            console.log('ℹ️  当前使用本地存储');
          } else if (result.storageType === 'cloudinary') {
            console.log('☁️  当前使用Cloudinary存储');
          }
          
          resolve(result);
        } catch (error) {
          console.log('❌ 存储配置响应解析失败:');
          console.log('原始响应:', data);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.log('❌ 存储配置请求失败:', error.message);
      reject(error);
    });
  });
}

// 测试文件上传功能
function testFileUpload() {
  return new Promise((resolve, reject) => {
    console.log('');
    console.log('📤 测试文件上传功能...');
    console.log('注意: 这需要实际的POST请求，当前只检查端点是否可访问');
    
    const url = `${RAILWAY_URL}/api/upload`;
    console.log('上传端点:', url);
    
    // 这里只是检查端点是否存在，不进行实际上传
    https.get(url, (res) => {
      if (res.statusCode === 405) {
        console.log('✅ 上传端点存在 (返回405 Method Not Allowed是正常的)');
        resolve(true);
      } else {
        console.log('⚠️  上传端点响应异常:', res.statusCode);
        resolve(false);
      }
    }).on('error', (error) => {
      console.log('❌ 上传端点检查失败:', error.message);
      reject(error);
    });
  });
}

// 运行测试
async function runTests() {
  console.log('='.repeat(60));
  console.log('开始测试Cloudinary连接...');
  console.log('='.repeat(60));
  
  try {
    await testStorageConfig();
    await testFileUpload();
    
    console.log('');
    console.log('='.repeat(60));
    console.log('🎉 Cloudinary连接测试完成！');
    console.log('='.repeat(60));
    
    console.log('');
    console.log('💡 提示:');
    console.log('1. 如果Cloudinary未配置，系统会使用本地存储');
    console.log('2. 要启用Cloudinary，请在Railway环境变量中设置:');
    console.log('   - CLOUDINARY_CLOUD_NAME');
    console.log('   - CLOUDINARY_API_KEY');
    console.log('   - CLOUDINARY_API_SECRET');
    console.log('3. 设置完成后重新部署即可');
    
  } catch (error) {
    console.log('');
    console.log('='.repeat(60));
    console.log('❌ Cloudinary连接测试失败');
    console.log('错误:', error.message);
    console.log('='.repeat(60));
  }
}

runTests();
