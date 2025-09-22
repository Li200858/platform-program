#!/usr/bin/env node

// Render 部署测试脚本
const https = require('https');
const http = require('http');

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// 测试函数
const testEndpoint = (url, description) => {
  return new Promise((resolve) => {
    const start = Date.now();
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      const end = Date.now();
      const responseTime = end - start;
      
      if (res.statusCode === 200) {
        log(`✅ ${description} - 响应时间: ${responseTime}ms`, 'green');
        resolve({ success: true, responseTime, statusCode: res.statusCode });
      } else {
        log(`❌ ${description} - 状态码: ${res.statusCode}`, 'red');
        resolve({ success: false, responseTime, statusCode: res.statusCode });
      }
    }).on('error', (err) => {
      log(`❌ ${description} - 错误: ${err.message}`, 'red');
      resolve({ success: false, error: err.message });
    });
  });
};

// 主测试函数
const runTests = async () => {
  log('🚀 开始测试 Render 部署...', 'blue');
  log('', 'reset');
  
  // 测试后端健康检查
  log('📡 测试后端服务...', 'yellow');
  const backendHealth = await testEndpoint(
    'https://platform-program.onrender.com/health',
    '后端健康检查'
  );
  
  // 测试后端根路径
  const backendRoot = await testEndpoint(
    'https://platform-program.onrender.com/',
    '后端根路径'
  );
  
  // 测试前端服务
  log('', 'reset');
  log('🎨 测试前端服务...', 'yellow');
  const frontend = await testEndpoint(
    'https://platform-program-frontend.onrender.com/',
    '前端服务'
  );
  
  // 测试API端点
  log('', 'reset');
  log('🔌 测试API端点...', 'yellow');
  const artAPI = await testEndpoint(
    'https://platform-program.onrender.com/api/art',
    '艺术作品API'
  );
  
  const activitiesAPI = await testEndpoint(
    'https://platform-program.onrender.com/api/activities',
    '活动API'
  );
  
  const searchAPI = await testEndpoint(
    'https://platform-program.onrender.com/api/search?q=test',
    '搜索API'
  );
  
  // 汇总结果
  log('', 'reset');
  log('📊 测试结果汇总:', 'blue');
  log('================================', 'blue');
  
  const results = [
    { name: '后端健康检查', result: backendHealth },
    { name: '后端根路径', result: backendRoot },
    { name: '前端服务', result: frontend },
    { name: '艺术作品API', result: artAPI },
    { name: '活动API', result: activitiesAPI },
    { name: '搜索API', result: searchAPI }
  ];
  
  let successCount = 0;
  let totalCount = results.length;
  
  results.forEach(({ name, result }) => {
    if (result.success) {
      log(`✅ ${name}: 成功`, 'green');
      successCount++;
    } else {
      log(`❌ ${name}: 失败`, 'red');
    }
  });
  
  log('', 'reset');
  log(`📈 成功率: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`, 
      successCount === totalCount ? 'green' : 'yellow');
  
  if (successCount === totalCount) {
    log('', 'reset');
    log('🎉 所有测试通过！您的网站已成功部署！', 'green');
    log('', 'reset');
    log('🌐 网站链接:', 'blue');
    log('   前端: https://platform-program-frontend.onrender.com', 'blue');
    log('   后端: https://platform-program.onrender.com', 'blue');
    log('', 'reset');
    log('💡 现在您可以:', 'yellow');
    log('   1. 访问前端网站测试所有功能', 'yellow');
    log('   2. 注册用户账户', 'yellow');
    log('   3. 发布艺术作品', 'yellow');
    log('   4. 测试文件上传/下载', 'yellow');
    log('   5. 测试搜索功能', 'yellow');
    log('   6. 测试管理员功能', 'yellow');
  } else {
    log('', 'reset');
    log('⚠️ 部分测试失败，请检查部署状态', 'yellow');
    log('   1. 确认服务已完全部署', 'yellow');
    log('   2. 检查环境变量配置', 'yellow');
    log('   3. 查看 Render 日志', 'yellow');
  }
};

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testEndpoint };
