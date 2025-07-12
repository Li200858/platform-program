const mongoose = require('mongoose');

const StudySchema = new mongoose.Schema({
  tab: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  authorName: { type: String },      // 新增
  authorAvatar: { type: String },    // 新增
  authorClass: { type: String },     // 新增
  media: [String],
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Study', StudySchema);