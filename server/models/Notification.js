const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: { type: String, required: true }, // 接收通知的用户
  sender: { type: String, required: true }, // 触发通知的用户
  type: { 
    type: String, 
    required: true,
    enum: ['like', 'comment', 'follow', 'mention', 'team_invite', 'team_update']
  },
  content: { type: String, required: true }, // 通知内容
  relatedId: { type: String }, // 相关内容的ID（如作品ID、活动ID等）
  relatedType: { 
    type: String,
    enum: ['art', 'activity', 'feedback', 'team', 'user']
  },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema);
