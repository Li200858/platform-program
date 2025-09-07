const mongoose = require('mongoose');
const User = require('./server/models/User');
const path = require('path');

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

async function setupFounderByEmail() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/campus-platform');
    console.log('数据库连接成功');

    // 获取创始人邮箱列表
    const founderEmails = process.env.FOUNDER_EMAILS ? process.env.FOUNDER_EMAILS.split(',').map(e => e.trim()) : [];
    
    if (founderEmails.length === 0) {
      console.log('⚠️  未设置FOUNDER_EMAILS环境变量');
      console.log('请在.env文件中添加: FOUNDER_EMAILS=your-email@example.com');
      return;
    }

    console.log('📧 创始人邮箱列表:', founderEmails);

    // 检查每个创始人邮箱
    for (const email of founderEmails) {
      const user = await User.findOne({ email });
      if (user) {
        if (user.role !== 'founder') {
          user.role = 'founder';
          await user.save();
          console.log(`✅ 已更新用户为创始人: ${email}`);
        } else {
          console.log(`✅ 用户已是创始人: ${email}`);
        }
      } else {
        console.log(`⚠️  用户不存在: ${email}`);
        console.log(`   请先使用此邮箱注册账户`);
      }
    }

    // 显示所有创始人
    const founders = await User.find({ role: 'founder' });
    console.log('\n📋 当前创始人列表:');
    founders.forEach(founder => {
      console.log(`   - ${founder.email} (${founder.name || '未设置姓名'})`);
    });

  } catch (error) {
    console.error('设置创始人失败:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  setupFounderByEmail();
}

module.exports = setupFounderByEmail;
