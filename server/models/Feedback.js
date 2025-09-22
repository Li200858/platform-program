const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  content: { type: String, required: true },
  category: { type: String, default: '其他' },
  author: { type: String, required: true },
  authorName: { type: String, required: true },
  authorClass: { type: String, required: true },
  authorAvatar: { type: String, default: '' },
  status: { type: String, default: 'pending', enum: ['pending', 'processing', 'resolved'] },
  adminReply: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', FeedbackSchema);