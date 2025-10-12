#!/bin/bash

# 磁盘文件备份脚本
# 用途：备份uploads目录中的所有用户上传文件

echo "========================================"
echo "开始备份上传文件..."
echo "========================================"

# 确定上传目录
if [ "$NODE_ENV" = "production" ]; then
  UPLOAD_DIR="/opt/render/project/src/uploads"
else
  UPLOAD_DIR="./uploads"
fi

# 创建备份目录
BACKUP_DIR="./backups/uploads"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_PATH="${BACKUP_DIR}/backup_${TIMESTAMP}"

mkdir -p "$BACKUP_PATH"

echo ""
echo "上传目录: $UPLOAD_DIR"
echo "备份目录: $BACKUP_PATH"
echo ""

# 检查上传目录是否存在
if [ ! -d "$UPLOAD_DIR" ]; then
  echo "错误: 上传目录不存在: $UPLOAD_DIR"
  exit 1
fi

# 统计文件数量和大小
FILE_COUNT=$(find "$UPLOAD_DIR" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$UPLOAD_DIR" | cut -f1)

echo "文件数量: $FILE_COUNT"
echo "总大小: $TOTAL_SIZE"
echo ""

# 执行备份
echo "开始复制文件..."
cp -R "$UPLOAD_DIR"/* "$BACKUP_PATH/" 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ 备份成功！"
  echo ""
  echo "备份位置: $BACKUP_PATH"
  
  # 创建备份信息文件
  cat > "$BACKUP_PATH/backup_info.txt" << EOF
备份时间: $(date)
原始目录: $UPLOAD_DIR
文件数量: $FILE_COUNT
总大小: $TOTAL_SIZE
备份目录: $BACKUP_PATH
EOF
  
  echo "备份信息已保存到: $BACKUP_PATH/backup_info.txt"
  
  # 列出最近5个备份
  echo ""
  echo "最近的备份列表:"
  ls -lt "$BACKUP_DIR" | head -6
  
else
  echo "❌ 备份失败！"
  exit 1
fi

echo ""
echo "========================================"
echo "备份完成！"
echo "========================================"

