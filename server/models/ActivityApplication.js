const mongoose = require('mongoose');

const ActivityApplicationSchema = new mongoose.Schema({
  title: { type: String, required: true }, // 活动名称
  participantCount: { type: Number, required: true }, // 活动人数
  activityTime: { type: Date, required: true }, // 活动时间
  location: { type: String, required: true }, // 活动地点
  description: { type: String, default: '' }, // 活动简要描述
  process: { type: String, default: '' }, // 活动流程
  requirements: { type: String, default: '' }, // 活动需求（经费、人员、技术等）
  files: [{ type: String }], // 上传的文件
  organizer: {
    userID: { type: String, required: true },
    name: { type: String, required: true },
    class: { type: String, default: '' }
  }, // 组织者信息
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  }, // 审核状态
  reviewedBy: { type: String, default: '' }, // 审核人
  reviewedAt: { type: Date }, // 审核时间
  rejectedReason: { type: String, default: '' }, // 拒绝原因
  // 活动阶段
  stages: [{
    name: { type: String, required: true }, // 阶段名称
    description: { type: String, default: '' }, // 阶段描述
    startTime: { type: Date, required: true }, // 开始时间
    endTime: { type: Date, required: true }, // 结束时间
    type: { 
      type: String, 
      enum: ['preparation', 'ongoing', 'completed', 'custom'], 
      default: 'custom' 
    }, // 阶段类型
    order: { type: Number, default: 0 } // 顺序
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityApplication', ActivityApplicationSchema);









