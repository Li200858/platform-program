#!/usr/bin/env node

// 最小化文件上传测试
const https = require('https');

const RAILWAY_URL = 'https://platform-program-production.up.railway.app';

console.log('📤 最小化文件上传测试...');

// 创建一个简单的测试文件
const testContent = 'Hello Test!';
const testFileName = 'test-minimal.txt';

const fs = require('fs');
fs.writeFileSync(testFileName, testContent);

// 使用简单的multipart/form-data
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

console.log('发送请求...');

const req = https.request(options, (res) => {
  console.log('响应状态码:', res.statusCode);
  console.log('响应头:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('响应内容:', data);
    
    if (res.statusCode === 200) {
      try {
        const result = JSON.parse(data);
        console.log('✅ 文件上传成功!');
        console.log('返回结果:', JSON.stringify(result, null, 2));
      } catch (error) {
        console.log('❌ 响应解析失败:', error.message);
      }
    } else {
      console.log('❌ 文件上传失败，状态码:', res.statusCode);
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
