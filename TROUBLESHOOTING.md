# 🚨 问题解决指南

## 当前问题
- 终端显示MongoDB连接失败
- 网站显示网络错误
- Vercel测试时无法登录

## 🔧 快速解决方案

### 方法1：使用自动配置脚本（推荐）

#### macOS/Linux 用户：
```bash
cd server
./quick-start.sh
```

#### Windows 用户：
```cmd
cd server
quick-start.bat
```

### 方法2：手动配置

#### 步骤1：创建环境变量文件
在 `server/` 目录下创建 `.env` 文件：

```bash
# MongoDB连接字符串
MONGODB_URI=mongodb+srv://admin:your_password@cluster0.mongodb.net/campus-platform?retryWrites=true&w=majority

# JWT密钥
JWT_SECRET=your_super_secret_jwt_key_2025

# 端口
PORT=5000
```

#### 步骤2：获取MongoDB连接信息
1. 登录 [MongoDB Atlas](https://cloud.mongodb.com)
2. 选择你的集群
3. 点击 "Connect"
4. 选择 "Connect your application"
5. 复制连接字符串

#### 步骤3：修改连接字符串
替换以下部分：
- `admin` → 你的用户名
- `your_password` → 你的密码
- `cluster0.mongodb.net` → 你的集群地址
- `campus-platform` → 你的数据库名

#### 步骤4：重启服务器
```bash
cd server
npm run dev
```

## 🔍 问题诊断

### 错误类型：认证失败 (Error 8000)
**原因**：用户名、密码或数据库名错误
**解决**：
- 检查MongoDB Atlas的用户凭据
- 确认数据库名称正确
- 验证用户权限设置

### 错误类型：连接超时
**原因**：网络问题或IP限制
**解决**：
- 检查网络连接
- 确认IP地址已添加到MongoDB Atlas白名单
- 验证防火墙设置

### 错误类型：权限不足
**原因**：用户角色权限不够
**解决**：
- 在MongoDB Atlas中检查用户角色
- 确保用户有 `readWrite` 权限
- 考虑使用 `atlasAdmin` 角色进行测试

## 📱 前端问题解决

### 网络错误
**原因**：后端服务未启动或配置错误
**解决**：
1. 确保后端服务器正在运行
2. 检查 `client/src/config.js` 中的API地址
3. 确认CORS配置正确

### 登录失败
**原因**：后端API不可用或数据库连接失败
**解决**：
1. 检查后端服务器状态
2. 验证MongoDB连接
3. 查看服务器控制台错误信息

## 🚀 部署到Vercel

### 环境变量设置
在Vercel项目设置中添加：
- `MONGODB_URI`：你的MongoDB连接字符串
- `JWT_SECRET`：你的JWT密钥

### 网络访问配置
确保MongoDB Atlas允许Vercel的IP地址访问，或使用 `0.0.0.0/0` 允许所有IP（仅用于开发）

## 📞 获取帮助

如果问题仍然存在：
1. 检查 `server/MONGODB_SETUP.md` 详细说明
2. 查看服务器控制台错误信息
3. 确认MongoDB Atlas服务状态
4. 验证网络连接和防火墙设置

## ✅ 成功标志

当问题解决后，你应该看到：
- 服务器控制台显示 "MongoDB连接成功"
- 前端能够正常登录和注册
- 所有功能模块正常工作
- 没有网络错误提示
