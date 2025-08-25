# Vercel 部署指南 - 解决404错误

## 问题分析

你的项目出现404错误的主要原因：

1. **缺少 `vercel.json` 配置文件**
2. **项目结构配置不正确**
3. **前端构建文件路径配置错误**

## 解决方案

### 1. 确保项目结构正确

```
platform-program/
├── vercel.json          # Vercel配置文件（新创建）
├── client/              # 前端React应用
│   ├── build/          # 构建输出目录
│   ├── src/
│   └── package.json
├── server/              # 后端Node.js应用
│   ├── index.js        # 服务器入口文件
│   └── package.json
└── package.json         # 根目录package.json
```

### 2. 重新部署步骤

#### 步骤1: 构建前端
```bash
cd client
npm run build
cd ..
```

#### 步骤2: 使用Vercel CLI部署
```bash
# 安装Vercel CLI（如果未安装）
npm install -g vercel

# 登录Vercel
vercel login

# 部署到生产环境
vercel --prod
```

#### 步骤3: 设置环境变量
在Vercel控制台中设置以下环境变量：

- `MONGODB_URI`: `mongodb+srv://Changxuan:QpX3zlJncWeel9wG@cluster0.pooufxr.mongodb.net/platform-program?retryWrites=true&w=majority`
- `JWT_SECRET`: `eVHxwFaJcUDuPv60KJLWpvKs62ulHYwZ`

### 3. 验证部署

部署完成后，检查：

1. **前端页面**: 访问你的Vercel域名，应该能看到React应用
2. **API接口**: 访问 `你的域名/api/hello` 应该能看到API响应
3. **控制台日志**: 在Vercel控制台查看部署日志

### 4. 常见问题排查

#### 问题1: 仍然显示404
- 检查 `vercel.json` 文件是否正确创建
- 确认前端已成功构建（`client/build/` 目录存在）
- 重新部署项目

#### 问题2: API接口404
- 检查环境变量是否正确设置
- 确认MongoDB连接字符串有效
- 查看Vercel函数日志

#### 问题3: 前端路由问题
- 确认 `vercel.json` 中的 `rewrites` 配置正确
- 检查React Router配置

### 5. 测试API接口

部署成功后，测试以下接口：

```bash
# 测试健康检查
curl https://你的域名/api/hello

# 测试用户注册
curl -X POST https://你的域名/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123","email":"test@example.com"}'
```

### 6. 监控和维护

1. **定期检查Vercel控制台**的部署状态
2. **监控API响应时间**和错误率
3. **查看MongoDB连接状态**
4. **备份重要数据**

## 联系支持

如果问题仍然存在：

1. 检查Vercel控制台的错误日志
2. 确认所有环境变量正确设置
3. 重新构建和部署项目
4. 联系Vercel技术支持

## 成功部署后的URL

- **前端应用**: `https://你的域名`
- **API接口**: `https://你的域名/api/*`
- **管理面板**: `https://你的域名/admin`
