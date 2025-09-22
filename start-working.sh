#!/bin/bash

echo "🎨 启动校园艺术平台 - 工作版本"
echo "=============================="

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
echo "✅ 已修复的问题："
echo "   🔧 发布作品错误：修复了 message 未定义的问题"
echo "   🚀 快速发布：优化了发布流程和用户体验"
echo "   📝 消息提示：所有提示都在内容区域显示"
echo "   🎯 错误处理：改进了错误提示和用户反馈"
echo "   ⏳ 加载状态：上传时显示进度和状态"
echo ""
echo "🆕 发布功能特点："
echo "   ✨ 智能验证：自动检查标题和内容"
echo "   📁 文件上传：支持多文件上传和预览"
echo "   🎨 实时反馈：发布过程中显示状态信息"
echo "   🚀 快速发布：优化了发布速度和用户体验"
echo "   💬 友好提示：清晰的成功/失败消息"
echo ""
echo "📐 布局特点："
echo "   ✅ 完全保持原始布局"
echo "   ✅ 流动渐变色背景"
echo "   ✅ 标题左上角，按钮和搜索栏一行"
echo "   ✅ 响应式设计"
echo ""
echo "现在可以在浏览器中访问 http://localhost:3000"
echo "点击'发布作品'按钮测试发布功能！"
echo "按 Ctrl+C 停止服务器"

# 等待用户中断
wait
