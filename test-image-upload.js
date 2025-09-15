#!/usr/bin/env node

// 测试图片上传
const https = require('https');

const RAILWAY_URL = 'https://platform-program-production.up.railway.app';

console.log('🖼️ 测试图片上传...');

// 创建一个简单的测试图片（1x1像素的PNG）
const testImageData = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // bit depth, color type, etc.
  0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
  0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, // compressed data
  0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0x00, 0x00, // more compressed data
  0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, // IEND chunk
  0x60, 0x82
]);

const testFileName = 'test-image.png';

const fs = require('fs');
fs.writeFileSync(testFileName, testImageData);

// 使用multipart/form-data上传
const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
const formData = `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${testFileName}"\r\nContent-Type: image/png\r\n\r\n${testImageData}\r\n--${boundary}--\r\n`;

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

console.log('发送图片上传请求...');

const req = https.request(options, (res) => {
  console.log('响应状态码:', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('响应内容:', data);
    
    if (res.statusCode === 200) {
      try {
        const result = JSON.parse(data);
        console.log('✅ 图片上传成功!');
        console.log('返回结果:', JSON.stringify(result, null, 2));
        
        if (result.urls && result.urls.length > 0) {
          const url = result.urls[0];
          console.log('');
          console.log('🔍 图片URL分析:');
          console.log('- 完整URL:', RAILWAY_URL + url);
          console.log('- 文件扩展名:', url.split('.').pop());
          console.log('- 是否为图片:', ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(url.split('.').pop().toLowerCase()));
          
          // 测试图片访问
          console.log('');
          console.log('🖼️ 测试图片访问...');
          const imageUrl = RAILWAY_URL + url;
          https.get(imageUrl, (imgRes) => {
            console.log('图片访问状态码:', imgRes.statusCode);
            console.log('图片Content-Type:', imgRes.headers['content-type']);
            if (imgRes.statusCode === 200) {
              console.log('✅ 图片可以正常访问!');
            } else {
              console.log('❌ 图片访问失败');
            }
          }).on('error', (error) => {
            console.log('❌ 图片访问错误:', error.message);
          });
        }
      } catch (error) {
        console.log('❌ 响应解析失败:', error.message);
      }
    } else {
      console.log('❌ 图片上传失败，状态码:', res.statusCode);
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
