# Vercel 部署指南

## 🚀 Vercel 部署步骤

### 1. 准备工作
- 确保您有Vercel账户
- 确保MongoDB Atlas集群已设置
- 确保环境变量已准备

### 2. 部署步骤

#### 步骤1: 连接GitHub
1. 访问 [Vercel](https://vercel.com)
2. 点击 "Sign Up" 并选择 "Continue with GitHub"
3. 授权Vercel访问您的GitHub仓库

#### 步骤2: 导入项目
1. 在Vercel控制台点击 "New Project"
2. 选择 "Import Git Repository"
3. 选择您的 `platform-program` 仓库
4. 点击 "Import"

#### 步骤3: 配置构建设置
在项目配置页面设置：

```bash
# 构建设置
Framework Preset: Create React App
Root Directory: client
Build Command: npm run build
Output Directory: build
Install Command: npm install
```

#### 步骤4: 配置环境变量
在 "Environment Variables" 部分添加：

```bash
# 数据库配置
MONGODB_URI=mongodb+srv://用户名:密码@集群地址/数据库名?retryWrites=true&w=majority

# JWT配置
JWT_SECRET=您的JWT密钥（至少32个字符）

# 创始人邮箱（可选）
FOUNDER_EMAILS=您的邮箱@example.com

# API基础URL（部署后更新）
REACT_APP_API_URL=https://您的Railway域名
```

#### 步骤5: 部署
1. 点击 "Deploy" 开始部署
2. 等待构建完成
3. 获取部署URL

### 3. 配置API连接

#### 更新API配置
部署完成后，需要更新前端的API配置：

1. 在Vercel项目设置中找到环境变量
2. 更新 `REACT_APP_API_URL` 为您的Railway后端URL
3. 重新部署项目

#### 修改config.js
确保 `client/src/config.js` 中的配置正确：

```javascript
const config = {
  API_BASE_URL: process.env.REACT_APP_API_URL || 'https://您的Railway域名',
};

export default config;
```

### 4. 验证部署

#### 检查部署状态
1. 在Vercel控制台查看部署日志
2. 确保构建成功
3. 检查部署URL是否可访问

#### 测试功能
1. 访问您的Vercel域名
2. 测试前端页面加载
3. 测试与后端API的连接
4. 测试所有功能是否正常

### 5. 常见问题

#### 构建失败
- 检查Node.js版本兼容性
- 检查package.json中的依赖
- 查看构建日志中的错误信息
- 确保所有环境变量都已设置

#### API连接失败
- 检查REACT_APP_API_URL是否正确
- 确保Railway后端服务正常运行
- 检查CORS设置
- 验证网络连接

#### 环境变量问题
- 确保所有必需的环境变量都已设置
- 检查环境变量名称前缀（REACT_APP_）
- 重新部署使环境变量生效

### 6. 自动部署

#### GitHub集成
- Vercel会自动监听GitHub仓库的推送
- 每次推送到主分支都会触发自动部署
- 可以在设置中配置部署分支

#### 预览部署
- 每次Pull Request都会创建预览部署
- 可以测试功能后再合并到主分支
- 支持多环境部署

### 7. 性能优化

#### 构建优化
- Vercel会自动优化React应用
- 支持代码分割和懒加载
- 自动压缩和优化资源

#### CDN加速
- Vercel使用全球CDN
- 自动优化静态资源加载
- 支持边缘计算

### 8. 监控和分析

#### 性能监控
1. 在Vercel控制台查看 "Analytics"
2. 监控页面加载性能
3. 查看用户访问统计

#### 错误监控
1. 查看 "Functions" 标签页
2. 监控API调用状态
3. 查看错误日志

### 9. 自定义域名

#### 添加域名
1. 在Vercel项目设置中找到 "Domains"
2. 点击 "Add Domain"
3. 输入您的自定义域名
4. 配置DNS记录

#### SSL证书
- Vercel自动提供SSL证书
- 支持HTTPS访问
- 自动续期

## 🔧 高级配置

### 自定义构建
如果需要自定义构建过程，可以修改 `vercel.json` 文件：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "dest": "/static/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### 环境变量管理
- 在Vercel控制台管理环境变量
- 支持不同环境的不同配置
- 可以设置敏感信息的加密存储

### 函数部署
如果需要部署API函数到Vercel：
1. 创建 `api` 目录
2. 将后端函数移动到 `api` 目录
3. 配置 `vercel.json` 路由

## 📞 支持
如果遇到问题，可以：
1. 查看Vercel官方文档
2. 在Vercel Discord社区寻求帮助
3. 检查GitHub Issues