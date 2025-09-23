const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  class: { type: String, default: '' },
  role: { type: String, default: 'user', enum: ['admin', 'user'] },
  isAdmin: { type: Boolean, default: false },
  avatar: { type: String, default: '' },
  userID: { type: String, unique: true, sparse: true }, // 用户唯一ID
  bio: { type: String, default: '' }, // 个人简介
  isOnline: { type: Boolean, default: false }, // 在线状态
  lastActive: { type: Date, default: Date.now }, // 最后活跃时间
  notificationSettings: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    like: { type: Boolean, default: true },
    comment: { type: Boolean, default: true },
    follow: { type: Boolean, default: true },
    mention: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);