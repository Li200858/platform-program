// 测试修复后的功能
const testFixes = async () => {
  console.log('🔧 测试修复后的功能...');
  
  const baseUrl = 'http://localhost:5000';
  
  // 1. 测试艺术作品发布
  console.log('\n1️⃣ 测试艺术作品发布...');
  const testArtPost = {
    tab: "美术",
    title: "美丽的玫瑰",
    content: "这是我拍摄的一朵美丽的玫瑰，象征着爱情和美好。",
    media: ["https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500"],
    authorName: "测试2",
    authorClass: "高三(1)班"
  };
  
  try {
    const artResponse = await fetch(`${baseUrl}/api/art`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testArtPost)
    });
    
    if (artResponse.ok) {
      const artData = await artResponse.json();
      console.log('✅ 艺术作品发布成功:', artData.title);
      
      // 测试点赞功能
      const likeResponse = await fetch(`${baseUrl}/api/art/${artData._id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'test_user_2' })
      });
      
      if (likeResponse.ok) {
        console.log('✅ 点赞功能正常');
      } else {
        console.log('❌ 点赞功能失败');
      }
      
      // 测试收藏功能
      const favoriteResponse = await fetch(`${baseUrl}/api/art/${artData._id}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'test_user_2' })
      });
      
      if (favoriteResponse.ok) {
        console.log('✅ 收藏功能正常');
      } else {
        console.log('❌ 收藏功能失败');
      }
      
    } else {
      const error = await artResponse.text();
      console.log('❌ 艺术作品发布失败:', error);
    }
  } catch (error) {
    console.log('❌ 艺术作品发布错误:', error.message);
  }
  
  // 2. 测试活动发布
  console.log('\n2️⃣ 测试活动发布...');
  const testActivity = {
    title: "艺术创作比赛",
    description: "欢迎所有同学参加我们的艺术创作比赛，展示你的创意才华！",
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    location: "学校艺术中心",
    authorName: "测试2",
    authorClass: "高三(1)班"
  };
  
  try {
    const activityResponse = await fetch(`${baseUrl}/api/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testActivity)
    });
    
    if (activityResponse.ok) {
      const activityData = await activityResponse.json();
      console.log('✅ 活动发布成功:', activityData.title);
    } else {
      const error = await activityResponse.text();
      console.log('❌ 活动发布失败:', error);
    }
  } catch (error) {
    console.log('❌ 活动发布错误:', error.message);
  }
  
  // 3. 测试反馈提交
  console.log('\n3️⃣ 测试反馈提交...');
  const testFeedback = {
    content: "网站功能很强大，界面也很美观，希望能增加更多的互动功能。",
    category: "其他",
    authorName: "测试2",
    authorClass: "高三(1)班"
  };
  
  try {
    const feedbackResponse = await fetch(`${baseUrl}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testFeedback)
    });
    
    if (feedbackResponse.ok) {
      const feedbackData = await feedbackResponse.json();
      console.log('✅ 反馈提交成功:', feedbackData.content.substring(0, 20) + '...');
    } else {
      const error = await feedbackResponse.text();
      console.log('❌ 反馈提交失败:', error);
    }
  } catch (error) {
    console.log('❌ 反馈提交错误:', error.message);
  }
  
  console.log('\n🎉 测试完成！');
};

// 如果直接运行此脚本
if (require.main === module) {
  testFixes();
}

module.exports = testFixes;
