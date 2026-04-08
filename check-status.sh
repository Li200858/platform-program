#!/bin/bash
echo "🔍 检查服务器状态"
echo "=================="
echo ""
echo "📋 后端服务器（端口5000）..."
if lsof -i :5000 > /dev/null 2>&1; then
    echo "✅ 后端正在运行"
    curl -s http://localhost:5000/api/time | head -c 100
    echo ""
else
    echo "❌ 后端未运行"
fi
echo ""
echo "📋 前端服务器（端口3000）..."
if lsof -i :3000 > /dev/null 2>&1; then
    echo "✅ 前端正在运行"
else
    echo "❌ 前端未运行"
fi









