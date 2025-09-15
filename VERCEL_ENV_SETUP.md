# 🚀 Vercel环境变量配置指南

## 📋 问题诊断

根据控制台错误信息，主要问题是：
1. **文件上传失败** - POST /api/upload 500错误
2. **文件预览失败** - 图片加载失败
3. **环境变量未正确设置** - 导致API URL构建错误

## 🔧 解决方案

### 1. 在Vercel控制台设置环境变量

#### 步骤：
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的 `platform-program` 项目
3. 点击 **Settings** 标签
4. 点击 **Environment Variables** 部分
5. 添加以下环境变量：

```bash
# 必需的环境变量
REACT_APP_API_URL = https://platform-program-production.up.railway.app
NODE_ENV = production
```

#### 详细配置：
- **Name**: `REACT_APP_API_URL`
- **Value**: `https://platform-program-production.up.railway.app`
- **Environment**: 选择 `Production`, `Preview`, `Development` (全选)
- **Description**: `Railway后端API地址`

- **Name**: `NODE_ENV`  
- **Value**: `production`
- **Environment**: 选择 `Production`, `Preview` (生产环境)
- **Description**: `生产环境标识`

### 2. 重新部署

设置环境变量后：
1. 在Vercel控制台点击 **Deployments** 标签
2. 找到最新的部署，点击 **Redeploy** 按钮
3. 或者推送新的代码触发自动部署

### 3. 验证配置

部署完成后，打开浏览器控制台，应该看到：
```
🚀 应用启动，开始环境检查...
🔍 环境变量检查: {
  NODE_ENV: "production",
  REACT_APP_API_URL: "https://platform-program-production.up.railway.app",
  isProduction: true,
  isDevelopment: false
}
✅ API连接成功: { status: "OK", ... }
```

## 🧪 测试功能

### 1. 测试文件上传
- 访问网站
- 尝试上传一个图片文件
- 检查控制台是否还有500错误

### 2. 测试文件预览
- 查看已有的艺术作品
- 点击文件预览
- 检查图片是否能正常加载

### 3. 测试API调用
- 访问个人信息页面
- 访问我的作品页面
- 检查是否还有CORS错误

## 🔍 故障排除

### 如果环境变量设置后仍有问题：

1. **检查环境变量是否正确设置**
   ```javascript
   // 在浏览器控制台运行
   console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
   ```

2. **检查API连接**
   ```javascript
   // 在浏览器控制台运行
   fetch('https://platform-program-production.up.railway.app/api/health')
     .then(r => r.json())
     .then(console.log);
   ```

3. **清除浏览器缓存**
   - 按 F12 打开开发者工具
   - 右键刷新按钮，选择"清空缓存并硬性重新加载"

### 常见问题：

1. **环境变量不生效**
   - 确保变量名以 `REACT_APP_` 开头
   - 重新部署应用
   - 清除浏览器缓存

2. **API调用失败**
   - 检查Railway后端是否正常运行
   - 验证CORS配置
   - 检查网络连接

3. **文件上传失败**
   - 检查文件大小限制
   - 验证文件类型是否支持
   - 检查Railway存储配置

## 📞 技术支持

如果问题仍然存在：
1. 运行 `node diagnose-deployment.js` 进行诊断
2. 检查Vercel和Railway的部署日志
3. 查看浏览器控制台的详细错误信息

## 🎯 预期结果

配置完成后，您的网站应该：
- ✅ 文件上传功能正常
- ✅ 文件预览功能正常
- ✅ 所有API调用正常
- ✅ 无CORS错误
- ✅ 无混合内容警告
