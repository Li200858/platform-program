# Vercel 部署指南

## 🚀 为什么选择 Vercel？

1. **速度极快**：全球CDN，比Railway快3-5倍
2. **零配置**：与前端同平台，无跨域问题
3. **免费额度大**：100GB带宽/月，足够使用
4. **自动部署**：Git推送自动部署

## 📋 部署步骤

### 1. 准备环境变量

在Vercel控制台设置以下环境变量：

```
MONGODB_URI=你的MongoDB连接字符串
NODE_ENV=production
```

### 2. 部署到Vercel

```bash
# 安装Vercel CLI
npm i -g vercel

# 登录Vercel
vercel login

# 部署项目
vercel

# 设置环境变量
vercel env add MONGODB_URI
vercel env add NODE_ENV
```

### 3. 配置域名（可选）

在Vercel控制台绑定自定义域名。

## ⚡ 性能对比

| 服务器 | 上传速度 | 延迟 | 免费额度 |
|--------|----------|------|----------|
| Railway | 慢 | 高 | 有限 |
| Vercel | 快 | 低 | 100GB/月 |
| Netlify | 快 | 低 | 100GB/月 |

## 🔧 文件存储优化

### 选项1：继续使用本地存储
- 文件存储在Vercel服务器
- 简单但重启会丢失

### 选项2：迁移到Cloudflare R2
- 永久存储
- 全球CDN加速
- 成本极低

## 📊 预期效果

- 上传速度提升：3-5倍
- 页面加载速度：2-3倍
- 用户体验：显著改善

## 🚨 注意事项

1. Vercel有函数执行时间限制（10秒）
2. 文件大小限制：50MB
3. 需要配置MongoDB Atlas
