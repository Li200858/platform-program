#!/usr/bin/env node

// 检查Railway环境变量配置状态
const https = require('https');

const RAILWAY_URL = 'https://platform-program-production.up.railway.app';

console.log('🔍 检查Railway环境变量配置状态...');
console.log('目标URL:', RAILWAY_URL);

// 检查环境变量配置
function checkEnvironmentVariables() {
  return new Promise((resolve, reject) => {
    const url = `${RAILWAY_URL}/api/env-check`;
    console.log('📊 检查环境变量:', url);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ 环境变量检查成功:');
          console.log(JSON.stringify(result, null, 2));
          
          // 检查Cloudinary相关环境变量
          if (result.env) {
            console.log('');
            console.log('☁️  Cloudinary环境变量状态:');
            console.log('- CLOUDINARY_CLOUD_NAME:', result.env.CLOUDINARY_CLOUD_NAME || '未设置');
            console.log('- CLOUDINARY_API_KEY:', result.env.CLOUDINARY_API_KEY ? '已设置' : '未设置');
            console.log('- CLOUDINARY_API_SECRET:', result.env.CLOUDINARY_API_SECRET ? '已设置' : '未设置');
            
            // 检查MongoDB
            console.log('');
            console.log('🗄️  MongoDB环境变量状态:');
            console.log('- MONGODB_URI:', result.env.MONGODB_URI || '未设置');
            
            // 检查其他重要变量
            console.log('');
            console.log('⚙️  其他环境变量:');
            console.log('- NODE_ENV:', result.env.NODE_ENV || '未设置');
            console.log('- PORT:', result.env.PORT || '未设置');
          }
          
          resolve(result);
        } catch (error) {
          console.log('❌ 环境变量检查响应解析失败:');
          console.log('原始响应:', data);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.log('❌ 环境变量检查请求失败:', error.message);
      reject(error);
    });
  });
}

// 运行检查
async function runCheck() {
  console.log('='.repeat(60));
  console.log('开始检查环境变量配置...');
  console.log('='.repeat(60));
  
  try {
    await checkEnvironmentVariables();
    
    console.log('');
    console.log('='.repeat(60));
    console.log('🎉 环境变量检查完成！');
    console.log('='.repeat(60));
    
    console.log('');
    console.log('💡 如果Cloudinary环境变量未设置，请：');
    console.log('1. 登录Railway控制台');
    console.log('2. 进入项目设置 > Variables');
    console.log('3. 添加以下环境变量：');
    console.log('   - CLOUDINARY_API_KEY: 您的API密钥');
    console.log('   - CLOUDINARY_API_SECRET: 您的API密钥');
    console.log('4. 重新部署项目');
    
  } catch (error) {
    console.log('');
    console.log('='.repeat(60));
    console.log('❌ 环境变量检查失败');
    console.log('错误:', error.message);
    console.log('='.repeat(60));
  }
}

runCheck();
