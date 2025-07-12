const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function setupFounder() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/campus-platform');
    console.log('数据库连接成功');

    // 检查是否已有创始人
    const existingFounder = await User.findOne({ role: 'founder' });
    if (existingFounder) {
      console.log('已存在创始人用户:', existingFounder.email);
      return;
    }

    // 查找第一个注册的用户，将其设为创始人
    const firstUser = await User.findOne().sort({ createdAt: 1 });
    if (!firstUser) {
      console.log('没有找到任何用户，请先注册一个用户');
      return;
    }

    // 将第一个用户设为创始人
    firstUser.role = 'founder';
    await firstUser.save();
    
    console.log('已将用户设为创始人:', firstUser.email);
    console.log('创始人邮箱:', firstUser.email);
    console.log('请使用此邮箱登录，然后可以在管理员面板中管理其他用户权限');

  } catch (error) {
    console.error('设置创始人失败:', error);
  } finally {
    await mongoose.disconnect();
  }
}

setupFounder(); 