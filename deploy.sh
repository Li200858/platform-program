#!/bin/bash

echo "🚀 开始部署流程..."

# 1. 构建前端
echo "📦 构建前端..."
cd client
npm run build
cd ..

# 2. 检查构建结果
if [ -d "client/build" ]; then
    echo "✅ 前端构建成功"
else
    echo "❌ 前端构建失败"
    exit 1
fi

# 3. 检查环境变量
echo "🔧 检查环境变量..."
if [ -z "$MONGODB_URI" ]; then
    echo "⚠️  警告: MONGODB_URI 未设置"
fi

if [ -z "$JWT_SECRET" ]; then
    echo "⚠️  警告: JWT_SECRET 未设置"
fi

echo "🎉 部署准备完成！"
echo ""
echo "📋 下一步操作："
echo "1. 将代码推送到GitHub"
echo "2. 在Vercel中导入项目"
echo "3. 设置环境变量"
echo "4. 部署前端到Vercel"
echo ""
echo "📖 详细步骤请查看 DEPLOYMENT.md" 