# 🚀 Netlify部署指南

## 📋 部署前检查清单

### 1. 环境变量设置
在Netlify Dashboard中设置以下环境变量：

- **MONGODB_URI**: MongoDB数据库连接字符串
  - 格式: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
  - 确保包含用户名、密码、集群地址和数据库名
- **JWT_SECRET**: JWT认证密钥
  - 建议使用32位以上随机字符串
  - 可以使用在线生成器生成
- **FOUNDER_EMAILS**: 创始人邮箱列表（可选）
  - 格式: `founder@example.com,admin@example.com`
  - 用逗号分隔多个邮箱
  - 使用这些邮箱注册或登录的用户将自动获得创始人权限

### 2. 部署步骤
1. 将整个`deploy-package`文件夹拖拽到Netlify
2. 等待构建完成
3. 设置环境变量
4. 重新部署

### 3. 功能测试清单
- [ ] 创始人账户创建
- [ ] 用户注册登录
- [ ] 内容发布
- [ ] 文件上传
- [ ] 内容审核
- [ ] 权限管理

## 🔧 故障排除

### 环境变量检查
访问 `/api/env-check` 端点来检查环境变量配置状态

### 常见问题

#### 1. API 404错误
**症状**: 请求返回404状态码
**解决方案**: 
- 检查环境变量是否正确设置
- 确认Netlify函数已部署
- 检查netlify.toml中的重定向规则

#### 2. 数据库连接失败
**症状**: 返回500服务器错误，日志显示MongoDB连接失败
**解决方案**:
- 验证MONGODB_URI格式
- 检查MongoDB Atlas网络访问设置
- 确认数据库用户权限

#### 3. 认证失败
**症状**: JWT相关错误
**解决方案**:
- 确认JWT_SECRET已设置且长度足够
- 检查JWT_SECRET是否包含特殊字符

#### 4. CORS错误
**症状**: 浏览器控制台显示CORS错误
**解决方案**:
- 已修复，函数现在包含完整的CORS配置
- 如果仍有问题，检查浏览器缓存

### 调试步骤

1. **检查环境变量**
   ```
   GET /api/env-check
   ```

2. **查看Netlify函数日志**
   - 在Netlify Dashboard中查看函数日志
   - 检查是否有错误信息

3. **测试数据库连接**
   - 使用MongoDB Compass测试连接字符串
   - 确认网络访问权限

4. **验证函数部署**
   - 检查Netlify函数是否成功部署
   - 确认函数代码是最新版本

### 联系支持
如遇问题，请：
1. 检查环境变量配置
2. 查看Netlify函数日志
3. 访问 `/api/env-check` 获取诊断信息
4. 提供错误日志和配置信息
