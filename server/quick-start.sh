#!/bin/bash

echo "🚀 海淀外国语校园平台 - 快速启动脚本"
echo "======================================"
echo ""

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在 server 目录下运行此脚本"
    exit 1
fi

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误：未找到 npm，请先安装 npm"
    exit 1
fi

echo "✅ 环境检查通过"
echo ""

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已安装"
fi

echo ""

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "🔧 未找到 .env 配置文件，启动配置向导..."
    echo "请按照提示输入 MongoDB 连接信息"
    echo ""
    npm run setup
    echo ""
    
    if [ ! -f ".env" ]; then
        echo "❌ .env 文件创建失败，请手动创建"
        echo "参考 MONGODB_SETUP.md 文件"
        exit 1
    fi
else
    echo "✅ 找到 .env 配置文件"
fi

echo ""
echo "🚀 启动服务器..."
echo "按 Ctrl+C 停止服务器"
echo ""

# 启动开发服务器
npm run dev
