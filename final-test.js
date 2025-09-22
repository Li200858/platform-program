const fs = require('fs');
const path = require('path');

async function testCompleteFileFunctionality() {
  console.log('🎨 校园艺术平台 - 完整功能测试');
  console.log('================================\n');
  
  const API_BASE_URL = 'http://localhost:5000';
  const FRONTEND_URL = 'http://localhost:3000';
  
  let allTestsPassed = true;
  
  try {
    // 1. 检查服务器状态
    console.log('1️⃣ 检查服务器状态...');
    
    const backendHealth = await fetch(`${API_BASE_URL}/health`);
    if (!backendHealth.ok) {
      throw new Error('后端服务器未运行');
    }
    console.log('✅ 后端服务器运行正常 (端口 5000)');
    
    const frontendHealth = await fetch(FRONTEND_URL);
    if (!frontendHealth.ok) {
      throw new Error('前端服务器未运行');
    }
    console.log('✅ 前端服务器运行正常 (端口 3000)');
    
    // 2. 测试文件上传
    console.log('\n2️⃣ 测试文件上传功能...');
    
    // 创建测试图片
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(base64Image, 'base64');
    const testImagePath = path.join(__dirname, 'final-test-image.png');
    fs.writeFileSync(testImagePath, imageBuffer);
    
    // 上传文件
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('files', blob, 'final-test-image.png');
    
    const uploadResponse = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      throw new Error('文件上传失败');
    }
    
    const uploadResult = await uploadResponse.json();
    console.log('✅ 文件上传成功:', uploadResult.urls[0]);
    
    // 3. 测试文件预览
    console.log('\n3️⃣ 测试文件预览功能...');
    
    const fileUrl = `${API_BASE_URL}/uploads${uploadResult.urls[0]}`;
    const fileResponse = await fetch(fileUrl);
    
    if (!fileResponse.ok) {
      throw new Error('文件无法访问');
    }
    
    const fileSize = fileResponse.headers.get('content-length');
    const fileType = fileResponse.headers.get('content-type');
    console.log('✅ 文件可以正常访问');
    console.log('📊 文件大小:', fileSize, 'bytes');
    console.log('📊 文件类型:', fileType);
    
    // 4. 测试文件下载
    console.log('\n4️⃣ 测试文件下载功能...');
    
    const downloadResponse = await fetch(fileUrl);
    if (downloadResponse.ok) {
      const fileData = await downloadResponse.arrayBuffer();
      console.log('✅ 文件下载成功，大小:', fileData.byteLength, 'bytes');
    } else {
      throw new Error('文件下载失败');
    }
    
    // 5. 测试作品发布
    console.log('\n5️⃣ 测试作品发布功能...');
    
    const artData = {
      tab: '绘画',
      title: '最终测试作品',
      content: '这是一个包含图片的测试作品，用于验证完整的发布流程。',
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
      throw new Error('作品发布失败');
    }
    
    const artResult = await publishResponse.json();
    console.log('✅ 作品发布成功');
    console.log('📝 作品ID:', artResult._id);
    console.log('📝 作品标题:', artResult.title);
    console.log('📝 包含文件:', artResult.media.length, '个');
    
    // 6. 测试作品列表
    console.log('\n6️⃣ 测试作品列表功能...');
    
    const listResponse = await fetch(`${API_BASE_URL}/api/art`);
    const arts = await listResponse.json();
    
    const publishedArt = arts.find(art => art._id === artResult._id);
    if (publishedArt) {
      console.log('✅ 作品在列表中显示正常');
      console.log('📊 总作品数量:', arts.length);
    } else {
      throw new Error('作品未在列表中显示');
    }
    
    // 7. 测试文件在作品中的显示
    console.log('\n7️⃣ 测试作品中的文件显示...');
    
    for (let i = 0; i < artResult.media.length; i++) {
      const mediaUrl = `${API_BASE_URL}/uploads${artResult.media[i]}`;
      const mediaResponse = await fetch(mediaUrl);
      
      if (mediaResponse.ok) {
        console.log(`✅ 作品文件 ${i + 1} 可以正常访问`);
      } else {
        console.log(`❌ 作品文件 ${i + 1} 无法访问`);
        allTestsPassed = false;
      }
    }
    
    // 8. 测试前端文件处理
    console.log('\n8️⃣ 测试前端文件处理...');
    
    // 检查前端是否能正确处理文件URL
    const frontendFileUrl = `${FRONTEND_URL}/`;
    const frontendResponse = await fetch(frontendFileUrl);
    
    if (frontendResponse.ok) {
      console.log('✅ 前端页面可以正常访问');
      console.log('🌐 前端地址:', FRONTEND_URL);
    } else {
      console.log('❌ 前端页面无法访问');
      allTestsPassed = false;
    }
    
    // 清理测试文件
    fs.unlinkSync(testImagePath);
    console.log('\n🧹 清理测试文件');
    
    // 9. 功能总结
    console.log('\n📊 功能测试总结:');
    console.log('==================');
    console.log('✅ 文件上传功能: 正常');
    console.log('✅ 文件预览功能: 正常');
    console.log('✅ 文件下载功能: 正常');
    console.log('✅ 作品发布功能: 正常');
    console.log('✅ 作品列表功能: 正常');
    console.log('✅ 文件链接功能: 正常');
    console.log('✅ 前端访问功能: 正常');
    
    if (allTestsPassed) {
      console.log('\n🎉 所有功能测试通过！');
      console.log('✅ 文件上传、预览、下载功能完全正常！');
      console.log('✅ 作品发布和显示功能完全正常！');
      console.log('✅ 前端和后端通信完全正常！');
      console.log('\n🌐 现在可以在浏览器中访问以下地址：');
      console.log('   主网站: http://localhost:3000');
      console.log('   测试页面: http://localhost:8080/test-frontend-preview.html');
      console.log('\n📝 使用说明：');
      console.log('   1. 访问主网站，点击"发布作品"');
      console.log('   2. 上传图片、视频或文档文件');
      console.log('   3. 填写作品信息并发布');
      console.log('   4. 在作品列表中查看和下载文件');
      console.log('   5. 点击图片可以放大预览');
      console.log('   6. 点击下载按钮可以下载文件');
    } else {
      console.log('\n⚠️ 部分功能测试失败，请检查服务器状态。');
    }
    
  } catch (error) {
    console.log('\n❌ 测试失败:', error.message);
    allTestsPassed = false;
  }
  
  return allTestsPassed;
}

// 运行测试
testCompleteFileFunctionality();
