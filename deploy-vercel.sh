#!/bin/bash

echo "🚀 开始部署到Vercel..."

# 检查是否安装了Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 安装Vercel CLI..."
    npm install -g vercel
fi

# 检查是否已登录
if ! vercel whoami &> /dev/null; then
    echo "🔐 请先登录Vercel..."
    vercel login
fi

# 部署项目
echo "🌐 部署项目到Vercel..."
vercel --prod

echo "✅ 部署完成！"
echo "📝 请确保在Vercel控制台中设置以下环境变量："
echo "   MONGODB_URI: mongodb+srv://Changxuan:QpX3zlJncWeel9wG@cluster0.pooufxr.mongodb.net/platform-program?retryWrites=true&w=majority"
echo "   JWT_SECRET: eVHxwFaJcUDuPv60KJLWpvKs62ulHYwZ"
