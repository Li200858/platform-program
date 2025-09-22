#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}  校园艺术平台 - Render + MongoDB 部署  ${NC}"
echo -e "${GREEN}=======================================${NC}"

# 创建 Render 配置文件
echo -e "${YELLOW}📝 创建 Render 配置...${NC}"

# 创建 render.yaml
cat > render.yaml << 'EOF'
services:
  # 前端服务
  - type: web
    name: platform-program-frontend
    env: static
    buildCommand: cd client && npm install && npm run build
    staticPublishPath: ./client/build
    routes:
      - type: rewrite
        source: /*
        destination: /index.html

  # 后端服务
  - type: web
    name: platform-program-backend
    env: node
    buildCommand: cd server && npm install
    startCommand: cd server && node index.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: MONGODB_URI
        value: your_mongodb_atlas_connection_string
EOF

# 创建环境变量文件
echo -e "${YELLOW}📝 创建环境变量文件...${NC}"

cat > .env.production << 'EOF'
# 生产环境配置
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_atlas_connection_string
EOF

# 创建部署说明
cat > DEPLOY_RENDER_MONGODB.md << 'EOF'
# 校园艺术平台 - Render + MongoDB Atlas 部署指南

## 🚀 部署步骤

### 1. 准备 MongoDB Atlas

1. 访问 [MongoDB Atlas](https://cloud.mongodb.com)
2. 创建免费集群 (如果还没有)
3. 获取连接字符串
4. 确保数据库可以公开访问

### 2. 在 Render 创建服务

#### 前端服务 (Static Site)
1. 访问 [Render](https://render.com)
2. 点击 "New +" → "Static Site"
3. 连接 GitHub 仓库
4. 配置：
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/build`
   - **Environment**: `Static`

#### 后端服务 (Web Service)
1. 在 Render 点击 "New +" → "Web Service"
2. 连接 GitHub 仓库
3. 配置：
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && node index.js`
   - **Environment**: `Node`

### 3. 配置环境变量

在 Render 后端服务中设置：
```
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_atlas_connection_string
```

### 4. 配置文件存储

Render 提供内置文件存储，无需额外配置。

## 🔧 优势

- **成本最低**: 完全免费
- **简单迁移**: 只需迁移应用层
- **数据安全**: 数据库保持不变
- **快速部署**: 5分钟上线

## 📊 成本对比

| 服务 | 当前成本 | 新方案成本 |
|------|----------|------------|
| 前端 | Vercel $20/月 | Render $0/月 |
| 后端 | Railway $5/月 | Render $0/月 |
| 数据库 | MongoDB Atlas $0/月 | MongoDB Atlas $0/月 |
| 文件存储 | Cloudinary $25/月 | Render $0/月 |
| **总计** | **$50/月** | **$0/月** |

## 🎯 迁移步骤

1. **保留 MongoDB Atlas** - 不需要任何更改
2. **在 Render 创建服务** - 按照上述步骤
3. **配置环境变量** - 使用现有的 MongoDB 连接字符串
4. **部署** - 一键部署
5. **测试** - 验证所有功能正常
6. **停用旧服务** - 关闭 Vercel 和 Railway

## ✅ 验证清单

- [ ] MongoDB Atlas 连接正常
- [ ] 前端可以访问后端 API
- [ ] 文件上传功能正常
- [ ] 数据库操作正常
- [ ] 所有功能测试通过

## 🆘 故障排除

### 数据库连接问题
- 检查 MongoDB Atlas 网络访问设置
- 确认连接字符串正确
- 检查环境变量配置

### 文件上传问题
- 检查 Render 文件存储配置
- 确认上传路径正确

### API 连接问题
- 检查前端 API 基础 URL
- 确认 CORS 设置正确
EOF

echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}  🎉 Render + MongoDB 配置完成！      ${NC}"
echo -e "${GREEN}=======================================${NC}"

echo -e "${BLUE}📝 下一步操作:${NC}"
echo -e "1. 确保 MongoDB Atlas 正常运行"
echo -e "2. 访问 https://render.com 创建服务"
echo -e "3. 配置环境变量"
echo -e "4. 一键部署"

echo -e "${YELLOW}💡 优势:${NC}"
echo -e "• 完全免费 (MongoDB Atlas 免费 + Render 免费)"
echo -e "• 无需修改数据库代码"
echo -e "• 快速迁移 (只迁移应用层)"
echo -e "• 成本降低 100% (从 $50/月 到 $0/月)"

echo -e "${GREEN}=======================================${NC}"
