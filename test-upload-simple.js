#!/usr/bin/env node

// 简单的文件上传测试
const https = require('https');

const RAILWAY_URL = 'https://platform-program-production.up.railway.app';

console.log('📤 测试文件上传...');

// 创建一个简单的测试文件
const testContent = 'Hello Cloudinary Test!';
const testFileName = 'test-simple.txt';

const fs = require('fs');
fs.writeFileSync(testFileName, testContent);

// 使用multipart/form-data上传
const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
const formData = `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${testFileName}"\r\nContent-Type: text/plain\r\n\r\n${testContent}\r\n--${boundary}--\r\n`;

const options = {
  hostname: 'platform-program-production.up.railway.app',
  port: 443,
  path: '/api/upload',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(formData)
  }
};

console.log('发送请求到:', RAILWAY_URL + '/api/upload');

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('响应状态码:', res.statusCode);
    console.log('响应头:', res.headers);
    console.log('响应内容:', data);
    
    try {
      const result = JSON.parse(data);
      console.log('解析后的响应:', JSON.stringify(result, null, 2));
      
      if (result.urls && result.urls.length > 0) {
        const url = result.urls[0];
        console.log('');
        console.log('🔍 URL分析:');
        console.log('- 返回的URL:', url);
        console.log('- 存储类型:', result.storage);
        console.log('- 是否为完整URL:', url.startsWith('http'));
        
        if (url.startsWith('http')) {
          console.log('✅ 成功！返回的是Cloudinary完整URL');
        } else {
          console.log('❌ 问题：返回的是相对路径，不是Cloudinary URL');
        }
      }
    } catch (error) {
      console.log('❌ 响应解析失败:', error.message);
    }
    
    // 清理测试文件
    try {
      fs.unlinkSync(testFileName);
      console.log('🧹 测试文件已清理');
    } catch (error) {
      console.log('⚠️  清理测试文件失败:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ 请求失败:', error.message);
  
  // 清理测试文件
  try {
    fs.unlinkSync(testFileName);
  } catch (cleanupError) {
    console.log('⚠️  清理测试文件失败:', cleanupError.message);
  }
});

req.write(formData);
req.end();
