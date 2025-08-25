#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

// 导入User模型
const User = require('./server/models/User');

// 连接MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('❌ MONGODB_URI 环境变量未设置');
      return false;
    }
    
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB连接成功');
    return true;
  } catch (err) {
    console.error('❌ MongoDB连接失败:', err.message);
    return false;
  }
};

// 恢复管理员账号
const restoreAdmin = async () => {
  try {
    console.log('🔧 开始恢复管理员账号...');
    
    // 检查是否已存在管理员账号
    const existingAdmin = await User.findOne({ role: 'founder' });
    if (existingAdmin) {
      console.log('⚠️  已存在创始人账号:', existingAdmin.email);
      console.log('📧 邮箱:', existingAdmin.email);
      console.log('🔑 角色:', existingAdmin.role);
      return;
    }
    
    // 创建新的创始人账号
    const adminData = {
      email: 'admin@platform.com',
      password: 'admin123456', // 临时密码，请及时修改
      name: '系统管理员',
      role: 'founder',
      age: 25,
      class: '管理员',
      avatar: 'https://via.placeholder.com/150/007bff/ffffff?text=Admin'
    };
    
    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ email: adminData.email });
    if (existingUser) {
      // 如果用户存在，提升为创始人
      existingUser.role = 'founder';
      existingUser.name = adminData.name;
      existingUser.age = adminData.age;
      existingUser.class = adminData.class;
      existingUser.avatar = adminData.avatar;
      await existingUser.save();
      console.log('✅ 已提升现有用户为创始人');
    } else {
      // 创建新用户
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(adminData.password, 10);
      adminData.password = hashedPassword;
      
      const newAdmin = await User.create(adminData);
      console.log('✅ 创始人账号创建成功');
    }
    
    console.log('\n📋 管理员账号信息:');
    console.log('📧 邮箱:', adminData.email);
    console.log('🔑 密码:', adminData.password === 'admin123456' ? 'admin123456 (请及时修改)' : '已加密');
    console.log('🔑 角色:', adminData.role);
    console.log('👤 姓名:', adminData.name);
    
    console.log('\n⚠️  重要提醒:');
    console.log('1. 请使用上述账号密码登录');
    console.log('2. 登录后立即修改密码');
    console.log('3. 这个账号拥有最高权限');
    
  } catch (error) {
    console.error('❌ 恢复管理员账号失败:', error.message);
  }
};

// 主函数
const main = async () => {
  console.log('🚀 管理员账号恢复工具');
  console.log('========================\n');
  
  const connected = await connectDB();
  if (!connected) {
    console.log('❌ 无法连接数据库，请检查环境变量');
    process.exit(1);
  }
  
  await restoreAdmin();
  
  // 关闭数据库连接
  await mongoose.connection.close();
  console.log('\n✅ 操作完成');
};

// 运行脚本
main().catch(console.error);
