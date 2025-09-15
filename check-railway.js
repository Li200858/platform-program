#!/usr/bin/env node

// 检查Railway线上部署状态
const https = require('https');

// 请替换为您的实际Railway URL
const RAILWAY_URL = process.env.RAILWAY_URL || 'https://your-app.railway.app';

console.log('🚀 检查Railway线上部署状态...');
console.log('目标URL:', RAILWAY_URL);

if (RAILWAY_URL === 'https://your-app.railway.app') {
  console.log('⚠️  请设置RAILWAY_URL环境变量');
  console.log('使用方法: RAILWAY_URL=https://your-app.railway.app node check-railway.js');
  console.log('');
  console.log('或者直接在浏览器中访问您的Railway URL:');
  console.log('- 健康检查: https://your-app.railway.app/api/health');
  console.log('- 根路径: https://your-app.railway.app/');
  console.log('- 艺术作品API: https://your-app.railway.app/api/art');
  process.exit(0);
}

// 测试健康检查端点
function checkHealth() {
  return new Promise((resolve, reject) => {
    const url = `${RAILWAY_URL}/api/health`;
    console.log('📊 检查健康检查端点:', url);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ 线上健康检查成功:');
          console.log(JSON.stringify(result, null, 2));
          
          // 检查MongoDB连接状态
          if (result.mongodb) {
            console.log('📊 MongoDB状态:', result.mongodb.status);
            if (result.mongodb.status === 'connected') {
              console.log('✅ MongoDB连接正常');
            } else {
              console.log('⚠️  MongoDB连接异常');
            }
          }
          
          resolve(result);
        } catch (error) {
          console.log('❌ 健康检查响应解析失败:');
          console.log('原始响应:', data);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.log('❌ 健康检查请求失败:', error.message);
      console.log('可能的原因:');
      console.log('1. Railway URL不正确');
      console.log('2. 服务未启动');
      console.log('3. 网络连接问题');
      reject(error);
    });
  });
}

// 运行检查
async function runCheck() {
  console.log('='.repeat(60));
  console.log('开始检查Railway线上部署...');
  console.log('='.repeat(60));
  
  try {
    await checkHealth();
    console.log('');
    console.log('='.repeat(60));
    console.log('🎉 Railway线上部署检查完成！');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.log('');
    console.log('='.repeat(60));
    console.log('❌ Railway线上部署检查失败');
    console.log('错误:', error.message);
    console.log('='.repeat(60));
    console.log('');
    console.log('请检查:');
    console.log('1. Railway URL是否正确');
    console.log('2. 服务是否正在运行');
    console.log('3. 环境变量是否正确设置');
    console.log('4. 查看Railway控制台的日志');
  }
}

runCheck();
