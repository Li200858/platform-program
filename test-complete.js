const fs = require('fs');
const path = require('path');

async function testCompletePublishFlow() {
  const API_BASE_URL = 'http://localhost:5000';
  
  console.log('🎨 测试完整的作品发布流程...\n');
  
  try {
    // 1. 检查服务器状态
    console.log('1️⃣ 检查服务器状态...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    if (!healthResponse.ok) {
      throw new Error('后端服务器未运行');
    }
    console.log('✅ 后端服务器运行正常');
    
    // 2. 创建测试图片
    console.log('2️⃣ 创建测试图片...');
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(base64Image, 'base64');
    const testImagePath = path.join(__dirname, 'test-rose.png');
    fs.writeFileSync(testImagePath, imageBuffer);
    console.log('✅ 测试图片创建成功');
    
    // 3. 上传文件
    console.log('3️⃣ 上传测试图片...');
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('files', blob, 'test-rose.png');
    
    const uploadResponse = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      throw new Error('文件上传失败');
    }
    
    const uploadResult = await uploadResponse.json();
    console.log('✅ 图片上传成功:', uploadResult.urls[0]);
    
    // 4. 验证文件访问
    console.log('4️⃣ 验证文件访问...');
    const fileUrl = `${API_BASE_URL}/uploads${uploadResult.urls[0]}`;
    const fileResponse = await fetch(fileUrl);
    
    if (!fileResponse.ok) {
      throw new Error('文件无法访问');
    }
    console.log('✅ 文件可以正常访问');
    
    // 5. 发布作品
    console.log('5️⃣ 发布作品...');
    const artData = {
      tab: '绘画',
      title: '测试玫瑰作品',
      content: '这是一朵美丽的测试玫瑰，用于验证完整的发布流程。包含图片上传、预览和下载功能。',
      media: uploadResult.urls,
      authorName: '测试员',
      authorClass: '测试班级'
    };
    
    const publishResponse = await fetch(`${API_BASE_URL}/api/art`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(artData)
    });
    
    if (!publishResponse.ok) {
      const error = await publishResponse.text();
      throw new Error('作品发布失败: ' + error);
    }
    
    const artResult = await publishResponse.json();
    console.log('✅ 作品发布成功!');
    console.log('📝 作品ID:', artResult._id);
    console.log('📝 作品标题:', artResult.title);
    console.log('📝 媒体文件:', artResult.media);
    
    // 6. 验证作品列表
    console.log('6️⃣ 验证作品列表...');
    const listResponse = await fetch(`${API_BASE_URL}/api/art`);
    const arts = await listResponse.json();
    
    const publishedArt = arts.find(art => art._id === artResult._id);
    if (publishedArt) {
      console.log('✅ 作品在列表中显示正常');
      console.log('📊 总作品数量:', arts.length);
    } else {
      throw new Error('作品未在列表中显示');
    }
    
    // 7. 测试文件下载
    console.log('7️⃣ 测试文件下载...');
    const downloadResponse = await fetch(fileUrl);
    if (downloadResponse.ok) {
      console.log('✅ 文件下载功能正常');
    } else {
      throw new Error('文件下载失败');
    }
    
    // 清理测试文件
    fs.unlinkSync(testImagePath);
    console.log('🧹 清理测试文件');
    
    console.log('\n🎉 完整发布流程测试通过！');
    console.log('✅ 所有功能正常工作：');
    console.log('   📁 文件上传');
    console.log('   🖼️ 图片预览');
    console.log('   📥 文件下载');
    console.log('   📝 作品发布');
    console.log('   📋 作品列表');
    
    return true;
    
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
    return false;
  }
}

async function testFrontendAccess() {
  console.log('\n🌐 测试前端访问...');
  
  try {
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      console.log('✅ 前端服务器运行正常');
      console.log('🌐 访问地址: http://localhost:3000');
      return true;
    } else {
      console.log('❌ 前端服务器无法访问');
      return false;
    }
  } catch (error) {
    console.log('❌ 前端服务器未运行:', error.message);
    return false;
  }
}

async function runCompleteTest() {
  console.log('🚀 开始完整功能测试...\n');
  
  const backendTest = await testCompletePublishFlow();
  const frontendTest = await testFrontendAccess();
  
  console.log('\n📊 测试结果总结:');
  console.log('==================');
  console.log('后端功能:', backendTest ? '✅ 正常' : '❌ 异常');
  console.log('前端服务:', frontendTest ? '✅ 正常' : '❌ 异常');
  
  if (backendTest && frontendTest) {
    console.log('\n🎉 所有测试通过！网站功能完全正常！');
    console.log('现在可以在浏览器中访问 http://localhost:3000 使用所有功能。');
  } else {
    console.log('\n⚠️ 部分功能异常，请检查服务器状态。');
  }
}

runCompleteTest();
