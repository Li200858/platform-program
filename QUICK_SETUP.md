# 🚀 快速设置指南

## ✅ 已完成
- 创始人邮箱已设置为: `18211080345@163.com`

## 📋 接下来需要完成的步骤

### 1. 配置数据库连接
编辑 `server/.env` 文件，将 MongoDB 连接字符串替换为你的实际数据库：

```bash
# 替换这一行
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/your_database

# 改为你的实际连接字符串，例如：
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campus-platform?retryWrites=true&w=majority
```

### 2. 设置 JWT 密钥
将 JWT_SECRET 替换为安全的随机字符串：

```bash
# 替换这一行
JWT_SECRET=your_jwt_secret_key

# 改为安全的密钥，例如：
JWT_SECRET=my_super_secret_jwt_key_2024_very_long_and_secure
```

### 3. 测试创始人功能
```bash
cd server
node setup-founder-email.js
```

### 4. 启动本地服务器测试
```bash
cd server
npm start
```

### 5. 部署到生产环境
在部署平台（Netlify/Vercel）设置环境变量：
- `MONGODB_URI`: 你的数据库连接字符串
- `JWT_SECRET`: 你的JWT密钥
- `FOUNDER_EMAILS`: `18211080345@163.com`

## 🎯 使用说明
- 使用 `18211080345@163.com` 注册或登录，将自动获得创始人权限
- 创始人可以访问"管理员面板"，管理用户权限和审核内容
- 支持设置多个创始人邮箱，用逗号分隔

## ⚠️ 注意事项
- 保护好 `.env` 文件，不要提交到版本控制
- 确保数据库连接字符串正确
- JWT密钥要足够复杂和安全
