#!/usr/bin/env node

// 详细查询网站用户脚本
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
    // 查询所有用户
    const allUsers = await User.find({}).sort({ createdAt: -1 });
    
    console.log('\n📊 所有用户列表');
    console.log('================================');
    console.log(`总用户数: ${allUsers.length}`);
    console.log('================================');
    
    if (allUsers.length === 0) {
      console.log('暂无用户数据');
      return;
    }
    
    allUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. 用户信息:`);
      console.log(`   姓名: "${user.name}"`);
      console.log(`   班级: "${user.class}"`);
      console.log(`   用户ID: ${user.userID || '未设置'}`);
      console.log(`   角色: ${user.role}`);
      console.log(`   管理员: ${user.isAdmin ? '是' : '否'}`);
      console.log(`   注册时间: ${user.createdAt.toLocaleString('zh-CN')}`);
      console.log(`   头像: ${user.avatar ? '已设置' : '未设置'}`);
      console.log(`   完整对象:`, JSON.stringify(user, null, 2));
    });
    
    // 特别查询李昌轩
    console.log('\n🔍 特别查询 "李昌轩"');
    console.log('================================');
    
    const lichangxuan = await User.find({ name: '李昌轩' });
    console.log(`找到 ${lichangxuan.length} 个名为 "李昌轩" 的用户`);
    
    if (lichangxuan.length > 0) {
      lichangxuan.forEach((user, index) => {
        console.log(`\n李昌轩 ${index + 1}:`);
        console.log(`   姓名: "${user.name}"`);
        console.log(`   班级: "${user.class}"`);
        console.log(`   角色: ${user.role}`);
        console.log(`   管理员: ${user.isAdmin ? '是' : '否'}`);
        console.log(`   注册时间: ${user.createdAt.toLocaleString('zh-CN')}`);
      });
    } else {
      console.log('❌ 没有找到名为 "李昌轩" 的用户');
    }
    
    // 查询包含 "李" 的用户
    console.log('\n🔍 查询包含 "李" 的用户');
    console.log('================================');
    
    const liUsers = await User.find({ name: { $regex: '李', $options: 'i' } });
    console.log(`找到 ${liUsers.length} 个包含 "李" 的用户`);
    
    liUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. 姓名: "${user.name}"`);
      console.log(`   班级: "${user.class}"`);
      console.log(`   角色: ${user.role}`);
    });
    
    // 统计信息
    const adminCount = allUsers.filter(u => u.isAdmin).length;
    const superAdminCount = allUsers.filter(u => u.role === 'super_admin').length;
    const normalUserCount = allUsers.filter(u => !u.isAdmin).length;
    
    console.log('\n📈 用户统计');
    console.log('================================');
    console.log(`超级管理员: ${superAdminCount} 人`);
    console.log(`管理员: ${adminCount - superAdminCount} 人`);
    console.log(`普通用户: ${normalUserCount} 人`);
    console.log(`总计: ${allUsers.length} 人`);
    
  } catch (error) {
    console.error('❌ 查询用户失败:', error.message);
  }
};

// 主函数
const main = async () => {
  console.log('🔍 开始详细查询网站用户...');
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
