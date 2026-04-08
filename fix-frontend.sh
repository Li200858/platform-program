#!/bin/bash

echo "🔍 诊断前端服务器问题..."
echo ""

cd /Users/lichangxuan/Desktop/platform-program

# 1. 检查端口占用
echo "1️⃣ 检查端口占用情况..."
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "   ⚠️  端口3000被占用"
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    echo "   ✅ 已清理端口3000"
else
    echo "   ✅ 端口3000可用"
fi
echo ""

# 2. 停止所有相关进程
echo "2️⃣ 停止所有开发服务器进程..."
pkill -f "react-scripts" 2>/dev/null
pkill -f "nodemon" 2>/dev/null
pkill -f "concurrently" 2>/dev/null
sleep 2
echo "   ✅ 已停止所有进程"
echo ""

# 3. 清理缓存
echo "3️⃣ 清理前端缓存..."
cd client
rm -rf node_modules/.cache 2>/dev/null
rm -rf .cache 2>/dev/null
echo "   ✅ 缓存已清理"
cd ..
echo ""

# 4. 检查依赖
echo "4️⃣ 检查依赖..."
if [ ! -d "client/node_modules" ]; then
    echo "   ⚠️  缺少依赖，正在安装..."
    cd client
    npm install
    cd ..
else
    echo "   ✅ 依赖已安装"
fi
echo ""

# 5. 重新启动
echo "5️⃣ 重新启动开发服务器..."
echo "   前端：http://localhost:3000"
echo "   后端：http://localhost:5000"
echo ""
echo "   按 Ctrl+C 停止服务器"
echo ""

npm run dev










