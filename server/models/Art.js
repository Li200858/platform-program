const mongoose = require('mongoose');

const ArtSchema = new mongoose.Schema({
  tab: { type: String, required: true }, // music, painting, dance, writing
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  authorName: { type: String },
  authorAvatar: { type: String },
  authorClass: { type: String },
  likes: { type: Number, default: 0 },
  likedUsers: [{ type: String }], // 新增，存储已点赞用户ID
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Art', ArtSchema);