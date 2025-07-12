# 网站部署指南

## 方案一：Vercel + MongoDB Atlas（推荐）

### 1. 准备数据库

1. 注册 [MongoDB Atlas](https://www.mongodb.com/atlas) 账号
2. 创建免费集群
3. 创建数据库用户
4. 获取连接字符串

### 2. 部署后端到Vercel

1. 注册 [Vercel](https://vercel.com) 账号
2. 在项目根目录创建 `vercel.json` 文件：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.js"
    }
  ]
}
```

3. 将代码推送到GitHub
4. 在Vercel中导入项目
5. 设置环境变量：
   - `MONGODB_URI`: 你的MongoDB连接字符串
   - `JWT_SECRET`: 任意字符串作为JWT密钥

### 3. 部署前端到Vercel

1. 更新 `client/src/config.js` 中的API地址
2. 在Vercel中创建新项目，选择前端目录
3. 构建命令：`npm run build`
4. 输出目录：`build`

## 方案二：Netlify + Heroku

### 1. 部署后端到Heroku

1. 注册 [Heroku](https://heroku.com) 账号
2. 安装Heroku CLI
3. 在server目录创建 `Procfile`：
```
web: node index.js
```
4. 部署命令：
```bash
cd server
heroku create your-app-name
git add .
git commit -m "Initial commit"
git push heroku main
```

### 2. 部署前端到Netlify

1. 注册 [Netlify](https://netlify.com) 账号
2. 更新API地址为Heroku域名
3. 拖拽build文件夹到Netlify

## 方案三：Railway（全栈部署）

1. 注册 [Railway](https://railway.app) 账号
2. 连接GitHub仓库
3. 设置环境变量
4. 自动部署

## 本地测试部署

### 1. 构建前端
```bash
cd client
npm run build
```

### 2. 测试生产环境
```bash
cd server
npm start
```

## 注意事项

1. 确保所有API调用都使用相对路径或环境变量
2. 文件上传功能需要配置云存储（如AWS S3）
3. 设置CORS允许前端域名访问
4. 配置HTTPS证书
5. 设置域名（可选）

## 免费服务推荐

- **后端**: Vercel, Railway, Render
- **前端**: Vercel, Netlify, GitHub Pages
- **数据库**: MongoDB Atlas (免费层)
- **文件存储**: Cloudinary (免费层) 