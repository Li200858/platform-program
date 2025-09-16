// 创建测试管理员用户
const mongoose = require('mongoose');
const User = require('./server/models/User');

const createTestAdmin = async () => {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/platform-program');
    
    // 创建测试管理员用户
    const testAdmin = new User({
      userId: 'test_user_2',
      name: '测试2',
      class: '高三(1)班',
      avatar: '',
      isAdmin: true,
      role: 'admin'
    });
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ userId: 'test_user_2' });
    if (existingUser) {
      console.log('✅ 测试管理员用户已存在');
      // 更新为管理员
      existingUser.isAdmin = true;
      existingUser.role = 'admin';
      await existingUser.save();
      console.log('✅ 已更新为管理员权限');
    } else {
      await testAdmin.save();
      console.log('✅ 测试管理员用户创建成功');
    }
    
    console.log('👤 测试用户信息:', {
      userId: testAdmin.userId,
      name: testAdmin.name,
      class: testAdmin.class,
      isAdmin: testAdmin.isAdmin
    });
    
  } catch (error) {
    console.error('❌ 创建测试管理员失败:', error);
  } finally {
    await mongoose.disconnect();
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  createTestAdmin();
}

module.exports = createTestAdmin;
