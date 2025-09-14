#!/bin/bash

echo "🚀 开始部署到 Railway..."
echo "================================"

# 检查是否安装了 Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI 未安装"
    echo "请先安装: npm install -g @railway/cli"
    echo "然后运行: railway login"
    exit 1
fi

# 检查是否已登录
if ! railway whoami &> /dev/null; then
    echo "❌ 请先登录 Railway"
    echo "运行: railway login"
    exit 1
fi

echo "✅ Railway CLI 已就绪"

# 进入服务器目录
cd server

echo "📦 安装依赖..."
npm install

echo "🔧 配置环境变量..."
echo "请在 Railway 项目设置中配置以下环境变量："
echo "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/platform-program"
echo "PORT=5000"
echo "NODE_ENV=production"
echo "INITIAL_ADMIN=admin"

echo ""
echo "🚀 开始部署..."
railway up

echo "✅ Railway 部署完成！"
echo "请记录您的 Railway URL 用于 Vercel 配置"
