const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  creator: { type: String, required: true }, // 创建者用户名
  members: [{
    username: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['owner', 'admin', 'member'], 
      default: 'member' 
    },
    joinedAt: { type: Date, default: Date.now }
  }],
  projects: [{
    title: { type: String, required: true },
    description: { type: String, default: '' },
    type: { 
      type: String, 
      enum: ['art', 'activity'], 
      required: true 
    },
    content: { type: String, default: '' },
    media: [{ type: String }],
    status: { 
      type: String, 
      enum: ['draft', 'in_progress', 'review', 'completed'], 
      default: 'draft' 
    },
    contributors: [{ type: String }], // 贡献者用户名列表
    versions: [{
      version: { type: String, required: true },
      content: { type: String, required: true },
      media: [{ type: String }],
      author: { type: String, required: true },
      message: { type: String, default: '' }, // 版本说明
      createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],
  isPublic: { type: Boolean, default: true }, // 是否公开团队
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Team', TeamSchema);
