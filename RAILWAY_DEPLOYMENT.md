# Railway 部署指南

## 🚀 Railway 部署步骤

### 1. 准备工作
- 确保您有Railway账户
- 确保MongoDB Atlas集群已设置
- 确保环境变量已准备

### 2. 部署步骤

#### 步骤1: 连接GitHub
1. 访问 [Railway](https://railway.app)
2. 点击 "Login" 并选择 "Login with GitHub"
3. 授权Railway访问您的GitHub仓库

#### 步骤2: 创建新项目
1. 在Railway控制台点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择您的 `platform-program` 仓库
4. 点击 "Deploy Now"

#### 步骤3: 配置环境变量
在Railway项目设置中添加以下环境变量：

```bash
# 数据库配置
MONGODB_URI=mongodb+srv://用户名:密码@集群地址/数据库名?retryWrites=true&w=majority

# JWT配置
JWT_SECRET=您的JWT密钥（至少32个字符）

# 创始人邮箱（可选）
FOUNDER_EMAILS=您的邮箱@example.com

# 端口配置
PORT=5000
```

#### 步骤4: 配置构建设置
1. 在Railway项目设置中，找到 "Settings" → "Build"
2. 设置以下配置：
   - **Root Directory**: `/` (根目录)
   - **Build Command**: `cd client && npm install && npm run build`
   - **Start Command**: `cd server && npm start`

#### 步骤5: 配置域名
1. 在Railway项目设置中，找到 "Settings" → "Domains"
2. 点击 "Generate Domain" 生成Railway域名
3. 或者添加自定义域名

### 3. 验证部署

#### 检查部署状态
1. 在Railway控制台查看部署日志
2. 确保所有构建步骤成功
3. 检查服务是否正常运行

#### 测试功能
1. 访问您的Railway域名
2. 测试用户注册和登录
3. 测试内容发布功能
4. 测试管理员功能

### 4. 常见问题

#### 构建失败
- 检查Node.js版本（需要18+）
- 检查package.json中的依赖
- 查看构建日志中的错误信息

#### 数据库连接失败
- 检查MONGODB_URI格式
- 确保MongoDB Atlas网络访问设置正确
- 检查数据库用户权限

#### 环境变量问题
- 确保所有必需的环境变量都已设置
- 检查环境变量名称和值是否正确
- 重启服务使环境变量生效

### 5. 监控和维护

#### 查看日志
1. 在Railway控制台点击 "View Logs"
2. 监控应用运行状态
3. 查看错误和警告信息

#### 性能监控
1. 在Railway控制台查看 "Metrics"
2. 监控CPU、内存使用情况
3. 监控请求响应时间

#### 自动部署
- Railway会自动监听GitHub仓库的推送
- 每次推送都会触发自动部署
- 可以在设置中配置部署分支

### 6. 费用说明
- Railway提供免费额度
- 超出免费额度后按使用量计费
- 可以设置使用限制和告警

## 🔧 高级配置

### 自定义构建
如果需要自定义构建过程，可以修改 `railway.json` 文件：

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd client && npm install && npm run build"
  },
  "deploy": {
    "startCommand": "cd server && npm start"
  }
}
```

### 环境变量管理
- 在Railway控制台管理环境变量
- 支持不同环境的不同配置
- 可以设置敏感信息的加密存储

### 数据库备份
- 建议定期备份MongoDB数据
- 可以使用MongoDB Atlas的自动备份功能
- 或者使用Railway的数据库服务

## 📞 支持
如果遇到问题，可以：
1. 查看Railway官方文档
2. 在Railway Discord社区寻求帮助
3. 检查GitHub Issues
