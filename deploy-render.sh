#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}  校园艺术平台 - Render 部署脚本      ${NC}"
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
        fromDatabase:
          name: platform-program-db
          property: connectionString

  # 数据库服务
  - type: pserv
    name: platform-program-db
    env: docker
    plan: free
    dockerfilePath: ./Dockerfile.mongodb
    envVars:
      - key: MONGO_INITDB_ROOT_USERNAME
        value: admin
      - key: MONGO_INITDB_ROOT_PASSWORD
        value: password123
      - key: MONGO_INITDB_DATABASE
        value: platform-program
EOF

# 创建 MongoDB Dockerfile
cat > Dockerfile.mongodb << 'EOF'
FROM mongo:7.0

# 设置环境变量
ENV MONGO_INITDB_ROOT_USERNAME=admin
ENV MONGO_INITDB_ROOT_PASSWORD=password123
ENV MONGO_INITDB_DATABASE=platform-program

# 创建数据目录
RUN mkdir -p /data/db

# 暴露端口
EXPOSE 27017

# 启动 MongoDB
CMD ["mongod", "--auth"]
EOF

# 创建 Docker Compose 文件（用于本地测试）
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: platform-program-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: platform-program
    volumes:
      - mongodb_data:/data/db

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: platform-program-backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      PORT: 5000
      MONGODB_URI: mongodb://admin:password123@mongodb:27017/platform-program?authSource=admin
    depends_on:
      - mongodb

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: platform-program-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
EOF

# 创建后端 Dockerfile
cat > Dockerfile.backend << 'EOF'
FROM node:18-alpine

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY server/package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY server/ ./

# 创建上传目录
RUN mkdir -p uploads

# 暴露端口
EXPOSE 5000

# 启动应用
CMD ["node", "index.js"]
EOF

# 创建前端 Dockerfile
cat > Dockerfile.frontend << 'EOF'
FROM node:18-alpine as builder

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY client/package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY client/ ./

# 构建应用
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建文件
COPY --from=builder /app/build /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
EOF

# 创建 nginx 配置
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # 处理 React Router
        location / {
            try_files $uri $uri/ /index.html;
        }

        # 代理 API 请求到后端
        location /api/ {
            proxy_pass http://backend:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # 代理文件上传请求
        location /uploads/ {
            proxy_pass http://backend:5000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

# 创建部署说明
cat > DEPLOY_RENDER.md << 'EOF'
# 校园艺术平台 - Render 部署指南

## 🚀 部署步骤

### 方法一：使用 Render Dashboard（推荐）

1. 访问 [Render](https://render.com)
2. 连接 GitHub 仓库
3. 创建以下服务：
   - **Web Service** (后端)
   - **Static Site** (前端)
   - **PostgreSQL** 或 **MongoDB** (数据库)

### 方法二：使用 Docker Compose

1. 安装 Docker 和 Docker Compose
2. 运行: `docker-compose up -d`
3. 访问: http://localhost:3000

## 🔧 优势

- **免费层支持**: 提供 750 小时/月免费使用
- **自动部署**: 连接 GitHub 自动部署
- **HTTPS**: 自动提供 SSL 证书
- **简单易用**: 一个平台部署所有服务
- **自动扩展**: 根据流量自动扩展

## 📊 成本对比

| 服务 | 免费层 | 付费层 |
|------|--------|--------|
| Render | 750小时/月 | $7/月 |
| **总计** | **完全免费** | **$7/月** |

## 🆚 与之前方案对比

| 特性 | Vercel+Railway+Cloudinary | Render |
|------|---------------------------|--------|
| 成本 | $50/月 | $7/月 |
| 复杂度 | 3个平台 | 1个平台 |
| 部署 | 需要分别部署 | 一键部署 |
| 维护 | 需要管理多个服务 | 统一管理 |
| 学习成本 | 高 | 低 |

## 🎯 推荐理由

1. **最便宜**: 免费层完全够用
2. **最简单**: 一个平台解决所有问题
3. **最快速**: 一键部署
4. **最稳定**: 企业级服务
5. **最易维护**: 统一管理界面

## 📝 环境变量配置

在 Render Dashboard 中配置以下环境变量：

```
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_connection_string
```

## 🚀 快速开始

1. 推送代码到 GitHub
2. 在 Render 中连接仓库
3. 选择 "New Web Service"
4. 配置环境变量
5. 点击 "Deploy"

就这么简单！
EOF

echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}  🎉 Render 部署配置完成！            ${NC}"
echo -e "${GREEN}=======================================${NC}"

echo -e "${BLUE}📝 下一步操作:${NC}"
echo -e "1. 访问 https://render.com 注册账号"
echo -e "2. 连接 GitHub 仓库"
echo -e "3. 创建 Web Service 和数据库"
echo -e "4. 配置环境变量"
echo -e "5. 一键部署"

echo -e "${YELLOW}💡 优势:${NC}"
echo -e "• 免费层提供 750 小时/月"
echo -e "• 一个平台部署所有服务"
echo -e "• 自动 HTTPS 和扩展"
echo -e "• 比之前方案便宜 85%"

echo -e "${GREEN}=======================================${NC}"
