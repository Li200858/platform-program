#!/bin/bash

echo "🚀 启动开发环境..."

# 停止所有可能冲突的进程
echo "停止现有进程..."
pkill -f "node.*index.js" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null
sleep 2

# 启动后端服务器
echo "启动后端服务器 (端口 5000)..."
cd server
node index.js &
BACKEND_PID=$!
cd ..

# 等待后端启动
echo "等待后端启动..."
sleep 5

# 检查后端是否启动成功
if ! curl -s http://localhost:5000/api/activities > /dev/null; then
    echo "❌ 后端启动失败"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ 后端启动成功"

# 启动前端
echo "启动前端 (端口 3000)..."
cd client
PORT=3000 npm start &
FRONTEND_PID=$!
cd ..

echo "✅ 开发环境启动完成！"
echo "前端: http://localhost:3000"
echo "后端: http://localhost:5000"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 捕获Ctrl+C信号，停止所有进程
trap "echo '停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

# 等待进程
wait $BACKEND_PID $FRONTEND_PID