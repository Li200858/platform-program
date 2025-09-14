const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  category: { type: String, default: '其他' }, // 教学、宿舍、食堂、校园环境
  content: { type: String, required: true },
  author: { type: String, required: true }, // 可以存邮箱或用户id
  authorName: { type: String, default: '' },
  authorAvatar: { type: String, default: '' },
  authorClass: { type: String, default: '' },
  media: [String], // 媒体文件URL数组
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', FeedbackSchema);