#!/bin/bash

echo "🚀 开始部署到Netlify..."

# 构建前端
echo "🔨 构建前端..."
cd client
npm run build
cd ..

# 创建部署包
echo "📦 创建部署包..."
rm -rf deploy-package
mkdir deploy-package
cp -r client/build/* deploy-package/
cp netlify.toml deploy-package/

echo "✅ 部署包准备完成！"
echo "📁 部署包位置: ./deploy-package/"
echo ""
echo "📋 接下来在Netlify中："
echo "1. 点击 'Add new project'"
echo "2. 选择 'Deploy manually'"
echo "3. 将 deploy-package 文件夹拖拽到部署区域"
echo "4. 等待部署完成"
echo ""
echo "🌐 部署完成后，你会得到一个Netlify域名"
