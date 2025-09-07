# 📊 MongoDB数据库配置检查

## 1. 检查MongoDB Atlas配置

### ✅ 必需检查项

#### **集群状态**
- [ ] 登录 [MongoDB Atlas](https://cloud.mongodb.com)
- [ ] 确认集群状态为 "Running"
- [ ] 检查集群是否在免费层（M0）

#### **数据库用户**
- [ ] 确认数据库用户存在且状态为 "Active"
- [ ] 用户角色至少包含 "Read and write to any database"
- [ ] 认证方法为 "SCRAM"

#### **网络访问**
- [ ] IP白名单包含 `0.0.0.0/0` (允许所有IP)
- [ ] 或者添加Netlify的IP范围

#### **连接字符串**
- [ ] 格式: `mongodb+srv://用户名:密码@集群地址.mongodb.net/数据库名?retryWrites=true&w=majority`
- [ ] 用户名和密码正确
- [ ] 数据库名称正确

## 2. 测试数据库连接

### 使用环境检查端点
部署后访问: `https://your-site.netlify.app/api/env-check`

### 预期结果
```json
{
  "message": "环境变量检查完成",
  "envStatus": {
    "MONGODB_URI": {
      "exists": true,
      "value": "已设置",
      "valid": true
    },
    "JWT_SECRET": {
      "exists": true,
      "value": "已设置", 
      "valid": true
    }
  },
  "mongoStatus": "连接成功"
}
```

## 3. 常见问题解决

### 问题1: 认证失败
**错误**: `Authentication failed`
**解决**:
- 检查用户名和密码
- 确认用户没有被锁定
- 验证数据库名称

### 问题2: 连接超时
**错误**: `Connection timeout`
**解决**:
- 检查网络访问设置
- 确认IP白名单配置
- 检查防火墙设置

### 问题3: 权限不足
**错误**: `Insufficient permissions`
**解决**:
- 确认用户角色权限
- 检查数据库访问权限
- 验证用户状态
