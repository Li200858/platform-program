const fs = require('fs');
const path = require('path');

async function testFileUpload() {
  const API_BASE_URL = 'http://localhost:5000';
  
  console.log('🧪 测试文件上传功能...');
  
  try {
    // 创建一个测试文件
    const testFilePath = path.join(__dirname, 'test-image.txt');
    const testContent = '这是一个测试文件，用于验证文件上传功能。\n时间: ' + new Date().toISOString();
    fs.writeFileSync(testFilePath, testContent);
    console.log('✅ 创建测试文件:', testFilePath);
    
    // 检查服务器状态
    console.log('1. 检查服务器状态...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    if (!healthResponse.ok) {
      throw new Error('服务器未运行');
    }
    console.log('✅ 服务器运行正常');
    
    // 测试文件上传
    console.log('2. 测试文件上传...');
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(testFilePath);
    const blob = new Blob([fileBuffer], { type: 'text/plain' });
    formData.append('files', blob, 'test-image.txt');
    
    const uploadResponse = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (uploadResponse.ok) {
      const result = await uploadResponse.json();
      console.log('✅ 文件上传成功!');
      console.log('📁 上传的文件URLs:', result.urls);
      
      // 测试文件访问
      console.log('3. 测试文件访问...');
      const fileUrl = `${API_BASE_URL}/uploads${result.urls[0]}`;
      const fileResponse = await fetch(fileUrl);
      
      if (fileResponse.ok) {
        console.log('✅ 文件可以正常访问:', fileUrl);
        const fileContent = await fileResponse.text();
        console.log('📄 文件内容:', fileContent.substring(0, 100) + '...');
      } else {
        console.log('❌ 文件无法访问:', fileResponse.status);
      }
      
    } else {
      const error = await uploadResponse.text();
      console.log('❌ 文件上传失败:', error);
    }
    
    // 清理测试文件
    fs.unlinkSync(testFilePath);
    console.log('🧹 清理测试文件');
    
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
  }
}

async function testImageUpload() {
  const API_BASE_URL = 'http://localhost:5000';
  
  console.log('\n🖼️ 测试图片上传功能...');
  
  try {
    // 创建一个简单的测试图片（base64编码的1x1像素PNG）
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(base64Image, 'base64');
    const testImagePath = path.join(__dirname, 'test-image.png');
    fs.writeFileSync(testImagePath, imageBuffer);
    console.log('✅ 创建测试图片:', testImagePath);
    
    // 上传图片
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('files', blob, 'test-image.png');
    
    const uploadResponse = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (uploadResponse.ok) {
      const result = await uploadResponse.json();
      console.log('✅ 图片上传成功!');
      console.log('🖼️ 图片URL:', result.urls[0]);
      
      // 测试图片访问
      const imageUrl = `${API_BASE_URL}/uploads${result.urls[0]}`;
      const imageResponse = await fetch(imageUrl);
      
      if (imageResponse.ok) {
        console.log('✅ 图片可以正常访问:', imageUrl);
      } else {
        console.log('❌ 图片无法访问:', imageResponse.status);
      }
      
    } else {
      const error = await uploadResponse.text();
      console.log('❌ 图片上传失败:', error);
    }
    
    // 清理测试图片
    fs.unlinkSync(testImagePath);
    console.log('🧹 清理测试图片');
    
  } catch (error) {
    console.log('❌ 图片测试失败:', error.message);
  }
}

async function runUploadTests() {
  console.log('🚀 开始测试文件上传功能...\n');
  
  await testFileUpload();
  await testImageUpload();
  
  console.log('\n🎉 文件上传测试完成！');
}

runUploadTests();
