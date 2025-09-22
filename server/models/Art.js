const mongoose = require('mongoose');

const ArtSchema = new mongoose.Schema({
  tab: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  authorName: { type: String, required: true },
  authorClass: { type: String, required: true },
  media: [String],
  likes: { type: Number, default: 0 },
  likedUsers: [String],
  views: { type: Number, default: 0 },
  comments: [{
    id: { type: String, required: true },
    author: { type: String, required: true },
    authorClass: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  favorites: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 更新时自动设置updatedAt
ArtSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Art', ArtSchema);