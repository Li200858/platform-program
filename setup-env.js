const fs = require('fs');
const path = require('path');

// 创建 .env 文件
const envContent = `# MongoDB连接字符串
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/your_database

# JWT密钥
JWT_SECRET=your_jwt_secret_key

# 端口
PORT=5000

# 创始人邮箱列表（用逗号分隔，支持多个邮箱）
# 使用这些邮箱注册或登录的用户将自动获得创始人权限
FOUNDER_EMAILS=18211080345@163.com
`;

const envPath = path.join(__dirname, 'server', '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env 文件创建成功！');
  console.log('📧 创始人邮箱已设置为: 18211080345@163.com');
  console.log('\n📋 接下来需要：');
  console.log('1. 编辑 server/.env 文件，设置正确的 MongoDB 连接字符串');
  console.log('2. 设置安全的 JWT_SECRET');
  console.log('3. 运行: node setup-founder-email.js');
} catch (error) {
  console.error('❌ 创建 .env 文件失败:', error.message);
}
