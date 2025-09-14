#!/bin/bash

echo "🎨 艺术平台快速部署脚本"
echo "================================"

# 检查Git状态
echo "📋 检查Git状态..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  有未提交的更改，正在提交..."
    git add .
    git commit -m "🚀 准备部署到生产环境"
    git push origin main
else
    echo "✅ Git状态干净"
fi

echo ""
echo "🔧 后端部署状态："
echo "1. 检查Railway部署：https://railway.app"
echo "2. 确认后端URL：https://your-railway-url.railway.app"
echo "3. 测试健康检查：https://your-railway-url.railway.app/health"

echo ""
echo "🌐 前端部署选项："
echo "选项1 - Vercel CLI部署："
echo "  cd client"
echo "  npm i -g vercel"
echo "  vercel --prod"

echo ""
echo "选项2 - Vercel Web部署："
echo "  1. 访问 https://vercel.com"
echo "  2. 连接GitHub仓库"
echo "  3. 设置构建命令：cd client && npm run build"
echo "  4. 设置输出目录：client/build"

echo ""
echo "⚙️  环境变量配置："
echo "前端 (Vercel):"
echo "  REACT_APP_API_URL=https://your-railway-url.railway.app"

echo ""
echo "后端 (Railway):"
echo "  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/art-platform"
echo "  PORT=5000"

echo ""
echo "🧪 部署后测试："
echo "1. 访问前端URL"
echo "2. 测试作品发布功能"
echo "3. 测试文件上传"
echo "4. 测试点赞、评论、收藏功能"
echo "5. 测试搜索功能"

echo ""
echo "✅ 部署准备完成！"
echo "现在可以按照上述步骤进行部署了。"
