#!/bin/bash

echo "🌹 启动校园艺术平台 - 流动渐变色版"
echo "=================================="

# 停止现有进程
echo "🛑 停止现有进程..."
pkill -f "node.*index.js" 2>/dev/null
pkill -f "serve" 2>/dev/null
sleep 2

# 启动后端服务器
echo "🚀 启动后端服务器..."
cd server
node index.js &
SERVER_PID=$!
cd ..

# 等待后端启动
echo "⏳ 等待后端服务器启动..."
sleep 3

# 检查后端是否启动成功
if curl -s http://localhost:5000/health > /dev/null; then
    echo "✅ 后端服务器启动成功 (端口 5000)"
else
    echo "❌ 后端服务器启动失败"
    exit 1
fi

# 构建前端（如果需要）
if [ ! -d "client/build" ]; then
    echo "🔨 构建前端应用..."
    cd client
    npm run build
    cd ..
fi

# 启动前端服务器（使用静态服务器）
echo "🎨 启动前端服务器..."
cd client
npx serve -s build -l 3000 &
CLIENT_PID=$!
cd ..

# 等待前端启动
echo "⏳ 等待前端服务器启动..."
sleep 5

# 检查前端是否启动成功
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ 前端服务器启动成功 (端口 3000)"
else
    echo "❌ 前端服务器启动失败"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 网站启动完成！"
echo "=================="
echo "🌐 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:5000"
echo "👤 管理员账户: 测试员 (测试班级)"
echo ""
echo "✨ 特色功能："
echo "   🌈 流动渐变色背景"
echo "   🎨 艺术作品展示和发布"
echo "   📁 文件上传和预览"
echo "   ❤️ 点赞收藏系统"
echo "   💬 评论系统"
echo "   🎪 活动展示"
echo "   📝 意见反馈"
echo "   🔍 搜索功能"
echo "   👥 管理员面板"
echo ""
echo "现在可以在浏览器中访问 http://localhost:3000"
echo "按 Ctrl+C 停止服务器"

# 等待用户中断
wait
