#!/usr/bin/env node

/**
 * API测试脚本
 * 用于测试登录和注册功能
 */

const https = require('https');
const http = require('http');

// 配置
const config = {
  baseUrl: process.env.BASE_URL || 'https://your-site.netlify.app',
  testEmail: 'test@example.com',
  testPassword: 'testpassword123'
};

// 发送HTTP请求
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// 测试环境变量检查
async function testEnvCheck() {
  console.log('🔍 测试环境变量检查...');
  try {
    const response = await makeRequest(`${config.baseUrl}/api/env-check`);
    console.log(`状态码: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ 环境变量检查成功');
      console.log('环境状态:', JSON.stringify(response.data, null, 2));
    } else {
      console.log('❌ 环境变量检查失败');
      console.log('响应:', response.data);
    }
  } catch (error) {
    console.log('❌ 环境变量检查请求失败:', error.message);
  }
  console.log('');
}

// 测试注册功能
async function testRegister() {
  console.log('📝 测试用户注册...');
  try {
    const response = await makeRequest(`${config.baseUrl}/api/register`, {
      method: 'POST',
      body: {
        email: config.testEmail,
        password: config.testPassword
      }
    });
    
    console.log(`状态码: ${response.status}`);
    if (response.status === 201) {
      console.log('✅ 注册成功');
      console.log('响应:', response.data);
    } else if (response.status === 400 && response.data.error === '用户已存在') {
      console.log('⚠️  用户已存在（这是正常的）');
    } else {
      console.log('❌ 注册失败');
      console.log('响应:', response.data);
    }
  } catch (error) {
    console.log('❌ 注册请求失败:', error.message);
  }
  console.log('');
}

// 测试登录功能
async function testLogin() {
  console.log('🔐 测试用户登录...');
  try {
    const response = await makeRequest(`${config.baseUrl}/api/login`, {
      method: 'POST',
      body: {
        email: config.testEmail,
        password: config.testPassword
      }
    });
    
    console.log(`状态码: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ 登录成功');
      console.log('Token:', response.data.token ? '已获取' : '未获取');
      console.log('用户角色:', response.data.role);
    } else {
      console.log('❌ 登录失败');
      console.log('响应:', response.data);
    }
  } catch (error) {
    console.log('❌ 登录请求失败:', error.message);
  }
  console.log('');
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始API测试...\n');
  console.log(`测试目标: ${config.baseUrl}\n`);
  
  await testEnvCheck();
  await testRegister();
  await testLogin();
  
  console.log('✨ 测试完成！');
  console.log('\n💡 提示:');
  console.log('- 如果看到"用户已存在"，这是正常的');
  console.log('- 确保在Netlify中设置了正确的环境变量');
  console.log('- 检查MongoDB连接是否正常');
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, makeRequest };
