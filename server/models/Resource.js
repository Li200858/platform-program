const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  title: { type: String, required: true }, // 资料标题
  description: { type: String, default: '' }, // 资料描述
  category: { 
    type: String, 
    enum: ['template', 'image', 'video', 'audio', 'document', 'tutorial'], 
    default: 'template' 
  }, // 资料分类
  tags: [{ type: String }], // 标签
  uploader: { type: String, required: true }, // 上传者
  isPublic: { type: Boolean, default: true }, // 是否公开
  files: [{
    filename: String, // 文件名
    originalName: String, // 原始文件名
    mimetype: String, // 文件类型
    size: Number, // 文件大小
    path: String, // 文件路径
    url: String // 访问URL
  }], // 文件信息
  downloads: { type: Number, default: 0 }, // 下载次数
  views: { type: Number, default: 0 }, // 浏览次数
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 更新时自动设置updatedAt
ResourceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Resource', ResourceSchema);
