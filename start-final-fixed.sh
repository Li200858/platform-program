#!/bin/bash

echo "🎨 启动校园艺术平台 - 最终修复版"
echo "================================"

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
echo "✨ 所有问题已修复："
echo "   ✅ 布局优化：标题左上角，按钮和搜索栏一行"
echo "   ✅ 文件下载：修复 Cannot GET /uploads/ 错误"
echo "   ✅ 个人信息：保存后立即更新状态"
echo "   ✅ 加载状态：修复我的活动和收藏一直加载的问题"
echo "   ✅ 文件预览：上传文件后可以预览和下载"
echo "   ✅ 用户同步：跨设备数据同步功能"
echo "   ✅ 消息提示：所有提示都在内容区域显示，不在顶部"
echo ""
echo "🆕 新增功能："
echo "   📱 数据同步页面：支持跨设备同步用户数据"
echo "   🆔 用户唯一ID：每个用户都有唯一标识符"
echo "   🔄 自动同步：个人信息、收藏、作品等数据自动同步"
echo "   📋 二维码同步：支持二维码方式同步用户ID"
echo "   💬 内容区提示：所有成功/失败提示都在内容区域显示"
echo ""
echo "📐 布局特点："
echo "   ✅ 完全保持原始布局"
echo "   ✅ 按钮位置和样式不变"
echo "   ✅ 导航栏结构不变"
echo "   ✅ 响应式设计保持"
echo "   ✅ 流动渐变色背景"
echo "   ✅ 消息提示在内容区域，不在顶部"
echo ""
echo "现在可以在浏览器中访问 http://localhost:3000"
echo "按 Ctrl+C 停止服务器"

# 等待用户中断
wait
