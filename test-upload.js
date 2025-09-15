#!/usr/bin/env node

// 测试文件上传功能
const https = require('https');
const FormData = require('form-data');
const fs = require('fs');

const RAILWAY_URL = 'https://platform-program-production.up.railway.app';

console.log('📤 测试文件上传功能...');
console.log('目标URL:', RAILWAY_URL);

// 创建一个测试文件
const testContent = 'Hello Cloudinary Test!';
const testFileName = 'test-upload.txt';
fs.writeFileSync(testFileName, testContent);

// 测试文件上传
function testFileUpload() {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('files', fs.createReadStream(testFileName), {
      filename: testFileName,
      contentType: 'text/plain'
    });

    const options = {
      hostname: 'platform-program-production.up.railway.app',
      port: 443,
      path: '/api/upload',
      method: 'POST',
      headers: form.getHeaders()
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ 文件上传成功:');
          console.log(JSON.stringify(result, null, 2));
          
          // 检查返回的URL格式
          if (result.urls && result.urls.length > 0) {
            const url = result.urls[0];
            console.log('');
            console.log('🔍 URL分析:');
            console.log('- 返回的URL:', url);
            console.log('- 存储类型:', result.storage);
            console.log('- 是否为完整URL:', url.startsWith('http'));
            
            if (url.startsWith('http')) {
              console.log('✅ 返回的是完整URL（Cloudinary）');
            } else {
              console.log('⚠️  返回的是相对路径（本地存储）');
            }
          }
          
          resolve(result);
        } catch (error) {
          console.log('❌ 文件上传响应解析失败:');
          console.log('原始响应:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ 文件上传请求失败:', error.message);
      reject(error);
    });

    form.pipe(req);
  });
}

// 清理测试文件
function cleanup() {
  try {
    fs.unlinkSync(testFileName);
    console.log('🧹 测试文件已清理');
  } catch (error) {
    console.log('⚠️  清理测试文件失败:', error.message);
  }
}

// 运行测试
async function runTest() {
  console.log('='.repeat(60));
  console.log('开始测试文件上传...');
  console.log('='.repeat(60));
  
  try {
    await testFileUpload();
    
    console.log('');
    console.log('='.repeat(60));
    console.log('🎉 文件上传测试完成！');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.log('');
    console.log('='.repeat(60));
    console.log('❌ 文件上传测试失败');
    console.log('错误:', error.message);
    console.log('='.repeat(60));
  } finally {
    cleanup();
  }
}

runTest();
