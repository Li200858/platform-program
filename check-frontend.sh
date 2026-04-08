#!/bin/bash

echo "🔍 检查前端服务器状态..."
echo ""

cd /Users/lichangxuan/Desktop/platform-program

# 1. 检查进程
echo "1️⃣ 检查react-scripts进程..."
if pgrep -f "react-scripts" > /dev/null; then
    echo "   ✅ react-scripts进程正在运行"
    ps aux | grep react-scripts | grep -v grep
else
    echo "   ❌ react-scripts进程未运行"
fi
echo ""

# 2. 检查端口
echo "2️⃣ 检查3000端口..."
if lsof -i :3000 > /dev/null 2>&1; then
    echo "   ✅ 端口3000正在监听"
    lsof -i :3000
else
    echo "   ❌ 端口3000未监听"
fi
echo ""

# 3. 测试连接
echo "3️⃣ 测试本地连接..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✅ 可以连接到 http://localhost:3000"
else
    echo "   ❌ 无法连接到 http://localhost:3000"
    echo "   尝试连接..."
    curl -v http://localhost:3000 2>&1 | head -10
fi
echo ""

# 4. 检查编译错误
echo "4️⃣ 检查是否有编译错误..."
cd client
if [ -f "node_modules/.cache" ]; then
    echo "   ⚠️  发现缓存，可能影响编译"
fi

# 5. 建议
echo "5️⃣ 建议操作："
echo "   如果端口未监听，请："
echo "   1. 停止所有进程：pkill -f react-scripts"
echo "   2. 清理缓存：cd client && rm -rf node_modules/.cache"
echo "   3. 重新启动：cd .. && npm run dev"
echo "   4. 查看完整输出，寻找错误信息"
echo ""










