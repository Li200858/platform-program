#!/usr/bin/env node

// Cloudinary调试脚本
require('dotenv').config();

console.log('🔍 Cloudinary调试信息');
console.log('==========================================');

// 显示环境变量
console.log('\n📋 环境变量:');
console.log(`CLOUDINARY_CLOUD_NAME: "${process.env.CLOUDINARY_CLOUD_NAME}"`);
console.log(`CLOUDINARY_API_KEY: "${process.env.CLOUDINARY_API_KEY}"`);
console.log(`CLOUDINARY_API_SECRET: "${process.env.CLOUDINARY_API_SECRET ? '已设置' : '未设置'}"`);

// 检查Cloud Name格式
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
if (cloudName) {
  console.log('\n🔍 Cloud Name分析:');
  console.log(`长度: ${cloudName.length}`);
  console.log(`包含空格: ${cloudName.includes(' ')}`);
  console.log(`包含特殊字符: ${/[^a-zA-Z0-9_-]/.test(cloudName)}`);
  console.log(`是否全小写: ${cloudName === cloudName.toLowerCase()}`);
  
  // 建议的Cloud Name格式
  const suggestedName = cloudName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  console.log(`建议格式: "${suggestedName}"`);
}

// 测试不同的Cloud Name格式
const testCloudNames = [
  cloudName,
  cloudName?.toLowerCase(),
  cloudName?.replace(/[^a-zA-Z0-9]/g, '-'),
  cloudName?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
].filter(Boolean);

console.log('\n🧪 测试不同的Cloud Name格式:');

for (const testName of [...new Set(testCloudNames)]) {
  console.log(`\n测试: "${testName}"`);
  
  try {
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: testName,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
    
    // 测试ping
    cloudinary.api.ping()
      .then(result => {
        console.log(`✅ 成功: ${testName} -`, result);
      })
      .catch(error => {
        console.log(`❌ 失败: ${testName} -`, error.message || error);
      });
      
  } catch (error) {
    console.log(`❌ 错误: ${testName} -`, error.message);
  }
}

console.log('\n💡 如果所有测试都失败，请检查:');
console.log('1. Cloud Name是否正确（通常是小写字母和数字）');
console.log('2. API Key和Secret是否正确');
console.log('3. 账户是否已激活');
console.log('4. 网络连接是否正常');
