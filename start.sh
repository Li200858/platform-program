#!/bin/bash

echo "🚀 启动艺术平台..."

# 启动后端服务器
echo "📡 启动后端服务器..."
cd server
npm start &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端服务器
echo "🎨 启动前端服务器..."
cd ../client
npm start &
FRONTEND_PID=$!

echo "✅ 服务启动完成！"
echo "📱 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:5000"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
wait
