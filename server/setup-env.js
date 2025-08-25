#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 MongoDB 环境配置工具');
console.log('========================\n');

// 检查是否已存在 .env 文件
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('⚠️  发现已存在的 .env 文件');
  rl.question('是否要覆盖现有文件？(y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      createEnvFile();
    } else {
      console.log('操作已取消');
      rl.close();
    }
  });
} else {
  createEnvFile();
}

function createEnvFile() {
  console.log('\n📝 请提供以下信息：\n');
  
  rl.question('MongoDB Atlas 用户名: ', (username) => {
    rl.question('MongoDB Atlas 密码: ', (password) => {
      rl.question('MongoDB 集群地址 (例如: cluster0.mongodb.net): ', (cluster) => {
        rl.question('数据库名称 (例如: campus-platform): ', (dbName) => {
          rl.question('JWT 密钥 (留空将生成随机密钥): ', (jwtSecret) => {
            
            // 生成默认值
            const finalUsername = username || 'admin';
            const finalPassword = password || 'your_password';
            const finalCluster = cluster || 'cluster0.mongodb.net';
            const finalDbName = dbName || 'campus-platform';
            const finalJwtSecret = jwtSecret || generateRandomString(32);
            
            // 构建连接字符串
            const mongoURI = `mongodb+srv://${finalUsername}:${finalPassword}@${finalCluster}/${finalDbName}?retryWrites=true&w=majority`;
            
            // 创建 .env 文件内容
            const envContent = `# MongoDB 连接字符串
MONGODB_URI=${mongoURI}

# JWT 密钥
JWT_SECRET=${finalJwtSecret}

# 端口
PORT=5000

# 环境
NODE_ENV=development
`;
            
            // 写入文件
            try {
              fs.writeFileSync(envPath, envContent);
              console.log('\n✅ .env 文件创建成功！');
              console.log('\n📋 文件内容预览:');
              console.log('========================');
              console.log(envContent.replace(finalPassword, '***'));
              console.log('========================');
              console.log('\n🔑 重要提示:');
              console.log('1. 请确保 MongoDB Atlas 用户名和密码正确');
              console.log('2. 检查网络访问设置是否允许你的IP');
              console.log('3. 重启服务器以应用新配置');
              console.log('\n🚀 现在可以运行: npm run dev');
              
            } catch (error) {
              console.error('❌ 创建 .env 文件失败:', error.message);
            }
            
            rl.close();
          });
        });
      });
    });
  });
}

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
