# MongoDB 配置说明

## 问题诊断
根据错误信息 "MongoDB连接失败: MongoServerError: bad auth: Authentication failed"，这是认证失败的问题。

## 解决步骤

### 1. 创建环境变量文件
在 `server/` 目录下创建 `.env` 文件：

```bash
# MongoDB连接字符串
MONGODB_URI=mongodb+srv://admin:your_actual_password@cluster0.mongodb.net/campus-platform?retryWrites=true&w=majority

# JWT密钥
JWT_SECRET=your_super_secret_jwt_key_2025

# 端口
PORT=5000
```

### 2. 获取正确的MongoDB连接字符串
1. 登录 [MongoDB Atlas](https://cloud.mongodb.com)
2. 选择你的集群
3. 点击 "Connect"
4. 选择 "Connect your application"
5. 复制连接字符串

### 3. 修改连接字符串
将连接字符串中的以下部分替换为实际值：
- `admin` → 你的数据库用户名
- `your_actual_password` → 你的数据库密码
- `cluster0.mongodb.net` → 你的实际集群地址
- `campus-platform` → 你的数据库名称

### 4. 验证数据库用户
在 MongoDB Atlas 的 "Database Access" 页面：
- 确认用户存在且状态为 "Active"
- 确认用户有正确的权限（至少需要 `readWrite` 权限）
- 确认认证方法为 "SCRAM"

### 5. 检查网络访问
在 MongoDB Atlas 的 "Network Access" 页面：
- 确认你的IP地址已被添加到白名单
- 或者使用 `0.0.0.0/0` 允许所有IP访问（仅用于开发）

### 6. 测试连接
重启服务器：
```bash
cd server
npm run dev
```

## 常见问题

### 认证失败 (Error 8000)
- 检查用户名和密码是否正确
- 确认用户没有被锁定
- 验证数据库名称是否正确

### 连接超时
- 检查网络连接
- 确认防火墙设置
- 验证IP白名单配置

### 权限不足
- 确认用户有足够的数据库权限
- 检查用户角色设置

## 安全建议
- 生产环境不要使用 `0.0.0.0/0` 网络访问
- 使用强密码和复杂的JWT密钥
- 定期轮换密钥
- 限制数据库用户权限
