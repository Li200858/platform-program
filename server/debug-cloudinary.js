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
const testCloudNamesList = [
  cloudName,
  cloudName?.toLowerCase(),
  cloudName?.replace(/[^a-zA-Z0-9]/g, '-'),
  cloudName?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
].filter(Boolean);

console.log('\n🧪 测试不同的Cloud Name格式:');

async function testCloudNames() {
  for (const testName of [...new Set(testCloudNamesList)]) {
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
      try {
        const result = await cloudinary.api.ping();
        console.log(`✅ 成功: ${testName} -`, result);
        return testName; // 返回成功的cloud name
      } catch (error) {
        console.log(`❌ 失败: ${testName} -`, error.message || error);
      }
      
    } catch (error) {
      console.log(`❌ 错误: ${testName} -`, error.message);
    }
  }
  
  return null;
}

testCloudNames().then(workingName => {
  if (workingName) {
    console.log(`\n🎉 找到可用的Cloud Name: "${workingName}"`);
    console.log('\n请在Railway中设置:');
    console.log(`CLOUDINARY_CLOUD_NAME=${workingName}`);
  } else {
    console.log('\n❌ 所有Cloud Name格式都失败');
    console.log('\n💡 请检查:');
    console.log('1. 登录Cloudinary控制台确认Cloud Name');
    console.log('2. 检查API Key和Secret是否正确');
    console.log('3. 确认账户已激活');
  }
});
