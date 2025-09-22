#!/usr/bin/env node

// 全面测试所有功能的脚本
const fetch = require('node-fetch').default;

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

// 测试数据
const testUser = {
  name: '测试用户',
  class: '测试班级',
  userId: 'TEST_USER_' + Date.now()
};

const testArt = {
  title: '测试艺术作品',
  content: '这是一个测试艺术作品',
  tab: '绘画',
  authorName: testUser.name,
  authorClass: testUser.class,
  media: []
};

const testActivity = {
  title: '测试活动',
  description: '这是一个测试活动',
  startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  authorName: testUser.name,
  authorClass: testUser.class
};

const testFeedback = {
  content: '这是一个测试反馈',
  category: '其他',
  authorName: testUser.name,
  authorClass: testUser.class
};

// 测试函数
async function testFunction(name, testFn) {
  console.log(`\n🧪 测试 ${name}...`);
  try {
    await testFn();
    console.log(`✅ ${name} 测试通过`);
    return true;
  } catch (error) {
    console.log(`❌ ${name} 测试失败:`, error.message);
    return false;
  }
}

// 测试用户管理
async function testUserManagement() {
  // 保存用户
  const saveRes = await fetch(`${API_BASE_URL}/api/user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });
  
  if (!saveRes.ok) {
    throw new Error(`保存用户失败: ${saveRes.status}`);
  }
  
  // 获取用户
  const getRes = await fetch(`${API_BASE_URL}/api/user/${testUser.userId}`);
  if (!getRes.ok) {
    throw new Error(`获取用户失败: ${getRes.status}`);
  }
  
  const userData = await getRes.json();
  if (userData.name !== testUser.name) {
    throw new Error('用户数据不匹配');
  }
}

// 测试反馈功能
async function testFeedbackFunction() {
  const res = await fetch(`${API_BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testFeedback)
  });
  
  if (!res.ok) {
    throw new Error(`反馈提交失败: ${res.status}`);
  }
}

// 测试艺术作品功能
async function testArtFunction() {
  // 创建艺术作品
  const createRes = await fetch(`${API_BASE_URL}/api/art`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testArt)
  });
  
  if (!createRes.ok) {
    throw new Error(`创建艺术作品失败: ${createRes.status}`);
  }
  
  const artData = await createRes.json();
  const artId = artData._id;
  
  // 测试点赞
  const likeRes = await fetch(`${API_BASE_URL}/api/art/${artId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: testUser.name })
  });
  
  if (!likeRes.ok) {
    throw new Error(`点赞失败: ${likeRes.status}`);
  }
  
  // 测试评论
  const commentRes = await fetch(`${API_BASE_URL}/api/art/${artId}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      author: testUser.name,
      authorClass: testUser.class,
      content: '测试评论'
    })
  });
  
  if (!commentRes.ok) {
    throw new Error(`评论失败: ${commentRes.status}`);
  }
  
  // 测试删除
  const deleteRes = await fetch(`${API_BASE_URL}/api/art/${artId}?authorName=${encodeURIComponent(testUser.name)}&isAdmin=false`, {
    method: 'DELETE'
  });
  
  if (!deleteRes.ok) {
    throw new Error(`删除艺术作品失败: ${deleteRes.status}`);
  }
}

// 测试活动功能
async function testActivityFunction() {
  // 创建活动
  const createRes = await fetch(`${API_BASE_URL}/api/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testActivity)
  });
  
  if (!createRes.ok) {
    throw new Error(`创建活动失败: ${createRes.status}`);
  }
  
  const activityData = await createRes.json();
  const activityId = activityData._id;
  
  // 测试点赞
  const likeRes = await fetch(`${API_BASE_URL}/api/activities/${activityId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: testUser.name })
  });
  
  if (!likeRes.ok) {
    throw new Error(`活动点赞失败: ${likeRes.status}`);
  }
  
  // 测试收藏
  const favoriteRes = await fetch(`${API_BASE_URL}/api/activities/${activityId}/favorite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: testUser.name })
  });
  
  if (!favoriteRes.ok) {
    throw new Error(`活动收藏失败: ${favoriteRes.status}`);
  }
  
  // 测试评论
  const commentRes = await fetch(`${API_BASE_URL}/api/activities/${activityId}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      author: testUser.name,
      authorClass: testUser.class,
      content: '测试活动评论'
    })
  });
  
  if (!commentRes.ok) {
    throw new Error(`活动评论失败: ${commentRes.status}`);
  }
  
  // 测试删除
  const deleteRes = await fetch(`${API_BASE_URL}/api/activities/${activityId}?authorName=${encodeURIComponent(testUser.name)}&isAdmin=false`, {
    method: 'DELETE'
  });
  
  if (!deleteRes.ok) {
    throw new Error(`删除活动失败: ${deleteRes.status}`);
  }
}

// 测试管理员功能
async function testAdminFunction() {
  // 检查管理员状态
  const checkRes = await fetch(`${API_BASE_URL}/api/admin/check?userName=${encodeURIComponent(testUser.name)}`);
  
  if (!checkRes.ok) {
    throw new Error(`检查管理员状态失败: ${checkRes.status}`);
  }
  
  const adminData = await checkRes.json();
  console.log('管理员状态:', adminData);
}

// 测试文件上传功能
async function testFileUploadFunction() {
  // 创建一个测试文件
  const testFile = Buffer.from('这是一个测试文件内容');
  
  const FormData = require('form-data');
  const form = new FormData();
  form.append('files', testFile, {
    filename: 'test.txt',
    contentType: 'text/plain'
  });
  
  const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    body: form
  });
  
  if (!uploadRes.ok) {
    throw new Error(`文件上传失败: ${uploadRes.status}`);
  }
  
  const uploadData = await uploadRes.json();
  console.log('文件上传成功:', uploadData);
}

// 主测试函数
async function runAllTests() {
  console.log('🚀 开始全面功能测试...');
  console.log(`API Base URL: ${API_BASE_URL}`);
  
  const results = [];
  
  results.push(await testFunction('用户管理', testUserManagement));
  results.push(await testFunction('反馈功能', testFeedbackFunction));
  results.push(await testFunction('艺术作品功能', testArtFunction));
  results.push(await testFunction('活动功能', testActivityFunction));
  results.push(await testFunction('管理员功能', testAdminFunction));
  results.push(await testFunction('文件上传功能', testFileUploadFunction));
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n📊 测试结果: ${passed}/${total} 通过`);
  
  if (passed === total) {
    console.log('🎉 所有功能测试通过！');
  } else {
    console.log('⚠️  部分功能测试失败，请检查相关功能');
  }
}

// 运行测试
runAllTests().catch(console.error);
