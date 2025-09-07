# 🚀 创始人设置指南

## 第一步：设置创始人邮箱

### 1. 创建环境变量文件
在 `server` 目录下创建 `.env` 文件：

```bash
# MongoDB连接字符串
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/your_database

# JWT密钥
JWT_SECRET=your_jwt_secret_key

# 端口
PORT=5000

# 创始人邮箱列表（用逗号分隔，支持多个邮箱）
FOUNDER_EMAILS=你的邮箱@example.com
```

### 2. 替换为你的实际信息
- 将 `你的邮箱@example.com` 替换为你的真实邮箱
- 设置正确的 MongoDB 连接字符串
- 设置安全的 JWT 密钥

### 3. 测试创始人功能
```bash
cd server
node setup-founder-email.js
```

## 第二步：部署到生产环境

### 1. 设置部署环境变量
在 Netlify/Vercel 等平台设置：
- `MONGODB_URI`: 你的数据库连接字符串
- `JWT_SECRET`: 你的JWT密钥
- `FOUNDER_EMAILS`: 你的创始人邮箱

### 2. 部署网站
按照 `DEPLOYMENT_GUIDE.md` 的步骤部署

### 3. 验证创始人权限
- 使用创始人邮箱注册/登录
- 检查是否显示"管理员面板"按钮
- 测试用户管理和内容审核功能

## 优势
✅ 确保网站上线后立即具备完整管理功能
✅ 避免权限混乱和数据问题
✅ 可以立即开始管理用户和内容
✅ 防止普通用户误操作

## 注意事项
⚠️ 确保创始人邮箱设置正确
⚠️ 保护好环境变量，不要泄露
⚠️ 建议设置多个创始人邮箱作为备份
