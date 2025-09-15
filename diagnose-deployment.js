#!/usr/bin/env node

const https = require('https');
const http = require('http');

console.log('🔍 平台部署诊断工具');
console.log('============================================================');

const railwayUrl = 'https://platform-program-production.up.railway.app';

// 检查Railway后端
async function checkRailway() {
  console.log('🚀 检查Railway后端部署...');
  
  try {
    const healthResponse = await makeRequest(`${railwayUrl}/api/health`);
    console.log('✅ Railway健康检查成功:');
    console.log(JSON.stringify(healthResponse, null, 2));
    
    // 检查MongoDB连接
    if (healthResponse.mongodb && healthResponse.mongodb.status === 'connected') {
      console.log('✅ MongoDB连接正常');
    } else {
      console.log('❌ MongoDB连接异常');
    }
    
    // 检查API端点
    const artResponse = await makeRequest(`${railwayUrl}/api/art`);
    console.log(`✅ 艺术作品API正常，返回${artResponse.length}个作品`);
    
    return true;
  } catch (error) {
    console.log('❌ Railway后端检查失败:', error.message);
    return false;
  }
}

// 检查Vercel前端（如果已知URL）
async function checkVercel(vercelUrl) {
  if (!vercelUrl) {
    console.log('⚠️  未提供Vercel URL，跳过前端检查');
    return false;
  }
  
  console.log('🌐 检查Vercel前端部署...');
  
  try {
    const response = await makeRequest(vercelUrl);
    console.log('✅ Vercel前端部署正常');
    return true;
  } catch (error) {
    console.log('❌ Vercel前端检查失败:', error.message);
    return false;
  }
}

// 检查文件上传功能
async function checkFileUpload() {
  console.log('📁 检查文件上传功能...');
  
  try {
    // 创建一个简单的测试文件上传请求
    const testData = new FormData();
    testData.append('files', new Blob(['test content'], { type: 'text/plain' }), 'test.txt');
    
    const response = await fetch(`${railwayUrl}/api/upload`, {
      method: 'POST',
      body: testData
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ 文件上传功能正常');
      return true;
    } else {
      console.log('❌ 文件上传功能异常:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ 文件上传检查失败:', error.message);
    return false;
  }
}

// 通用HTTP请求函数
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          resolve({ raw: data });
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// 主诊断函数
async function diagnose() {
  console.log('开始诊断...\n');
  
  const railwayOk = await checkRailway();
  console.log('');
  
  // 检查环境变量
  console.log('🔧 检查环境变量配置...');
  console.log(`REACT_APP_API_URL: ${process.env.REACT_APP_API_URL || '未设置'}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || '未设置'}`);
  console.log('');
  
  // 检查文件上传
  await checkFileUpload();
  console.log('');
  
  // 总结
  console.log('📊 诊断总结:');
  console.log('============================================================');
  
  if (railwayOk) {
    console.log('✅ Railway后端: 正常运行');
  } else {
    console.log('❌ Railway后端: 存在问题');
  }
  
  console.log('');
  console.log('🔗 重要链接:');
  console.log(`- Railway后端: ${railwayUrl}`);
  console.log('- Vercel前端: 请在Vercel控制台查看');
  console.log('');
  console.log('📋 建议的修复步骤:');
  console.log('1. 确保Vercel环境变量REACT_APP_API_URL已设置');
  console.log('2. 检查Vercel部署日志');
  console.log('3. 测试前端API调用');
  console.log('4. 如有问题，运行: ./deploy-fix.sh');
}

// 运行诊断
diagnose().catch(console.error);
