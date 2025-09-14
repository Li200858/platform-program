const mongoose = require('mongoose');

const ArtSchema = new mongoose.Schema({
  tab: { type: String, required: true }, // music, painting, dance, writing
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true }, // 作者姓名
  authorClass: { type: String, required: true }, // 作者班级
  media: [String], // 媒体文件URL数组
  tags: [String], // 标签数组
  likes: { type: Number, default: 0 },
  likedUsers: [{ type: String }], // 存储已点赞用户ID
  views: { type: Number, default: 0 }, // 浏览量
  shares: { type: Number, default: 0 }, // 分享数
  comments: [{
    id: { type: String, required: true },
    author: { type: String, required: true },
    authorClass: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  favorites: [{ type: String }], // 收藏用户
  isFeatured: { type: Boolean, default: false }, // 是否为精选作品
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 更新时自动设置updatedAt
ArtSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Art', ArtSchema);