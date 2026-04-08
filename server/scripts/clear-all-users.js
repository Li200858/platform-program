/**
 * 一次性清空 User 集合（作品、反馈等其它数据不动）。
 *
 * 用法（在项目根目录）：
 *   export MONGODB_URI="你的连接串"   # 或在 server/.env 中配置
 *   npm run db:clear-users
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function main() {
  const uri =
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/platform-program';

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 20000,
    connectTimeoutMS: 20000,
  });

  const result = await User.deleteMany({});
  console.log('已删除用户数量:', result.deletedCount);
  await mongoose.disconnect();
  console.log('完成。所有人需重新注册；超级管理员：姓名「李昌轩」+ 班级「NEE4」。');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
