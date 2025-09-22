#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 快速启动校园艺术平台${NC}"

# 停止现有进程
echo -e "${YELLOW}🛑 停止现有进程...${NC}"
pkill -f "node.*index.js" 2>/dev/null
pkill -f "serve" 2>/dev/null
sleep 1

# 确保在项目根目录
PROJECT_ROOT=$(dirname "$0")
cd "$PROJECT_ROOT" || { echo -e "${RED}❌ 错误: 无法进入项目根目录${NC}"; exit 1; }

# 启动后端
echo -e "${YELLOW}🔧 启动后端服务器...${NC}"
cd server || { echo -e "${RED}❌ 错误: 无法进入server目录${NC}"; exit 1; }
node index.js &
BACKEND_PID=$!
cd "$PROJECT_ROOT" || { echo -e "${RED}❌ 错误: 无法返回项目根目录${NC}"; exit 1; }

# 等待后端启动
sleep 3

# 启动前端
echo -e "${YELLOW}🎨 启动前端服务器...${NC}"
cd client || { echo -e "${RED}❌ 错误: 无法进入client目录${NC}"; exit 1; }
npx serve -s build -l 3000 &
FRONTEND_PID=$!
cd "$PROJECT_ROOT" || { echo -e "${RED}❌ 错误: 无法返回项目根目录${NC}"; exit 1; }

# 等待前端启动
sleep 2

# 检查服务状态
echo -e "${YELLOW}🔍 检查服务状态...${NC}"
if curl -s http://localhost:5000/health > /dev/null; then
    echo -e "${GREEN}✅ 后端服务器运行正常${NC}"
else
    echo -e "${RED}❌ 后端服务器启动失败${NC}"
fi

if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ 前端服务器运行正常${NC}"
else
    echo -e "${RED}❌ 前端服务器启动失败${NC}"
fi

echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}  🎉 网站启动完成！                    ${NC}"
echo -e "${GREEN}=======================================${NC}"
echo -e "${BLUE}🌐 主网站: http://localhost:3000${NC}"
echo -e "${BLUE}🔧 后端API: http://localhost:5000${NC}"
echo -e "${GREEN}=======================================${NC}"

echo -e "${YELLOW}💡 按 Ctrl+C 停止服务${NC}"

# 等待用户中断
wait
