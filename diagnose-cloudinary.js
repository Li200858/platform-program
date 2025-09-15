#!/usr/bin/env node

// Cloudinary连接诊断脚本
const https = require('https');

const RAILWAY_URL = 'https://platform-program-production.up.railway.app';

console.log('🔍 Cloudinary连接诊断...');
console.log('目标URL:', RAILWAY_URL);

// 检查存储配置
function checkStorageConfig() {
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
          console.log('✅ 存储配置响应:');
          console.log(JSON.stringify(result, null, 2));
          
          // 分析配置
          console.log('');
          console.log('🔍 配置分析:');
          console.log('- 当前存储类型:', result.storageType);
          console.log('- Cloudinary配置状态:', result.cloudinary.configured ? '✅ 已配置' : '❌ 未配置');
          console.log('- Cloudinary云名称:', result.cloudinary.cloudName || '未设置');
          
          if (result.storageType === 'cloudinary') {
            console.log('🎉 Cloudinary已激活！');
          } else if (result.cloudinary.configured) {
            console.log('⚠️  Cloudinary已配置但未激活');
            console.log('可能的原因:');
            console.log('1. 环境变量设置不完整');
            console.log('2. 需要重新部署');
            console.log('3. 代码逻辑问题');
          } else {
            console.log('❌ Cloudinary未配置');
            console.log('需要在Railway中设置环境变量:');
            console.log('- CLOUDINARY_CLOUD_NAME=dpilqeizp');
            console.log('- CLOUDINARY_API_KEY=245415752342533');
            console.log('- CLOUDINARY_API_SECRET=F1yztt8X_DpVS_iXAnQaYi1zzb4');
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

// 检查健康状态
function checkHealth() {
  return new Promise((resolve, reject) => {
    const url = `${RAILWAY_URL}/api/health`;
    console.log('🏥 检查健康状态:', url);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ 健康检查响应:');
          console.log(JSON.stringify(result, null, 2));
          resolve(result);
        } catch (error) {
          console.log('❌ 健康检查响应解析失败:');
          console.log('原始响应:', data);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.log('❌ 健康检查请求失败:', error.message);
      reject(error);
    });
  });
}

// 运行诊断
async function runDiagnosis() {
  console.log('='.repeat(60));
  console.log('开始Cloudinary连接诊断...');
  console.log('='.repeat(60));
  
  try {
    await checkHealth();
    console.log('');
    await checkStorageConfig();
    
    console.log('');
    console.log('='.repeat(60));
    console.log('🎯 诊断完成！');
    console.log('='.repeat(60));
    
    console.log('');
    console.log('💡 下一步建议:');
    console.log('1. 如果Cloudinary未激活，请检查Railway环境变量设置');
    console.log('2. 确保所有三个环境变量都已设置');
    console.log('3. 设置完成后等待Railway重新部署');
    console.log('4. 重新运行此脚本验证结果');
    
  } catch (error) {
    console.log('');
    console.log('='.repeat(60));
    console.log('❌ 诊断失败');
    console.log('错误:', error.message);
    console.log('='.repeat(60));
  }
}

runDiagnosis();
