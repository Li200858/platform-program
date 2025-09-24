const mongoose = require('mongoose');

const PortfolioSchema = new mongoose.Schema({
  title: { type: String, required: true }, // 作品集标题
  description: { type: String, default: '' }, // 作品集描述
  category: { 
    type: String, 
    enum: ['音乐', '绘画', '舞蹈', '写作', '摄影', '雕塑', '书法', '设计', '戏剧', '影视'], 
    default: '绘画' 
  }, // 作品集分类
  tags: [{ type: String }], // 标签
  creator: { type: String, required: true }, // 创建者
  isPublic: { type: Boolean, default: true }, // 是否公开
  featured: { type: Boolean, default: false }, // 是否精选
  works: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Art' 
  }], // 包含的作品ID
  contents: [{ // 直接存储的内容
    title: { type: String, required: true },
    content: { type: String },
    authorName: { type: String, required: true },
    authorClass: { type: String },
    media: [{
      filename: String,
      originalName: String,
      mimetype: String,
      size: Number,
      path: String,
      url: String,
    }],
    createdAt: { type: Date, default: Date.now }
  }],
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
