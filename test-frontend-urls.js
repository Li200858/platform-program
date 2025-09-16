#!/usr/bin/env node

// 模拟前端环境变量
process.env.NODE_ENV = 'production';
process.env.REACT_APP_API_URL = 'https://platform-program-production.up.railway.app';

// 模拟API URL工具函数
const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  if (process.env.NODE_ENV === 'production') {
    return 'https://platform-program-production.up.railway.app';
  }
  
  return 'http://localhost:5000';
};

const buildApiUrl = (endpoint) => {
  if (!endpoint) return getApiUrl();
  
  const baseUrl = getApiUrl();
  if (endpoint.startsWith('/')) {
    return `${baseUrl}${endpoint}`;
  }
  return `${baseUrl}/${endpoint}`;
};

console.log('🧪 测试前端URL构建');
console.log('==========================================');

// 测试各种API端点
const testCases = [
  {
    name: '艺术作品点赞',
    template: `/api/art/\${id}/like`,
    id: '68c7fd6d78e08cc446166ab7',
    expected: 'https://platform-program-production.up.railway.app/api/art/68c7fd6d78e08cc446166ab7/like'
  },
  {
    name: '艺术作品收藏',
    template: `/api/art/\${id}/favorite`,
    id: '68c7fd6d78e08cc446166ab7',
    expected: 'https://platform-program-production.up.railway.app/api/art/68c7fd6d78e08cc446166ab7/favorite'
  },
  {
    name: '活动点赞',
    template: `/api/activities/\${id}/like`,
    id: 'test-activity-id',
    expected: 'https://platform-program-production.up.railway.app/api/activities/test-activity-id/like'
  },
  {
    name: '活动收藏',
    template: `/api/activities/\${id}/favorite`,
    id: 'test-activity-id',
    expected: 'https://platform-program-production.up.railway.app/api/activities/test-activity-id/favorite'
  },
  {
    name: '艺术作品评论',
    template: `/api/art/\${id}/comment`,
    id: '68c7fd6d78e08cc446166ab7',
    expected: 'https://platform-program-production.up.railway.app/api/art/68c7fd6d78e08cc446166ab7/comment'
  }
];

testCases.forEach(testCase => {
  // 模拟模板字符串插值
  const actualUrl = buildApiUrl(testCase.template.replace(/\$\{id\}/g, testCase.id));
  
  console.log(`\n${testCase.name}:`);
  console.log(`  模板: ${testCase.template}`);
  console.log(`  实际: ${actualUrl}`);
  console.log(`  期望: ${testCase.expected}`);
  console.log(`  结果: ${actualUrl === testCase.expected ? '✅ 正确' : '❌ 错误'}`);
});

console.log('\n🔍 测试实际API调用:');
const https = require('https');

async function testActualApi() {
  try {
    // 测试点赞API
    const likeUrl = buildApiUrl(`/api/art/68c7fd6d78e08cc446166ab7/like`);
    console.log(`\n测试点赞API: ${likeUrl}`);
    
    const response = await fetch(likeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'test-frontend' })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 点赞API测试成功:', data.likes, '个赞');
    } else {
      console.log('❌ 点赞API测试失败:', response.status);
    }
    
  } catch (error) {
    console.log('❌ API测试错误:', error.message);
  }
}

testActualApi();
