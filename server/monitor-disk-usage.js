const fs = require('fs');
const path = require('path');

const getUploadsDir = () =>
  process.env.NODE_ENV === 'production'
    ? '/opt/render/project/src/uploads'
    : path.join(__dirname, 'uploads');

function monitorDiskUsage() {
  const uploadsDir = getUploadsDir();

  try {
    const getDirectorySize = (dirPath) => {
      let totalSize = 0;
      const files = fs.readdirSync(dirPath);

      files.forEach((file) => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
          totalSize += getDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      });

      return totalSize;
    };

    if (fs.existsSync(uploadsDir)) {
      const size = getDirectorySize(uploadsDir);
      const sizeInMB = (size / 1024 / 1024).toFixed(2);
      const sizeInGB = (size / 1024 / 1024 / 1024).toFixed(2);

      console.log('📊 磁盘使用情况:');
      console.log(`   上传文件总大小: ${sizeInMB} MB (${sizeInGB} GB)`);
      console.log(`   剩余容量: ${(5 - sizeInGB).toFixed(2)} GB`);
      console.log(`   使用率: ${((sizeInGB / 5) * 100).toFixed(1)}%`);

      if (sizeInGB > 4) {
        console.log('⚠️  警告: 磁盘使用率超过80%！');
      } else if (sizeInGB > 3) {
        console.log('⚠️  注意: 磁盘使用率超过60%');
      }

      return {
        totalSize: size,
        sizeInMB: parseFloat(sizeInMB),
        sizeInGB: parseFloat(sizeInGB),
        usagePercent: (sizeInGB / 5) * 100,
      };
    }
    console.log('📁 uploads目录不存在');
    return null;
  } catch (error) {
    console.error('❌ 监控磁盘使用失败:', error);
    return null;
  }
}

function cleanupOldFiles(daysOld = 30) {
  const uploadsDir = getUploadsDir();

  try {
    const files = fs.readdirSync(uploadsDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let deletedCount = 0;
    let freedSpace = 0;

    files.forEach((file) => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);

      if (stats.isFile() && stats.mtime < cutoffDate) {
        freedSpace += stats.size;
        fs.unlinkSync(filePath);
        deletedCount += 1;
      }
    });

    console.log('🧹 清理完成:');
    console.log(`   删除文件: ${deletedCount} 个`);
    console.log(`   释放空间: ${(freedSpace / 1024 / 1024).toFixed(2)} MB`);

    return { deletedCount, freedSpace };
  } catch (error) {
    console.error('❌ 清理文件失败:', error);
    return null;
  }
}

module.exports = {
  monitorDiskUsage,
  cleanupOldFiles,
};

if (require.main === module) {
  console.log('🔍 开始监控磁盘使用情况...\n');

  const usage = monitorDiskUsage();

  if (usage && usage.usagePercent > 80) {
    console.log('\n🧹 磁盘使用率过高，开始清理旧文件...');
    cleanupOldFiles(30);

    console.log('\n🔍 清理后重新检查...');
    monitorDiskUsage();
  }
}
