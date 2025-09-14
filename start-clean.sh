#!/bin/bash

echo "🧹 清理并重新启动开发环境..."

# 杀死所有可能冲突的进程
echo "停止现有进程..."
pkill -f "node.*3000" 2>/dev/null
pkill -f "node.*3001" 2>/dev/null
pkill -f "node.*5000" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null
pkill -f "nodemon" 2>/dev/null

sleep 2

# 启动后端服务器
echo "🚀 启动后端服务器 (端口 5000)..."
cd server
npm start &
BACKEND_PID=$!

# 等待后端启动
echo "等待后端启动..."
sleep 5

# 检查后端是否启动成功
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ 后端服务器启动成功"
else
    echo "❌ 后端服务器启动失败"
    exit 1
fi

# 启动前端服务器
echo "🎨 启动前端服务器 (端口 3000)..."
cd ../client
PORT=3000 npm start &
FRONTEND_PID=$!

echo "✅ 开发环境启动完成！"
echo "📱 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:5000"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
wait

# 清理进程
echo "🛑 停止服务..."
kill $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null
echo "✅ 服务已停止"
