const mongoose = require('mongoose');

const CrossCampusSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true }, // 可以存邮箱或用户id
  authorName: { type: String },
  authorAvatar: { type: String },
  authorClass: { type: String },
  media: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CrossCampus', CrossCampusSchema);