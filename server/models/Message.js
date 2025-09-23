const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: { type: String, required: true }, // 发送者用户名
  receiver: { type: String, required: true }, // 接收者用户名
  content: { type: String, required: true },
  media: [{ type: String }], // 媒体文件URL
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
