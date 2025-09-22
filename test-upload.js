const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testFileUpload() {
  console.log('🧪 开始测试文件上传...\n');
  
  try {
    // 1. 创建测试文件
    console.log('1️⃣ 创建测试文件...');
    const testContent = `测试文件内容 - ${new Date().toISOString()}`;
    const testFilePath = './test-file.txt';
    fs.writeFileSync(testFilePath, testContent);
    console.log('✅ 测试文件创建成功');
    
    // 2. 上传文件
    console.log('2️⃣ 上传文件到服务器...');
    const formData = new FormData();
    formData.append('files', fs.createReadStream(testFilePath));
    
    const response = await fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`上传失败: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ 文件上传成功:', result.urls[0]);
    
    // 3. 测试文件访问
    console.log('3️⃣ 测试文件访问...');
    const fileUrl = `http://localhost:5000/uploads${result.urls[0]}`;
    const fileResponse = await fetch(fileUrl);
    
    if (fileResponse.ok) {
      const fileContent = await fileResponse.text();
      console.log('✅ 文件可以正常访问');
      console.log('📄 文件内容:', fileContent);
    } else {
      throw new Error('文件无法访问');
    }
    
    // 4. 保存测试信息
    const testInfo = {
      uploadTime: new Date().toISOString(),
      fileUrl: result.urls[0],
      fullUrl: fileUrl,
      content: testContent
    };
    
    fs.writeFileSync('./test-info.json', JSON.stringify(testInfo, null, 2));
    console.log('✅ 测试信息已保存到 test-info.json');
    
    console.log('\n🎉 测试完成！现在可以重新部署来验证文件是否丢失。');
    console.log('📝 测试文件URL:', fileUrl);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    // 清理测试文件
    if (fs.existsSync('./test-file.txt')) {
      fs.unlinkSync('./test-file.txt');
    }
  }
}

// 运行测试
testFileUpload();