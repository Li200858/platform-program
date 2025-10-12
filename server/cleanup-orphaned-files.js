const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 导入所有模型
const Art = require('./models/Art');
const Activity = require('./models/Activity');
const Feedback = require('./models/Feedback');
const Portfolio = require('./models/Portfolio');
const Resource = require('./models/Resource');

// 连接MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/platform-program')
  .then(() => console.log('MongoDB连接成功'))
  .catch(err => {
    console.error('MongoDB连接失败:', err);
    process.exit(1);
  });

const UPLOAD_DIR = process.env.NODE_ENV === 'production' 
  ? '/opt/render/project/src/uploads'
  : path.join(__dirname, 'uploads');

async function cleanupOrphanedFiles() {
  console.log('\n========================================');
  console.log('开始清理孤立文件...');
  console.log('上传目录:', UPLOAD_DIR);
  console.log('========================================\n');

  try {
    // 1. 获取磁盘上的所有文件
    if (!fs.existsSync(UPLOAD_DIR)) {
      console.log('上传目录不存在，无需清理');
      return;
    }

    const diskFiles = fs.readdirSync(UPLOAD_DIR);
    console.log(`磁盘文件总数: ${diskFiles.length}\n`);

    // 2. 收集数据库中所有引用的文件
    const referencedFiles = new Set();

    // 从艺术作品收集
    console.log('检查艺术作品中的文件引用...');
    const arts = await Art.find({});
    arts.forEach(art => {
      if (art.media && Array.isArray(art.media)) {
        art.media.forEach(filePath => {
          const filename = path.basename(filePath);
          referencedFiles.add(filename);
        });
      }
    });
    console.log(`  艺术作品引用文件: ${referencedFiles.size} 个`);

    // 从活动收集
    console.log('检查活动中的文件引用...');
    const activities = await Activity.find({});
    activities.forEach(activity => {
      if (activity.image) {
        const filename = path.basename(activity.image);
        referencedFiles.add(filename);
      }
      if (activity.media && Array.isArray(activity.media)) {
        activity.media.forEach(filePath => {
          const filename = path.basename(filePath);
          referencedFiles.add(filename);
        });
      }
    });
    console.log(`  活动引用文件: ${referencedFiles.size} 个（累计）`);

    // 从反馈收集
    console.log('检查反馈中的文件引用...');
    const feedbacks = await Feedback.find({});
    feedbacks.forEach(feedback => {
      if (feedback.media && Array.isArray(feedback.media)) {
        feedback.media.forEach(filePath => {
          const filename = path.basename(filePath);
          referencedFiles.add(filename);
        });
      }
    });
    console.log(`  反馈引用文件: ${referencedFiles.size} 个（累计）`);

    // 从作品集收集
    console.log('检查作品集中的文件引用...');
    const portfolios = await Portfolio.find({});
    portfolios.forEach(portfolio => {
      if (portfolio.coverImage) {
        const filename = path.basename(portfolio.coverImage);
        referencedFiles.add(filename);
      }
      if (portfolio.contents && Array.isArray(portfolio.contents)) {
        portfolio.contents.forEach(content => {
          if (content.media && Array.isArray(content.media)) {
            content.media.forEach(m => {
              const filePath = m.url || m;
              const filename = path.basename(filePath);
              referencedFiles.add(filename);
            });
          }
        });
      }
    });
    console.log(`  作品集引用文件: ${referencedFiles.size} 个（累计）`);

    // 从资料库收集
    console.log('检查资料库中的文件引用...');
    const resources = await Resource.find({});
    resources.forEach(resource => {
      if (resource.files && Array.isArray(resource.files)) {
        resource.files.forEach(file => {
          const filePath = file.url || file.path || file;
          const filename = path.basename(filePath);
          referencedFiles.add(filename);
        });
      }
    });
    console.log(`  资料库引用文件: ${referencedFiles.size} 个（累计）`);

    console.log(`\n数据库中引用的文件总数: ${referencedFiles.size}\n`);

    // 3. 找出孤立文件
    const orphanedFiles = [];
    diskFiles.forEach(file => {
      if (!referencedFiles.has(file)) {
        orphanedFiles.add(file);
      }
    });

    console.log(`发现 ${orphanedFiles.length} 个孤立文件\n`);

    if (orphanedFiles.length === 0) {
      console.log('没有孤立文件，磁盘状态良好！');
      return;
    }

    // 4. 显示孤立文件列表
    console.log('孤立文件列表:');
    orphanedFiles.forEach((file, index) => {
      const filePath = path.join(UPLOAD_DIR, file);
      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`  ${index + 1}. ${file} (${sizeMB} MB)`);
    });

    // 5. 计算总大小
    let totalSize = 0;
    orphanedFiles.forEach(file => {
      const filePath = path.join(UPLOAD_DIR, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
    });
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    console.log(`\n孤立文件总大小: ${totalSizeMB} MB`);

    // 6. 询问是否删除
    console.log('\n========================================');
    console.log('是否删除这些孤立文件？');
    console.log('运行命令: node cleanup-orphaned-files.js --delete');
    console.log('========================================\n');

    // 如果有 --delete 参数，执行删除
    if (process.argv.includes('--delete')) {
      console.log('\n开始删除孤立文件...\n');
      let deletedCount = 0;
      orphanedFiles.forEach(file => {
        try {
          const filePath = path.join(UPLOAD_DIR, file);
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`✅ 已删除: ${file}`);
        } catch (error) {
          console.error(`❌ 删除失败: ${file}`, error.message);
        }
      });
      console.log(`\n删除完成！成功删除 ${deletedCount}/${orphanedFiles.length} 个文件`);
      console.log(`释放空间: ${totalSizeMB} MB`);
    }

  } catch (error) {
    console.error('清理过程出错:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB连接已关闭');
  }
}

// 运行清理
cleanupOrphanedFiles();

