#!/usr/bin/env node

/**
 * 文件迁移脚本 - 将本地文件迁移到Cloudinary
 * 并更新数据库中的文件URL
 */

const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 配置Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 连接MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/platform-program');
    console.log('✅ MongoDB连接成功');
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error);
    process.exit(1);
  }
};

// 上传文件到Cloudinary
const uploadFileToCloudinary = async (filePath) => {
  try {
    console.log(`📤 上传文件: ${filePath}`);
    
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'platform-program',
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto'
    });
    
    console.log(`✅ 上传成功: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`❌ 上传失败: ${filePath}`, error.message);
    return null;
  }
};

// 更新数据库中的文件URL
const updateFileUrls = async (oldUrl, newUrl) => {
  try {
    // 更新Art集合
    const artResult = await mongoose.connection.db.collection('arts').updateMany(
      { media: oldUrl },
      { $set: { 'media.$': newUrl } }
    );
    
    // 更新Activity集合
    const activityResult = await mongoose.connection.db.collection('activities').updateMany(
      { 
        $or: [
          { image: oldUrl },
          { media: oldUrl }
        ]
      },
      { 
        $set: { 
          ...(oldUrl.includes('image') ? { image: newUrl } : {}),
          ...(oldUrl.includes('media') ? { 'media.$': newUrl } : {})
        }
      }
    );
    
    console.log(`📝 更新数据库: Art(${artResult.modifiedCount}), Activity(${activityResult.modifiedCount})`);
    return artResult.modifiedCount + activityResult.modifiedCount;
  } catch (error) {
    console.error('❌ 更新数据库失败:', error);
    return 0;
  }
};

// 主迁移函数
const migrateFiles = async () => {
  try {
    await connectDB();
    
    console.log('🚀 开始文件迁移...');
    
    // 查找所有使用本地路径的文件
    const arts = await mongoose.connection.db.collection('arts').find({
      media: { $regex: /^\/uploads\// }
    }).toArray();
    
    const activities = await mongoose.connection.db.collection('activities').find({
      $or: [
        { image: { $regex: /^\/uploads\// } },
        { media: { $regex: /^\/uploads\// } }
      ]
    }).toArray();
    
    console.log(`📊 找到需要迁移的文件:`);
    console.log(`   - 艺术作品: ${arts.length} 个`);
    console.log(`   - 活动: ${activities.length} 个`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    // 处理艺术作品
    for (const art of arts) {
      for (let i = 0; i < art.media.length; i++) {
        const mediaUrl = art.media[i];
        if (mediaUrl.startsWith('/uploads/')) {
          const filePath = path.join(__dirname, 'server', mediaUrl);
          
          if (fs.existsSync(filePath)) {
            const newUrl = await uploadFileToCloudinary(filePath);
            if (newUrl) {
              await updateFileUrls(mediaUrl, newUrl);
              migratedCount++;
              
              // 删除本地文件
              try {
                fs.unlinkSync(filePath);
                console.log(`🗑️  删除本地文件: ${filePath}`);
              } catch (deleteError) {
                console.warn(`⚠️  删除本地文件失败: ${filePath}`, deleteError.message);
              }
            } else {
              errorCount++;
            }
          } else {
            console.warn(`⚠️  文件不存在: ${filePath}`);
            errorCount++;
          }
        }
      }
    }
    
    // 处理活动
    for (const activity of activities) {
      // 处理活动图片
      if (activity.image && activity.image.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, 'server', activity.image);
        
        if (fs.existsSync(filePath)) {
          const newUrl = await uploadFileToCloudinary(filePath);
          if (newUrl) {
            await updateFileUrls(activity.image, newUrl);
            migratedCount++;
            
            // 删除本地文件
            try {
              fs.unlinkSync(filePath);
              console.log(`🗑️  删除本地文件: ${filePath}`);
            } catch (deleteError) {
              console.warn(`⚠️  删除本地文件失败: ${filePath}`, deleteError.message);
            }
          } else {
            errorCount++;
          }
        } else {
          console.warn(`⚠️  文件不存在: ${filePath}`);
          errorCount++;
        }
      }
      
      // 处理活动媒体文件
      if (activity.media && Array.isArray(activity.media)) {
        for (let i = 0; i < activity.media.length; i++) {
          const mediaUrl = activity.media[i];
          if (mediaUrl.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, 'server', mediaUrl);
            
            if (fs.existsSync(filePath)) {
              const newUrl = await uploadFileToCloudinary(filePath);
              if (newUrl) {
                await updateFileUrls(mediaUrl, newUrl);
                migratedCount++;
                
                // 删除本地文件
                try {
                  fs.unlinkSync(filePath);
                  console.log(`🗑️  删除本地文件: ${filePath}`);
                } catch (deleteError) {
                  console.warn(`⚠️  删除本地文件失败: ${filePath}`, deleteError.message);
                }
              } else {
                errorCount++;
              }
            } else {
              console.warn(`⚠️  文件不存在: ${filePath}`);
              errorCount++;
            }
          }
        }
      }
    }
    
    console.log('\n🎉 迁移完成!');
    console.log(`✅ 成功迁移: ${migratedCount} 个文件`);
    console.log(`❌ 迁移失败: ${errorCount} 个文件`);
    
  } catch (error) {
    console.error('❌ 迁移过程出错:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📝 数据库连接已关闭');
  }
};

// 运行迁移
if (require.main === module) {
  migrateFiles();
}

module.exports = { migrateFiles };

