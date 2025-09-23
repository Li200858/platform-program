const mongoose = require('mongoose');

const FollowSchema = new mongoose.Schema({
  follower: { type: String, required: true }, // 关注者用户名
  following: { type: String, required: true }, // 被关注者用户名
  createdAt: { type: Date, default: Date.now }
});

// 创建复合索引，确保一个用户不能重复关注另一个用户
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

module.exports = mongoose.model('Follow', FollowSchema);
