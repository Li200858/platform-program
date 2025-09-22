#!/usr/bin/env node

// 测试注册李昌轩脚本
const https = require('https');

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

// 测试注册API
const testRegister = async () => {
  const userData = {
    name: '李昌轩',
    class: '测试班级',
    avatar: ''
  };

  const postData = JSON.stringify(userData);

  const options = {
    hostname: 'platform-program.onrender.com',
    port: 443,
    path: '/api/user/sync',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: result });
        } catch (error) {
          resolve({ statusCode: res.statusCode, data: data, error: error.message });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
};

// 主函数
const main = async () => {
  log('🚀 开始测试注册李昌轩...', 'blue');
  
  try {
    const result = await testRegister();
    
    log(`\n📊 注册结果:`, 'blue');
    log(`状态码: ${result.statusCode}`, result.statusCode === 200 ? 'green' : 'red');
    
    if (result.statusCode === 200) {
      log('✅ 注册成功！', 'green');
      log(`用户信息:`, 'blue');
      log(`姓名: ${result.data.name}`, 'green');
      log(`班级: ${result.data.class}`, 'green');
      log(`角色: ${result.data.role}`, 'green');
      log(`管理员: ${result.data.isAdmin ? '是' : '否'}`, 'green');
    } else {
      log('❌ 注册失败！', 'red');
      log(`错误信息: ${JSON.stringify(result.data)}`, 'red');
    }
    
  } catch (error) {
    log(`❌ 请求失败: ${error.message}`, 'red');
  }
  
  log('\n✅ 测试完成', 'blue');
};

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testRegister };
