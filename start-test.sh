#!/bin/bash

echo "🚀 活动报名系统 - 本地测试启动脚本"
echo "===================================="
echo ""

# 检查是否在正确的目录
if [ ! -d "server" ] || [ ! -d "client" ]; then
    echo "❌ 请在platform-program项目根目录运行此脚本"
    echo "   当前目录: $(pwd)"
    exit 1
fi

# 步骤1：检查并安装依赖
echo "📋 步骤1: 检查依赖..."
if [ ! -d "node_modules" ] || [ ! -d "server/node_modules" ] || [ ! -d "client/node_modules" ]; then
    echo "📦 安装依赖（这可能需要几分钟）..."
    npm run install-all
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已安装"
fi
echo ""

# 步骤2：检查并创建.env文件
echo "📋 步骤2: 检查配置文件..."
if [ ! -f "server/.env" ]; then
    echo "📝 创建server/.env文件..."
    cat > server/.env << 'EOF'
# MongoDB连接
MONGODB_URI=mongodb://localhost:27017/platform-program

# 服务器端口
PORT=5000

# 环境
NODE_ENV=development
EOF
    echo "✅ .env文件已创建"
else
    echo "✅ .env文件已存在"
fi
echo ""

# 步骤3：检查并创建uploads目录
echo "📋 步骤3: 检查上传目录..."
if [ ! -d "server/uploads" ]; then
    mkdir -p server/uploads
    chmod 755 server/uploads
    echo "✅ 上传目录已创建"
else
    echo "✅ 上传目录已存在"
fi
echo ""

# 步骤4：检查MongoDB
echo "📋 步骤4: 检查MongoDB..."
MONGODB_RUNNING=false

# 检查mongod进程
if pgrep -x "mongod" > /dev/null; then
    MONGODB_RUNNING=true
    echo "✅ MongoDB进程正在运行"
# 检查Homebrew服务
elif command -v brew > /dev/null && brew services list 2>/dev/null | grep -q "mongodb-community.*started"; then
    MONGODB_RUNNING=true
    echo "✅ MongoDB服务已启动（通过Homebrew）"
else
    echo "⚠️  MongoDB未运行"
    if command -v brew > /dev/null; then
        echo "🗄️  尝试启动MongoDB..."
        brew services start mongodb-community
        sleep 3
        if brew services list 2>/dev/null | grep -q "mongodb-community.*started"; then
            MONGODB_RUNNING=true
            echo "✅ MongoDB已启动"
        else
            echo "❌ MongoDB启动失败，请手动启动: brew services start mongodb-community"
        fi
    else
        echo "❌ 未检测到Homebrew，请手动启动MongoDB"
    fi
fi
echo ""

# 步骤5：检查端口占用
echo "📋 步骤5: 检查端口占用..."
if lsof -i :5000 > /dev/null 2>&1; then
    echo "⚠️  端口5000已被占用"
    echo "   正在尝试释放..."
    lsof -ti:5000 | xargs kill -9 2>/dev/null
    sleep 2
fi

if lsof -i :3000 > /dev/null 2>&1; then
    echo "⚠️  端口3000已被占用"
    echo "   正在尝试释放..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 2
fi
echo "✅ 端口检查完成"
echo ""

# 步骤6：启动服务器
echo "===================================="
echo "🚀 启动开发服务器..."
echo ""
echo "📋 服务器信息："
echo "   后端: http://localhost:5000"
echo "   前端: http://localhost:3000"
echo ""
echo "💡 提示："
echo "   - 按 Ctrl+C 停止服务器"
echo "   - 前端会自动在浏览器中打开"
echo "   - 如果遇到问题，查看终端错误信息"
echo ""
echo "===================================="
echo ""

# 启动开发服务器
npm run dev









