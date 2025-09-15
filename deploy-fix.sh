#!/bin/bash

echo "🚀 开始修复和部署平台..."

# 1. 检查Git状态
echo "📋 检查Git状态..."
git status

# 2. 提交修复
echo "💾 提交修复..."
git add .
git commit -m "修复Vercel配置和API连接问题

- 修复vercel.json配置，正确设置API代理到Railway
- 更新前端API配置，使用正确的Railway URL
- 优化部署配置，解决跨域和路由问题"

# 3. 推送到远程仓库
echo "📤 推送到远程仓库..."
git push origin main

echo "✅ 修复完成！"
echo ""
echo "📋 接下来的步骤："
echo "1. 等待Vercel自动部署完成"
echo "2. 检查Vercel部署日志"
echo "3. 测试前端网站功能"
echo ""
echo "🔗 重要链接："
echo "- Railway后端: https://platform-program-production.up.railway.app"
echo "- Vercel前端: 等待部署完成后查看Vercel控制台"
echo ""
echo "🧪 测试命令："
echo "curl https://platform-program-production.up.railway.app/api/health"
