// 使用内置fetch (Node.js 18+)

async function testPublish() {
  const API_BASE_URL = 'http://localhost:5000';
  
  console.log('🧪 测试作品发布功能...');
  
  try {
    // 测试健康检查
    console.log('1. 检查服务器状态...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ 服务器状态:', healthData.status);
    
    // 测试发布作品
    console.log('2. 测试发布作品...');
    const artData = {
      tab: '音乐',
      title: '测试作品标题',
      content: '这是一个测试作品，用于验证发布功能是否正常工作。',
      media: [],
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
    
    if (publishResponse.ok) {
      const result = await publishResponse.json();
      console.log('✅ 作品发布成功!');
      console.log('📝 作品ID:', result._id);
      console.log('📝 作品标题:', result.title);
      console.log('📝 作者:', result.authorName);
      return result._id;
    } else {
      const error = await publishResponse.text();
      console.log('❌ 发布失败:', error);
      return null;
    }
    
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
    return null;
  }
}

async function testGetArt() {
  const API_BASE_URL = 'http://localhost:5000';
  
  console.log('3. 测试获取作品列表...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/art`);
    const arts = await response.json();
    
    console.log('✅ 获取作品列表成功!');
    console.log('📊 作品数量:', arts.length);
    
    if (arts.length > 0) {
      console.log('📝 最新作品:', {
        title: arts[0].title,
        author: arts[0].authorName,
        createdAt: arts[0].createdAt
      });
    }
    
  } catch (error) {
    console.log('❌ 获取作品失败:', error.message);
  }
}

async function runTests() {
  console.log('🚀 开始测试艺术平台发布功能...\n');
  
  const artId = await testPublish();
  console.log('');
  
  await testGetArt();
  console.log('');
  
  if (artId) {
    console.log('🎉 所有测试通过！发布功能正常工作。');
  } else {
    console.log('❌ 测试失败，请检查服务器状态。');
  }
}

runTests();
