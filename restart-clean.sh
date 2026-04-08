#!/bin/bash

echo "🛑 完全重启前端服务器..."
echo ""

cd /Users/lichangxuan/Desktop/platform-program

# 1. 停止所有进程
echo "1️⃣ 停止所有相关进程..."
pkill -9 -f "react-scripts" 2>/dev/null
pkill -9 -f "nodemon" 2>/dev/null
pkill -9 -f "concurrently" 2>/dev/null
sleep 3
echo "   ✅ 已停止"
echo ""

# 2. 清理端口
echo "2️⃣ 清理端口..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5000 | xargs kill -9 2>/dev/null
sleep 1
echo "   ✅ 已清理"
echo ""

# 3. 清理缓存
echo "3️⃣ 清理前端缓存..."
cd client
rm -rf node_modules/.cache 2>/dev/null
rm -rf .cache 2>/dev/null
rm -rf build 2>/dev/null
echo "   ✅ 缓存已清理"
cd ..
echo ""

# 4. 重新启动
echo "4️⃣ 重新启动开发服务器..."
echo "   ⚠️  请查看终端输出，寻找编译错误信息"
echo "   前端：http://localhost:3000"
echo "   后端：http://localhost:5000"
echo ""
echo "   如果看到 'Compiled successfully!' 说明成功"
echo "   如果看到红色错误信息，请把错误发给我"
echo ""
echo "   按 Ctrl+C 停止服务器"
echo ""

npm run dev










