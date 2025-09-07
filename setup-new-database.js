#!/usr/bin/env node

/**
 * 新数据库快速设置脚本
 * 用于初始化新创建的MongoDB集群
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 颜色输出函数
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 用户模型
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: '' },
  age: { type: Number, default: null },
  class: { type: String, default: '' },
  avatar: { type: String, default: '' },
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function setupNewDatabase() {
  try {
    log('🚀 开始设置新数据库...', 'blue');
    
    // 检查环境变量
    if (!process.env.MONGODB_URI) {
      log('❌ MONGODB_URI 环境变量未设置', 'red');
      log('请设置环境变量: export MONGODB_URI="your_connection_string"', 'yellow');
      process.exit(1);
    }
    
    // 连接数据库
    log('🔄 连接数据库...', 'blue');
    await mongoose.connect(process.env.MONGODB_URI);
    log('✅ 数据库连接成功', 'green');
    
    // 检查是否已有数据
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      log(`⚠️  数据库中已有 ${userCount} 个用户`, 'yellow');
      log('是否要继续？这可能会创建重复数据', 'yellow');
    }
    
    // 创建创始人用户
    log('🔄 创建创始人用户...', 'blue');
    
    const founderEmail = process.env.FOUNDER_EMAIL || 'founder@example.com';
    const founderPassword = process.env.FOUNDER_PASSWORD || 'founder123456';
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ email: founderEmail });
    if (existingUser) {
      log(`⚠️  用户 ${founderEmail} 已存在`, 'yellow');
      if (existingUser.role !== 'founder') {
        existingUser.role = 'founder';
        await existingUser.save();
        log('✅ 已更新用户角色为创始人', 'green');
      }
    } else {
      // 创建新用户
      const hashedPassword = await bcrypt.hash(founderPassword, 10);
      const founder = new User({
        email: founderEmail,
        password: hashedPassword,
        name: '创始人',
        role: 'founder'
      });
      
      await founder.save();
      log(`✅ 创始人用户创建成功: ${founderEmail}`, 'green');
    }
    
    // 创建测试用户
    log('🔄 创建测试用户...', 'blue');
    const testEmail = 'test@example.com';
    const testPassword = 'test123456';
    
    const existingTestUser = await User.findOne({ email: testEmail });
    if (!existingTestUser) {
      const hashedTestPassword = await bcrypt.hash(testPassword, 10);
      const testUser = new User({
        email: testEmail,
        password: hashedTestPassword,
        name: '测试用户',
        role: 'user'
      });
      
      await testUser.save();
      log(`✅ 测试用户创建成功: ${testEmail}`, 'green');
    } else {
      log(`⚠️  测试用户 ${testEmail} 已存在`, 'yellow');
    }
    
    // 显示用户统计
    const totalUsers = await User.countDocuments();
    const founderUsers = await User.countDocuments({ role: 'founder' });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const regularUsers = await User.countDocuments({ role: 'user' });
    
    log('\n📊 数据库统计:', 'blue');
    log(`总用户数: ${totalUsers}`, 'blue');
    log(`创始人: ${founderUsers}`, 'blue');
    log(`管理员: ${adminUsers}`, 'blue');
    log(`普通用户: ${regularUsers}`, 'blue');
    
    // 断开连接
    await mongoose.disconnect();
    log('✅ 数据库连接已断开', 'green');
    
    log('\n🎉 数据库设置完成！', 'green');
    log('\n📋 测试账号信息:', 'blue');
    log(`创始人账号: ${founderEmail}`, 'blue');
    log(`创始人密码: ${founderPassword}`, 'blue');
    log(`测试账号: ${testEmail}`, 'blue');
    log(`测试密码: ${testPassword}`, 'blue');
    
    log('\n📋 下一步操作:', 'blue');
    log('1. 测试数据库连接: node test-new-db.js', 'blue');
    log('2. 部署应用程序到Netlify/Vercel', 'blue');
    log('3. 设置环境变量', 'blue');
    log('4. 测试网站功能', 'blue');
    
  } catch (error) {
    log(`❌ 设置失败: ${error.message}`, 'red');
    
    if (error.name === 'MongoServerError') {
      log('\n🔧 可能的解决方案:', 'yellow');
      log('1. 检查MongoDB Atlas集群状态', 'yellow');
      log('2. 验证数据库用户权限', 'yellow');
      log('3. 检查网络访问设置', 'yellow');
    }
    
    process.exit(1);
  }
}

// 运行设置
setupNewDatabase();
