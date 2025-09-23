const mongoose = require('mongoose');

const PortfolioSchema = new mongoose.Schema({
  title: { type: String, required: true }, // 作品集标题
  description: { type: String, default: '' }, // 作品集描述
  category: { 
    type: String, 
    enum: ['art', 'activity'], 
    default: 'art' 
  }, // 作品集分类
  tags: [{ type: String }], // 标签
  creator: { type: String, required: true }, // 创建者
  isPublic: { type: Boolean, default: true }, // 是否公开
  featured: { type: Boolean, default: false }, // 是否精选
  works: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Art' 
  }], // 包含的作品ID
  views: { type: Number, default: 0 }, // 浏览次数
  likes: { type: Number, default: 0 }, // 点赞数
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 更新时自动设置updatedAt
PortfolioSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Portfolio', PortfolioSchema);
