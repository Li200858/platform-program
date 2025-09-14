#!/bin/bash

echo "🌐 开始部署到 Vercel..."
echo "================================"

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装"
    echo "请先安装: npm install -g vercel"
    echo "然后运行: vercel login"
    exit 1
fi

# 检查是否已登录
if ! vercel whoami &> /dev/null; then
    echo "❌ 请先登录 Vercel"
    echo "运行: vercel login"
    exit 1
fi

echo "✅ Vercel CLI 已就绪"

# 进入客户端目录
cd client

echo "📦 安装依赖..."
npm install

echo "🏗️ 构建项目..."
npm run build

echo "🚀 开始部署..."
vercel --prod

echo "✅ Vercel 部署完成！"
echo "请记录您的 Vercel URL"
