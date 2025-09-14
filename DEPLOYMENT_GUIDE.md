# 部署指南 - Railway + Vercel

## 🚀 快速部署步骤

### 1. Railway 后端部署

#### 步骤 1: 创建 Railway 项目
1. 访问 [Railway.app](https://railway.app)
2. 使用 GitHub 登录
3. 点击 "New Project" -> "Deploy from GitHub repo"
4. 选择您的 `platform-program` 仓库
5. 选择 "Deploy Now"

#### 步骤 2: 配置环境变量
在 Railway 项目设置中添加以下环境变量：

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/platform-program
PORT=5000
NODE_ENV=production
INITIAL_ADMIN=admin
```

#### 步骤 3: 配置构建设置
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

#### 步骤 4: 获取后端URL
部署完成后，Railway 会提供一个类似 `https://platform-program-production.up.railway.app` 的URL

### 2. Vercel 前端部署

#### 步骤 1: 创建 Vercel 项目
1. 访问 [Vercel.com](https://vercel.com)
2. 使用 GitHub 登录
3. 点击 "New Project"
4. 导入您的 `platform-program` 仓库

#### 步骤 2: 配置构建设置
- **Framework Preset**: Create React App
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `build`

#### 步骤 3: 配置环境变量
在 Vercel 项目设置中添加：

```bash
REACT_APP_API_URL=https://your-railway-backend-url.railway.app
```

#### 步骤 4: 更新 vercel.json
将 `vercel.json` 中的后端URL替换为您的实际Railway URL：

```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-actual-railway-url.railway.app/api/$1"
    }
  ]
}
```

### 3. 数据库设置

#### MongoDB Atlas 配置
1. 访问 [MongoDB Atlas](https://cloud.mongodb.com)
2. 创建新集群
3. 创建数据库用户
4. 获取连接字符串
5. 在 Railway 环境变量中设置 `MONGODB_URI`

### 4. 部署后测试

#### 后端测试
```bash
# 健康检查
curl https://your-railway-url.railway.app/api/health

# 测试API
curl https://your-railway-url.railway.app/api/arts
```

#### 前端测试
1. 访问 Vercel 提供的URL
2. 测试作品发布功能
3. 测试文件上传
4. 测试用户注册/登录
5. 测试所有核心功能

### 5. 域名配置（可选）

#### 自定义域名
- **Railway**: 在项目设置中添加自定义域名
- **Vercel**: 在项目设置中添加自定义域名

## 🔧 故障排除

### 常见问题

1. **CORS 错误**
   - 确保 Railway 后端允许 Vercel 域名
   - 检查 `cors()` 配置

2. **API 连接失败**
   - 检查 `REACT_APP_API_URL` 环境变量
   - 确认 Railway URL 正确

3. **文件上传失败**
   - 检查 Railway 存储配置
   - 确认文件大小限制

4. **数据库连接失败**
   - 检查 `MONGODB_URI` 格式
   - 确认数据库用户权限

### 监控和日志

- **Railway**: 在项目面板查看日志
- **Vercel**: 在函数日志中查看错误
- **MongoDB**: 在 Atlas 中查看连接状态

## 📝 部署检查清单

- [ ] Railway 后端部署成功
- [ ] 环境变量配置正确
- [ ] MongoDB 连接正常
- [ ] Vercel 前端部署成功
- [ ] API 路由配置正确
- [ ] 文件上传功能正常
- [ ] 用户认证功能正常
- [ ] 所有页面正常访问

## 🎉 完成！

部署完成后，您的艺术平台将在以下地址运行：
- **前端**: `https://your-vercel-app.vercel.app`
- **后端**: `https://your-railway-app.railway.app`
