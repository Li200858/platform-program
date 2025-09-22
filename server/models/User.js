const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  class: { type: String, default: '' },
  role: { type: String, default: 'user', enum: ['admin', 'user'] },
  isAdmin: { type: Boolean, default: false },
  avatar: { type: String, default: '' },
  userID: { type: String, unique: true, sparse: true }, // 用户唯一ID
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);