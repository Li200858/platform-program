#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}  校园艺术平台 - 完整功能版本        ${NC}"
echo -e "${GREEN}=======================================${NC}"

# 停止所有可能正在运行的进程
echo -e "${YELLOW}🛑 停止现有进程...${NC}"
pkill -f "node.*index.js" 2>/dev/null
pkill -f "serve" 2>/dev/null
pkill -f "python3.*http.server" 2>/dev/null
sleep 2
echo -e "${GREEN}✅ 旧进程已停止${NC}"

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo -e "${YELLOW}📁 项目目录: ${SCRIPT_DIR}${NC}"

# 检查必要目录是否存在
if [ ! -d "${SCRIPT_DIR}/server" ]; then
    echo -e "${RED}❌ 错误: server目录不存在${NC}"
    exit 1
fi

if [ ! -d "${SCRIPT_DIR}/client" ]; then
    echo -e "${RED}❌ 错误: client目录不存在${NC}"
    exit 1
fi

# 启动后端服务器
echo -e "${YELLOW}🚀 启动后端服务器...${NC}"
cd "${SCRIPT_DIR}/server" || { echo -e "${RED}❌ 错误: 无法进入server目录${NC}"; exit 1; }

# 检查并安装后端依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 安装后端依赖...${NC}"
    npm install || { echo -e "${RED}❌ 后端依赖安装失败${NC}"; exit 1; }
fi

# 启动后端
node index.js &
BACKEND_PID=$!
echo -e "${GREEN}✅ 后端服务器已启动 (PID: ${BACKEND_PID})${NC}"

# 等待后端启动
echo -e "${YELLOW}⏳ 等待后端服务器启动...${NC}"
sleep 5

# 检查后端是否启动成功
for i in {1..10}; do
    if curl -s http://localhost:5000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 后端服务器健康检查通过！${NC}"
        break
    else
        if [ $i -eq 10 ]; then
            echo -e "${RED}❌ 后端服务器启动失败，请检查端口5000是否被占用${NC}"
            exit 1
        fi
        echo -e "${YELLOW}⏳ 等待后端启动... (${i}/10)${NC}"
        sleep 2
    fi
done

# 启动前端服务器
echo -e "${YELLOW}🎨 启动前端服务器...${NC}"
cd "${SCRIPT_DIR}/client" || { echo -e "${RED}❌ 错误: 无法进入client目录${NC}"; exit 1; }

# 检查并安装前端依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 安装前端依赖...${NC}"
    npm install || { echo -e "${RED}❌ 前端依赖安装失败${NC}"; exit 1; }
fi

# 构建前端
echo -e "${YELLOW}🔨 构建前端生产版本...${NC}"
npm run build || { echo -e "${RED}❌ 前端构建失败${NC}"; exit 1; }

# 启动前端静态服务器
npx serve -s build -l 3000 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ 前端服务器已启动 (PID: ${FRONTEND_PID})${NC}"

# 等待前端启动
echo -e "${YELLOW}⏳ 等待前端服务器启动...${NC}"
sleep 3

# 检查前端是否启动成功
for i in {1..5}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 前端服务器健康检查通过！${NC}"
        break
    else
        if [ $i -eq 5 ]; then
            echo -e "${RED}❌ 前端服务器启动失败，请检查端口3000是否被占用${NC}"
            exit 1
        fi
        echo -e "${YELLOW}⏳ 等待前端启动... (${i}/5)${NC}"
        sleep 2
    fi
done

# 启动测试服务器（可选）
echo -e "${YELLOW}🧪 启动测试服务器...${NC}"
cd "${SCRIPT_DIR}" || { echo -e "${RED}❌ 错误: 无法返回项目根目录${NC}"; exit 1; }
python3 -m http.server 8080 &
TEST_PID=$!
echo -e "${GREEN}✅ 测试服务器已启动 (PID: ${TEST_PID})${NC}"

# 显示启动成功信息
echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}  🎉 网站启动成功！                    ${NC}"
echo -e "${GREEN}=======================================${NC}"
echo -e "${BLUE}🌐 主网站: http://localhost:3000${NC}"
echo -e "${BLUE}🔧 后端API: http://localhost:5000${NC}"
echo -e "${BLUE}🧪 测试页面: http://localhost:8080${NC}"
echo -e "${GREEN}=======================================${NC}"

echo -e "${PURPLE}👑 管理员功能:${NC}"
echo -e "   • 李昌轩具有超级管理员权限"
echo -e "   • 可以搜索其他用户并设置管理员身份"
echo -e "   • 用户身份在个人信息页面显示"
echo -e "   • 完整的权限验证和安全机制"

echo -e "${PURPLE}🔍 搜索功能:${NC}"
echo -e "   • 支持关键词搜索"
echo -e "   • 搜索结果可以点击跳转"
echo -e "   • 智能跳转到具体内容"

echo -e "${PURPLE}📁 文件功能:${NC}"
echo -e "   • 支持图片、视频、文档上传"
echo -e "   • 文件预览和下载"
echo -e "   • 图片放大查看"

echo -e "${PURPLE}🎨 其他功能:${NC}"
echo -e "   • 作品发布和管理"
echo -e "   • 点赞、收藏、评论"
echo -e "   • 用户数据同步"
echo -e "   • 响应式设计"

echo -e "${GREEN}=======================================${NC}"
echo -e "${YELLOW}📝 使用说明:${NC}"
echo -e "   1. 在浏览器中访问 http://localhost:3000"
echo -e "   2. 以'李昌轩'身份登录获得管理员权限"
echo -e "   3. 在个人信息页面查看身份标识"
echo -e "   4. 使用搜索功能查找内容"
echo -e "   5. 发布作品和上传文件"
echo -e "   6. 管理其他用户权限"
echo -e "${GREEN}=======================================${NC}"

echo -e "${YELLOW}💡 提示: 按 Ctrl+C 停止所有服务${NC}"

# 创建进程ID文件
echo "$BACKEND_PID" > "${SCRIPT_DIR}/.backend_pid"
echo "$FRONTEND_PID" > "${SCRIPT_DIR}/.frontend_pid"
echo "$TEST_PID" > "${SCRIPT_DIR}/.test_pid"

# 等待用户中断
wait
