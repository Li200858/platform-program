const fs = require('fs');
const http = require('http');

// 创建测试文件
function createTestFile() {
  const testContent = `测试文件内容 - ${new Date().toISOString()}`;
  fs.writeFileSync('./test-file.txt', testContent);
  console.log('✅ 测试文件创建成功');
  return testContent;
}

// 上传文件
function uploadFile() {
  return new Promise((resolve, reject) => {
    const formData = `--boundary123\r\nContent-Disposition: form-data; name="files"; filename="test-file.txt"\r\nContent-Type: text/plain\r\n\r\n${fs.readFileSync('./test-file.txt')}\r\n--boundary123--\r\n`;
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=boundary123',
        'Content-Length': Buffer.byteLength(formData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
    req.write(formData);
    req.end();
  });
}

// 测试文件访问
function testFileAccess(fileUrl) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/uploads${fileUrl}`,
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, content: data });
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function runTest() {
  console.log('🧪 开始测试文件上传和访问...\n');
  
  try {
    // 1. 创建测试文件
    console.log('1️⃣ 创建测试文件...');
    const testContent = createTestFile();
    
    // 2. 上传文件
    console.log('2️⃣ 上传文件到服务器...');
    const uploadResult = await uploadFile();
    console.log('✅ 文件上传成功:', uploadResult.urls[0]);
    
    // 3. 测试文件访问
    console.log('3️⃣ 测试文件访问...');
    const accessResult = await testFileAccess(uploadResult.urls[0]);
    
    if (accessResult.status === 200) {
      console.log('✅ 文件可以正常访问');
      console.log('📄 文件内容:', accessResult.content);
    } else {
      console.log('❌ 文件访问失败，状态码:', accessResult.status);
    }
    
    // 4. 保存测试信息
    const testInfo = {
      uploadTime: new Date().toISOString(),
      fileUrl: uploadResult.urls[0],
      fullUrl: `http://localhost:5000/uploads${uploadResult.urls[0]}`,
      content: testContent,
      accessStatus: accessResult.status
    };
    
    fs.writeFileSync('./test-info.json', JSON.stringify(testInfo, null, 2));
    console.log('✅ 测试信息已保存到 test-info.json');
    
    console.log('\n🎉 测试完成！');
    console.log('📝 测试文件URL:', testInfo.fullUrl);
    console.log('\n📋 下一步：');
    console.log('1. 重新部署您的应用');
    console.log('2. 运行 node test-verify.js 验证文件是否仍然存在');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    // 清理测试文件
    if (fs.existsSync('./test-file.txt')) {
      fs.unlinkSync('./test-file.txt');
    }
  }
}

runTest();
