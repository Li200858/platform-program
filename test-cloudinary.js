#!/usr/bin/env node

// Cloudinary配置测试脚本
require('dotenv').config();

const { cloudinary, verifyCloudinaryConfig, testCloudinaryConnection } = require('./server/config/cloudinary');

console.log('🧪 Cloudinary配置测试');
console.log('==========================================');

// 1. 检查环境变量
console.log('\n📋 环境变量检查:');
console.log(`CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ 已设置' : '❌ 未设置'}`);
console.log(`CLOUDINARY_API_KEY: ${process.env.CLOUDINARY_API_KEY ? '✅ 已设置' : '❌ 未设置'}`);
console.log(`CLOUDINARY_API_SECRET: ${process.env.CLOUDINARY_API_SECRET ? '✅ 已设置' : '❌ 未设置'}`);

// 2. 验证配置
console.log('\n🔧 配置验证:');
const configValid = verifyCloudinaryConfig();
console.log(`配置状态: ${configValid ? '✅ 有效' : '❌ 无效'}`);

if (!configValid) {
  console.log('\n❌ 配置不完整，请设置以下环境变量:');
  console.log('CLOUDINARY_CLOUD_NAME=your-cloud-name');
  console.log('CLOUDINARY_API_KEY=your-api-key');
  console.log('CLOUDINARY_API_SECRET=your-api-secret');
  process.exit(1);
}

// 3. 测试连接
console.log('\n🌐 连接测试:');
testCloudinaryConnection()
  .then(connected => {
    if (connected) {
      console.log('✅ Cloudinary连接成功');
      
      // 4. 测试上传
      console.log('\n📤 上传测试:');
      return testUpload();
    } else {
      console.log('❌ Cloudinary连接失败');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  });

// 测试上传功能
async function testUpload() {
  try {
    // 创建一个测试图片（1x1像素的PNG）
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4, 0x00, 0x00, 0x00, 0x00,
      0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    const result = await cloudinary.uploader.upload(
      `data:image/png;base64,${testImageBuffer.toString('base64')}`,
      {
        folder: 'platform-program/test',
        public_id: `test-${Date.now()}`,
        resource_type: 'image'
      }
    );
    
    console.log('✅ 测试图片上传成功');
    console.log(`URL: ${result.secure_url}`);
    console.log(`Public ID: ${result.public_id}`);
    
    // 清理测试文件
    await cloudinary.uploader.destroy(result.public_id);
    console.log('✅ 测试文件已清理');
    
    console.log('\n🎉 所有测试通过！Cloudinary配置正确。');
    
  } catch (error) {
    console.error('❌ 上传测试失败:', error.message);
    process.exit(1);
  }
}