#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 停止校园艺术平台服务...${NC}"

# 停止所有相关进程
echo -e "${YELLOW}停止后端服务器...${NC}"
pkill -f "node.*index.js" 2>/dev/null

echo -e "${YELLOW}停止前端服务器...${NC}"
pkill -f "serve" 2>/dev/null

echo -e "${YELLOW}停止测试服务器...${NC}"
pkill -f "python3.*http.server" 2>/dev/null

# 等待进程完全停止
sleep 2

# 检查是否还有进程在运行
REMAINING_PROCESSES=$(ps aux | grep -E "(node.*index.js|serve|python3.*http.server)" | grep -v grep | wc -l)

if [ "$REMAINING_PROCESSES" -eq 0 ]; then
    echo -e "${GREEN}✅ 所有服务已成功停止${NC}"
else
    echo -e "${YELLOW}⚠️ 还有 $REMAINING_PROCESSES 个进程在运行${NC}"
    echo -e "${YELLOW}正在强制停止...${NC}"
    pkill -9 -f "node.*index.js" 2>/dev/null
    pkill -9 -f "serve" 2>/dev/null
    pkill -9 -f "python3.*http.server" 2>/dev/null
    sleep 1
    echo -e "${GREEN}✅ 强制停止完成${NC}"
fi

# 清理PID文件
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}" 2>/dev/null || exit 1

if [ -f ".backend_pid" ]; then
    rm .backend_pid
fi
if [ -f ".frontend_pid" ]; then
    rm .frontend_pid
fi
if [ -f ".test_pid" ]; then
    rm .test_pid
fi

echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}  🎉 所有服务已停止                    ${NC}"
echo -e "${GREEN}=======================================${NC}"
