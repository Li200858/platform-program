const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user', enum: ['founder', 'admin', 'user'] }, // 创始人、管理员、用户
  name: { type: String, unique: true, sparse: true }, // sparse 允许为空时不报错
  age: { type: Number, default: null },     // 年级
  class: { type: String, default: '' },     // 班级
  avatar: { type: String, default: '' }     // 头像url
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);

