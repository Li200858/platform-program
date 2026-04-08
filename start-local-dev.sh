#!/bin/bash

# 本地开发启动脚本
# 用于启动前后端开发服务器

echo "🚀 启动本地开发环境..."
echo ""

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    echo "   当前目录：$(pwd)"
    echo "   请运行：cd /Users/lichangxuan/Desktop/platform-program"
    exit 1
fi

# 检查Node.js版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ 错误：需要 Node.js 18 或更高版本"
    echo "   当前版本：$(node -v)"
    exit 1
fi

echo "✅ Node.js 版本：$(node -v)"
echo ""

# 检查依赖是否已安装
if [ ! -d "node_modules" ] || [ ! -d "client/node_modules" ] || [ ! -d "server/node_modules" ]; then
    echo "📦 检测到缺少依赖，正在安装..."
    echo ""
    npm run install-all
    echo ""
fi

# 检查MongoDB连接（可选）
echo "📡 检查MongoDB连接..."
echo "   如果MongoDB未运行，后端可能无法正常工作"
echo ""

# 启动开发服务器
echo "🎯 启动开发服务器..."
echo "   前端：http://localhost:3000"
echo "   后端：http://localhost:5000"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

npm run dev










