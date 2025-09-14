#!/bin/bash

# 修复所有硬编码的localhost:5000地址
cd client/src

# 替换所有文件中的硬编码地址
find . -name "*.js" -type f -exec sed -i '' 's|http://localhost:5000|${process.env.REACT_APP_API_URL || "http://localhost:5000"}|g' {} \;

echo "API URLs fixed successfully!"
