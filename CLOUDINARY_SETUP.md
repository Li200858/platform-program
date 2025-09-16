# ☁️ Cloudinary云存储配置指南

## 🚀 概述

Cloudinary是一个强大的云存储服务，专门用于图片、视频和其他媒体文件的存储、优化和交付。本应用已集成Cloudinary支持，可以自动处理文件上传、优化和CDN分发。

## 📋 配置步骤

### 1. 创建Cloudinary账户

1. 访问 [Cloudinary官网](https://cloudinary.com/)
2. 点击 "Sign Up For Free" 创建免费账户
3. 选择 "Developer" 计划（免费版包含25GB存储和25GB带宽）

### 2. 获取API凭据

登录Cloudinary控制台后：

1. 进入 **Dashboard** 页面
2. 找到 **API Keys** 部分
3. 复制以下信息：
   - **Cloud Name** (例如: `your-cloud-name`)
   - **API Key** (例如: `123456789012345`)
   - **API Secret** (例如: `abcdefghijklmnopqrstuvwxyz123456`)

### 3. 配置Railway环境变量

在Railway项目设置中添加以下环境变量：

```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

### 4. 验证配置

部署后访问以下端点验证配置：
- `https://your-app.railway.app/api/storage-config`

应该看到类似以下响应：
```json
{
  "storageType": "cloudinary",
  "cloudinary": {
    "configured": true,
    "connected": true
  },
  "local": {
    "configured": true,
    "path": "/app/uploads"
  }
}
```

## 🎯 功能特性

### ✅ **自动优化**
- 图片自动压缩和格式转换
- 响应式图片生成
- 质量自动调整

### ✅ **CDN分发**
- 全球CDN网络
- 快速文件访问
- 自动缓存管理

### ✅ **文件管理**
- 自动文件分类
- 版本控制
- 安全删除

### ✅ **多格式支持**
- 图片：JPG, PNG, GIF, WebP, SVG
- 视频：MP4, WebM, MOV
- 文档：PDF, DOC, TXT
- 音频：MP3, WAV, OGG

## 📊 成本估算

### 免费版 (Developer)
- **存储**: 25GB
- **带宽**: 25GB/月
- **转换**: 25,000次/月
- **管理**: 500次/月

### 付费版 (Advanced)
- **存储**: $0.10/GB/月
- **带宽**: $0.10/GB
- **转换**: $0.10/1000次
- **管理**: $0.10/1000次

## 🔧 高级配置

### 图片优化设置
```javascript
// 在cloudinaryStorage.js中可以自定义优化参数
const uploadOptions = {
  folder: 'platform-program',
  quality: 'auto:good',        // 自动质量优化
  fetch_format: 'auto',        // 自动格式选择
  width: 1920,                 // 最大宽度
  height: 1080,                // 最大高度
  crop: 'limit'                // 保持比例裁剪
};
```

### 视频优化设置
```javascript
const videoOptions = {
  folder: 'platform-program/videos',
  resource_type: 'video',
  quality: 'auto',
  format: 'mp4',
  width: 1280,
  height: 720
};
```

## 🚨 重要注意事项

### 1. **安全性**
- 不要将API Secret提交到代码仓库
- 使用环境变量存储敏感信息
- 定期轮换API密钥

### 2. **文件管理**
- 定期清理不需要的文件
- 监控存储使用量
- 设置文件生命周期策略

### 3. **性能优化**
- 使用适当的图片尺寸
- 启用CDN缓存
- 监控加载时间

## 🔍 故障排除

### 常见问题

#### 1. **上传失败**
```bash
# 检查环境变量
curl https://your-app.railway.app/api/storage-config
```

**解决方案**：
- 验证环境变量是否正确设置
- 检查API密钥是否有效
- 确认网络连接正常

#### 2. **文件无法访问**
**解决方案**：
- 检查文件URL格式
- 验证Cloudinary账户状态
- 确认文件权限设置

#### 3. **上传速度慢**
**解决方案**：
- 检查文件大小
- 优化图片质量设置
- 使用CDN加速

### 调试端点

- `/api/storage-config` - 查看存储配置状态
- `/api/upload` - 测试文件上传
- `/api/health` - 检查服务健康状态

## 📞 支持

如果遇到问题：

1. **检查日志**：查看Railway部署日志
2. **验证配置**：使用 `/api/storage-config` 端点
3. **测试连接**：尝试上传小文件
4. **联系支持**：Cloudinary官方支持

## 🎉 完成

配置完成后，您的应用将：
- ✅ 自动使用Cloudinary存储文件
- ✅ 享受CDN加速和全球分发
- ✅ 获得自动图片优化
- ✅ 支持多种文件格式
- ✅ 提供高可用性存储

现在您可以安全地上传文件，不用担心Railway重启导致文件丢失！
