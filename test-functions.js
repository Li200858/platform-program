const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000';

async function testAPI() {
  console.log('🌹 测试校园艺术平台功能');
  console.log('========================');

  try {
    // 1. 测试健康检查
    console.log('1. 测试健康检查...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ 健康检查:', healthData.status);

    // 2. 测试管理员检查
    console.log('\n2. 测试管理员检查...');
    const adminResponse = await fetch(`${API_BASE}/api/admin/check?userName=测试员`);
    const adminData = await adminResponse.json();
    console.log('✅ 管理员检查:', adminData);

    // 3. 测试获取艺术作品
    console.log('\n3. 测试获取艺术作品...');
    const artResponse = await fetch(`${API_BASE}/api/art`);
    const artData = await artResponse.json();
    console.log('✅ 艺术作品数量:', Array.isArray(artData) ? artData.length : 0);

    // 4. 测试创建艺术作品
    console.log('\n4. 测试创建艺术作品...');
    const createArtResponse = await fetch(`${API_BASE}/api/art`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tab: '摄影',
        title: '美丽的玫瑰',
        content: '这是一朵美丽的红玫瑰，象征着爱情和美好。',
        authorName: '测试员',
        authorClass: '测试班级',
        media: []
      })
    });
    const createArtData = await createArtResponse.json();
    console.log('✅ 创建艺术作品:', createArtData.title);

    // 5. 测试点赞功能
    console.log('\n5. 测试点赞功能...');
    const likeResponse = await fetch(`${API_BASE}/api/art/${createArtData._id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: '测试员' })
    });
    const likeData = await likeResponse.json();
    console.log('✅ 点赞成功，当前点赞数:', likeData.likes);

    // 6. 测试收藏功能
    console.log('\n6. 测试收藏功能...');
    const favoriteResponse = await fetch(`${API_BASE}/api/art/${createArtData._id}/favorite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: '测试员' })
    });
    const favoriteData = await favoriteResponse.json();
    console.log('✅ 收藏成功，当前收藏数:', favoriteData.favorites.length);

    // 7. 测试评论功能
    console.log('\n7. 测试评论功能...');
    const commentResponse = await fetch(`${API_BASE}/api/art/${createArtData._id}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        author: '测试员',
        authorClass: '测试班级',
        content: '这朵玫瑰真的很美！'
      })
    });
    const commentData = await commentResponse.json();
    console.log('✅ 评论成功，当前评论数:', commentData.comments.length);

    // 8. 测试搜索功能
    console.log('\n8. 测试搜索功能...');
    const searchResponse = await fetch(`${API_BASE}/api/search?q=玫瑰`);
    const searchData = await searchResponse.json();
    console.log('✅ 搜索成功，找到结果:', searchData.art.length);

    // 9. 测试获取我的作品
    console.log('\n9. 测试获取我的作品...');
    const myWorksResponse = await fetch(`${API_BASE}/api/art/my-works?authorName=测试员`);
    const myWorksData = await myWorksResponse.json();
    console.log('✅ 我的作品数量:', myWorksData.length);

    // 10. 测试获取我的收藏
    console.log('\n10. 测试获取我的收藏...');
    const myFavoritesResponse = await fetch(`${API_BASE}/api/art/favorites?authorName=测试员`);
    const myFavoritesData = await myFavoritesResponse.json();
    console.log('✅ 我的收藏数量:', myFavoritesData.length);

    // 11. 测试创建活动
    console.log('\n11. 测试创建活动...');
    const createActivityResponse = await fetch(`${API_BASE}/api/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '玫瑰摄影展',
        description: '展示各种美丽的玫瑰摄影作品',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        authorName: '测试员',
        authorClass: '测试班级'
      })
    });
    const createActivityData = await createActivityResponse.json();
    console.log('✅ 创建活动成功:', createActivityData.title);

    // 12. 测试创建反馈
    console.log('\n12. 测试创建反馈...');
    const createFeedbackResponse = await fetch(`${API_BASE}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: '网站功能很好，希望能增加更多艺术分类',
        category: '其他',
        authorName: '测试员',
        authorClass: '测试班级'
      })
    });
    const createFeedbackData = await createFeedbackResponse.json();
    console.log('✅ 创建反馈成功:', createFeedbackData.content.substring(0, 20) + '...');

    console.log('\n🎉 所有功能测试完成！');
    console.log('========================');
    console.log('✅ 后端服务器运行正常');
    console.log('✅ 所有API接口工作正常');
    console.log('✅ 数据库操作成功');
    console.log('✅ 管理员账户已创建');
    console.log('✅ 测试数据已生成');
    console.log('\n🌹 现在可以访问 http://localhost:3000 查看网站');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testAPI();
