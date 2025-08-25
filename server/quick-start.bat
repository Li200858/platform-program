@echo off
chcp 65001 >nul
echo 🚀 海淀外国语校园平台 - 快速启动脚本
echo ======================================
echo.

REM 检查是否在正确的目录
if not exist "package.json" (
    echo ❌ 错误：请在 server 目录下运行此脚本
    pause
    exit /b 1
)

REM 检查 Node.js 是否安装
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

REM 检查 npm 是否安装
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：未找到 npm，请先安装 npm
    pause
    exit /b 1
)

echo ✅ 环境检查通过
echo.

REM 检查依赖是否安装
if not exist "node_modules" (
    echo 📦 安装依赖包...
    npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已安装
)

echo.

REM 检查 .env 文件
if not exist ".env" (
    echo 🔧 未找到 .env 配置文件，启动配置向导...
    echo 请按照提示输入 MongoDB 连接信息
    echo.
    npm run setup
    echo.
    
    if not exist ".env" (
        echo ❌ .env 文件创建失败，请手动创建
        echo 参考 MONGODB_SETUP.md 文件
        pause
        exit /b 1
    )
) else (
    echo ✅ 找到 .env 配置文件
)

echo.
echo 🚀 启动服务器...
echo 按 Ctrl+C 停止服务器
echo.

REM 启动开发服务器
npm run dev

pause
