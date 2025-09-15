# Railway 部署设置指南

## 🚀 部署步骤

### 1. 在Railway中设置环境变量

在Railway项目设置中添加以下环境变量：

```bash
# 必需的环境变量
MONGODB_URI=mongodb+srv://用户名:密码@集群地址/数据库名?retryWrites=true&w=majority
NODE_ENV=production
PORT=5000

# 可选的环境变量
JWT_SECRET=您的JWT密钥（至少32个字符）
```

### 2. 获取MongoDB连接字符串

1. 访问 [MongoDB Atlas](https://cloud.mongodb.com)
2. 登录您的账户
3. 选择您的集群
4. 点击 "Connect" -> "Connect your application"
5. 复制连接字符串
6. 替换 `<username>` 和 `<password>` 为您的数据库用户凭据
7. 替换 `<dbname>` 为 `platform-program`

### 3. 部署配置

Railway会自动使用以下配置：
- **构建命令**: `cd server && npm install`
- **启动命令**: `cd server && npm start`
- **健康检查路径**: `/api/health`
- **健康检查超时**: 30秒

### 4. 验证部署

部署完成后，访问以下URL验证：

```bash
# 健康检查
https://your-app.railway.app/api/health

# 应该返回类似以下内容：
{
  "status": "OK",
  "message": "艺术平台API服务运行正常",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "2.0.0",
  "mongodb": {
    "status": "connected",
    "readyState": 1
  },
  "environment": {
    "nodeEnv": "production",
    "port": "5000"
  }
}
```

### 5. 常见问题解决

#### MongoDB连接失败
- 检查MONGODB_URI格式是否正确
- 确认数据库用户有正确的权限
- 检查网络访问列表是否包含Railway的IP

#### 健康检查失败
- 确认健康检查超时时间足够（已设置为30秒）
- 检查服务器日志中的错误信息
- 确认端口配置正确

#### 部署失败
- 检查构建命令是否正确
- 确认所有依赖都已安装
- 查看Railway构建日志

## 📊 监控

部署成功后，您可以在Railway控制台中：
- 查看实时日志
- 监控资源使用情况
- 查看部署历史
- 管理环境变量

## 🔧 故障排除

如果遇到问题，请检查：
1. 环境变量是否正确设置
2. MongoDB连接字符串格式
3. 网络访问权限
4. 服务器日志中的错误信息
