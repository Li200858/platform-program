const mongoose = require('mongoose');

const ClubApplicationSchema = new mongoose.Schema({
  clubName: { type: String, required: true }, // 社团名称
  description: { type: String, default: '' }, // 社团介绍
  activityContent: { type: String, default: '' }, // 活动内容
  location: { type: String, required: true }, // 活动地点
  activityTime: { type: String, default: '' }, // 活动时间
  duration: { type: Number, default: 1 }, // 持续时间（周数）
  maxMembers: { type: Number, required: true }, // 人数限制
  files: [{ type: String }], // 上传的文件
  applicant: {
    userID: { type: String, required: true },
    name: { type: String, required: true },
    class: { type: String, default: '' }
  }, // 申请人信息
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  }, // 审核状态
  reviewedBy: { type: String, default: '' }, // 审核人
  reviewedAt: { type: Date }, // 审核时间
  rejectedReason: { type: String, default: '' }, // 拒绝原因
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ClubApplication', ClubApplicationSchema);









