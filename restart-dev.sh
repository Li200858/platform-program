#!/bin/bash

echo "🛑 停止所有开发服务器..."
echo ""

# 停止所有相关进程
pkill -f "react-scripts"
pkill -f "nodemon"
pkill -f "concurrently"
sleep 2

echo "✅ 已停止所有进程"
echo ""
echo "🚀 重新启动开发服务器..."
echo ""

cd /Users/lichangxuan/Desktop/platform-program
npm run dev










