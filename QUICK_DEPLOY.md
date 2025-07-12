# 🚀 快速部署指南

## 第一步：准备数据库

1. 访问 [MongoDB Atlas](https://www.mongodb.com/atlas)
2. 注册免费账号
3. 创建新集群（选择免费层）
4. 创建数据库用户（记住用户名和密码）
5. 获取连接字符串，格式如下：
   ```
   mongodb+srv://用户名:密码@集群地址.mongodb.net/数据库名
   ```

## 第二步：部署后端

### 方法A：使用Vercel（推荐）

1. 注册 [Vercel](https://vercel.com) 账号
2. 将代码推送到GitHub
3. 在Vercel中导入项目
4. 设置环境变量：
   - `MONGODB_URI`: 你的MongoDB连接字符串
   - `JWT_SECRET`: 任意字符串（如：mysecretkey123）
5. 部署

### 方法B：使用Railway

1. 注册 [Railway](https://railway.app) 账号
2. 连接GitHub仓库
3. 设置环境变量（同上）
4. 自动部署

## 第三步：部署前端

1. 更新 `client/src/config.js` 中的API地址为你的后端域名
2. 在Vercel中创建新项目，选择 `client` 目录
3. 构建命令：`npm run build`
4. 输出目录：`build`

## 第四步：测试

1. 访问你的前端域名
2. 注册新用户
3. 测试各项功能

## 常见问题

### Q: 文件上传不工作？
A: 需要配置云存储，推荐使用Cloudinary：
1. 注册 [Cloudinary](https://cloudinary.com)
2. 获取API密钥
3. 修改文件上传逻辑

### Q: 数据库连接失败？
A: 检查MongoDB Atlas设置：
1. 确保IP白名单包含 `0.0.0.0/0`
2. 检查用户名密码是否正确
3. 确认集群状态

### Q: 前端无法访问后端？
A: 检查CORS设置和API地址配置

## 免费服务推荐

- **后端**: Vercel, Railway, Render
- **前端**: Vercel, Netlify
- **数据库**: MongoDB Atlas
- **文件存储**: Cloudinary

## 一键部署命令

```bash
# 1. 构建前端
cd client && npm run build

# 2. 检查构建结果
ls -la build/

# 3. 推送代码到GitHub
git add .
git commit -m "准备部署"
git push origin main
```

## 部署后检查清单

- [ ] 数据库连接正常
- [ ] 用户注册登录正常
- [ ] 文件上传功能正常
- [ ] 内容发布功能正常
- [ ] 管理员功能正常
- [ ] 移动端适配正常

## 自定义域名（可选）

1. 购买域名
2. 在Vercel中配置自定义域名
3. 更新DNS记录
4. 配置SSL证书

## 性能优化

1. 启用CDN
2. 压缩静态资源
3. 使用缓存策略
4. 优化图片加载

---

🎉 **恭喜！你的网站已经可以供其他用户访问了！** 