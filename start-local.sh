#!/bin/bash

echo "🌹 启动校园艺术平台 - 本地开发版"
echo "=================================="

# 检查Node.js版本
node_version=$(node -v 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ 错误: 未安装Node.js，请先安装Node.js 18+"
    exit 1
fi

echo "✅ Node.js版本: $node_version"

# 安装依赖
echo "📦 安装依赖包..."
npm install
cd client && npm install
cd ../server && npm install
cd ..

# 创建uploads目录
mkdir -p server/uploads

echo "🚀 启动服务器..."
echo "后端服务器: http://localhost:5000"
echo "前端应用: http://localhost:3000"
echo ""
echo "管理员账户: 测试员 (测试班级)"
echo "=================================="

# 启动开发服务器
npm run dev
