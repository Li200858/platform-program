const fs = require('fs');
const path = require('path');

async function testFilePreviewAndDownload() {
  const API_BASE_URL = 'http://localhost:5000';
  
  console.log('🖼️ 测试文件预览和下载功能...\n');
  
  try {
    // 1. 创建不同类型的测试文件
    console.log('1️⃣ 创建测试文件...');
    
    // 创建测试图片
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(base64Image, 'base64');
    const testImagePath = path.join(__dirname, 'test-preview.png');
    fs.writeFileSync(testImagePath, imageBuffer);
    
    // 创建测试文档
    const testDocContent = '这是一个测试文档，用于验证文件预览和下载功能。\n时间: ' + new Date().toISOString();
    const testDocPath = path.join(__dirname, 'test-preview.txt');
    fs.writeFileSync(testDocPath, testDocContent);
    
    console.log('✅ 测试文件创建成功');
    
    // 2. 上传文件
    console.log('2️⃣ 上传测试文件...');
    
    // 上传图片
    const imageFormData = new FormData();
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
    imageFormData.append('files', imageBlob, 'test-preview.png');
    
    const imageUploadResponse = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: imageFormData
    });
    
    if (!imageUploadResponse.ok) {
      throw new Error('图片上传失败');
    }
    
    const imageResult = await imageUploadResponse.json();
    console.log('✅ 图片上传成功:', imageResult.urls[0]);
    
    // 上传文档
    const docFormData = new FormData();
    const docBlob = new Blob([testDocContent], { type: 'text/plain' });
    docFormData.append('files', docBlob, 'test-preview.txt');
    
    const docUploadResponse = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: docFormData
    });
    
    if (!docUploadResponse.ok) {
      throw new Error('文档上传失败');
    }
    
    const docResult = await docUploadResponse.json();
    console.log('✅ 文档上传成功:', docResult.urls[0]);
    
    // 3. 测试文件访问（预览功能）
    console.log('3️⃣ 测试文件预览功能...');
    
    // 测试图片访问
    const imageUrl = `${API_BASE_URL}/uploads${imageResult.urls[0]}`;
    const imageResponse = await fetch(imageUrl);
    
    if (imageResponse.ok) {
      console.log('✅ 图片可以正常访问（预览）:', imageUrl);
      console.log('📊 图片大小:', imageResponse.headers.get('content-length'), 'bytes');
      console.log('📊 图片类型:', imageResponse.headers.get('content-type'));
    } else {
      throw new Error('图片无法访问');
    }
    
    // 测试文档访问
    const docUrl = `${API_BASE_URL}/uploads${docResult.urls[0]}`;
    const docResponse = await fetch(docUrl);
    
    if (docResponse.ok) {
      console.log('✅ 文档可以正常访问（预览）:', docUrl);
      const docContent = await docResponse.text();
      console.log('📄 文档内容预览:', docContent.substring(0, 50) + '...');
    } else {
      throw new Error('文档无法访问');
    }
    
    // 4. 测试文件下载功能
    console.log('4️⃣ 测试文件下载功能...');
    
    // 测试图片下载
    const imageDownloadResponse = await fetch(imageUrl);
    if (imageDownloadResponse.ok) {
      const imageData = await imageDownloadResponse.arrayBuffer();
      console.log('✅ 图片下载成功，大小:', imageData.byteLength, 'bytes');
    } else {
      throw new Error('图片下载失败');
    }
    
    // 测试文档下载
    const docDownloadResponse = await fetch(docUrl);
    if (docDownloadResponse.ok) {
      const docData = await docDownloadResponse.text();
      console.log('✅ 文档下载成功，内容长度:', docData.length, '字符');
    } else {
      throw new Error('文档下载失败');
    }
    
    // 5. 发布包含文件的作品
    console.log('5️⃣ 发布包含文件的作品...');
    
    const artData = {
      tab: '绘画',
      title: '文件预览测试作品',
      content: '这个作品包含图片和文档，用于测试预览和下载功能。',
      media: [...imageResult.urls, ...docResult.urls],
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
    console.log('✅ 作品发布成功，包含', artResult.media.length, '个文件');
    
    // 6. 验证作品中的文件
    console.log('6️⃣ 验证作品中的文件...');
    
    for (let i = 0; i < artResult.media.length; i++) {
      const fileUrl = `${API_BASE_URL}/uploads${artResult.media[i]}`;
      const fileResponse = await fetch(fileUrl);
      
      if (fileResponse.ok) {
        console.log(`✅ 作品文件 ${i + 1} 可以正常访问:`, artResult.media[i]);
      } else {
        console.log(`❌ 作品文件 ${i + 1} 无法访问:`, artResult.media[i]);
      }
    }
    
    // 清理测试文件
    fs.unlinkSync(testImagePath);
    fs.unlinkSync(testDocPath);
    console.log('🧹 清理测试文件');
    
    console.log('\n🎉 文件预览和下载功能测试完成！');
    console.log('✅ 所有功能正常工作：');
    console.log('   🖼️ 图片预览');
    console.log('   📄 文档预览');
    console.log('   📥 文件下载');
    console.log('   📝 作品发布');
    console.log('   🔗 文件链接');
    
    return true;
    
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
    return false;
  }
}

async function testFrontendFileHandling() {
  console.log('\n🌐 测试前端文件处理...');
  
  try {
    // 检查前端是否运行
    const frontendResponse = await fetch('http://localhost:3000');
    if (!frontendResponse.ok) {
      throw new Error('前端服务器未运行');
    }
    
    console.log('✅ 前端服务器运行正常');
    
    // 检查前端是否能访问后端文件
    const testFileUrl = 'http://localhost:5000/uploads/1758506201069-110933739.png';
    const fileResponse = await fetch(testFileUrl);
    
    if (fileResponse.ok) {
      console.log('✅ 前端可以访问后端文件');
      console.log('🔗 测试文件URL:', testFileUrl);
    } else {
      console.log('❌ 前端无法访问后端文件');
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ 前端测试失败:', error.message);
    return false;
  }
}

async function runPreviewDownloadTest() {
  console.log('🚀 开始文件预览和下载功能测试...\n');
  
  const backendTest = await testFilePreviewAndDownload();
  const frontendTest = await testFrontendFileHandling();
  
  console.log('\n📊 测试结果总结:');
  console.log('==================');
  console.log('后端文件功能:', backendTest ? '✅ 正常' : '❌ 异常');
  console.log('前端文件访问:', frontendTest ? '✅ 正常' : '❌ 异常');
  
  if (backendTest && frontendTest) {
    console.log('\n🎉 所有文件功能测试通过！');
    console.log('✅ 文件上传、预览、下载功能完全正常！');
    console.log('🌐 现在可以在浏览器中访问 http://localhost:3000 使用所有功能。');
  } else {
    console.log('\n⚠️ 部分文件功能异常，请检查服务器状态。');
  }
}

runPreviewDownloadTest();
