#!/usr/bin/env node

// Railway部署测试脚本
const https = require('https');

// 请替换为您的实际Railway URL
const RAILWAY_URL = process.env.RAILWAY_URL || 'https://your-app.railway.app';

console.log('🚀 测试Railway部署状态...');
console.log('目标URL:', RAILWAY_URL);

// 测试健康检查端点
function testHealthCheck() {
  return new Promise((resolve, reject) => {
    const url = `${RAILWAY_URL}/api/health`;
    console.log('📊 测试健康检查端点:', url);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ 健康检查成功:');
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

// 测试根路径
function testRootPath() {
  return new Promise((resolve, reject) => {
    const url = `${RAILWAY_URL}/`;
    console.log('🏠 测试根路径:', url);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ 根路径测试成功:');
          console.log(JSON.stringify(result, null, 2));
          resolve(result);
        } catch (error) {
          console.log('❌ 根路径响应解析失败:');
          console.log('原始响应:', data);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.log('❌ 根路径请求失败:', error.message);
      reject(error);
    });
  });
}

// 测试API端点
function testAPIEndpoint() {
  return new Promise((resolve, reject) => {
    const url = `${RAILWAY_URL}/api/art`;
    console.log('🎨 测试API端点:', url);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ API端点测试成功:');
          console.log('返回数据条数:', Array.isArray(result) ? result.length : 'N/A');
          console.log('数据类型:', typeof result);
          resolve(result);
        } catch (error) {
          console.log('❌ API端点响应解析失败:');
          console.log('原始响应:', data);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.log('❌ API端点请求失败:', error.message);
      reject(error);
    });
  });
}

// 运行所有测试
async function runTests() {
  console.log('='.repeat(50));
  console.log('开始测试Railway部署...');
  console.log('='.repeat(50));
  
  try {
    await testHealthCheck();
    console.log('');
    
    await testRootPath();
    console.log('');
    
    await testAPIEndpoint();
    console.log('');
    
    console.log('='.repeat(50));
    console.log('🎉 所有测试完成！');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.log('='.repeat(50));
    console.log('❌ 测试失败:', error.message);
    console.log('='.repeat(50));
    process.exit(1);
  }
}

// 检查是否提供了Railway URL
if (RAILWAY_URL === 'https://your-app.railway.app') {
  console.log('⚠️  请设置RAILWAY_URL环境变量或修改脚本中的URL');
  console.log('使用方法: RAILWAY_URL=https://your-app.railway.app node test-railway.js');
  process.exit(1);
}

runTests();
