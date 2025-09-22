#!/usr/bin/env node

// 查询网站用户脚本
const mongoose = require('mongoose');

// 用户模型
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  class: { type: String, required: true },
  avatar: String,
  userID: { type: String, unique: true, sparse: true },
  isAdmin: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin', 'founder', 'super_admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// 连接MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://Changxuan:Lcx18211080345~@cluster0.fbismat.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ MongoDB连接成功');
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error.message);
    process.exit(1);
  }
};

// 查询所有用户
const getAllUsers = async () => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    
    console.log('\n📊 网站用户列表');
    console.log('================================');
    console.log(`总用户数: ${users.length}`);
    console.log('================================');
    
    if (users.length === 0) {
      console.log('暂无用户数据');
      return;
    }
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. 用户信息:`);
      console.log(`   姓名: ${user.name}`);
      console.log(`   班级: ${user.class}`);
      console.log(`   用户ID: ${user.userID || '未设置'}`);
      console.log(`   角色: ${user.role}`);
      console.log(`   管理员: ${user.isAdmin ? '是' : '否'}`);
      console.log(`   注册时间: ${user.createdAt.toLocaleString('zh-CN')}`);
      console.log(`   头像: ${user.avatar ? '已设置' : '未设置'}`);
    });
    
    // 统计信息
    const adminCount = users.filter(u => u.isAdmin).length;
    const superAdminCount = users.filter(u => u.role === 'super_admin').length;
    const normalUserCount = users.filter(u => !u.isAdmin).length;
    
    console.log('\n📈 用户统计');
    console.log('================================');
    console.log(`超级管理员: ${superAdminCount} 人`);
    console.log(`管理员: ${adminCount - superAdminCount} 人`);
    console.log(`普通用户: ${normalUserCount} 人`);
    console.log(`总计: ${users.length} 人`);
    
  } catch (error) {
    console.error('❌ 查询用户失败:', error.message);
  }
};

// 主函数
const main = async () => {
  console.log('🔍 开始查询网站用户...');
  await connectDB();
  await getAllUsers();
  
  console.log('\n✅ 查询完成');
  process.exit(0);
};

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { getAllUsers, connectDB };
