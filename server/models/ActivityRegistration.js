const mongoose = require('mongoose');

const ActivityRegistrationSchema = new mongoose.Schema({
  activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'ActivityApplication', required: true },
  activityTitle: { type: String, required: true }, // 冗余字段，方便查询
  applicant: {
    userID: { type: String, required: true },
    name: { type: String, required: true },
    class: { type: String, required: true },
    contact: { type: String, default: '' } // 联系方式
  },
  reason: { type: String, default: '' }, // 申请原因
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  }, // 审核状态
  reviewedBy: { type: String, default: '' }, // 审核人（活动组织者）
  reviewedAt: { type: Date }, // 审核时间
  rejectedReason: { type: String, default: '' }, // 拒绝原因
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 确保每个用户对同一活动只能报名一次
ActivityRegistrationSchema.index({ 'applicant.userID': 1, activityId: 1 }, { unique: true });

module.exports = mongoose.model('ActivityRegistration', ActivityRegistrationSchema);









