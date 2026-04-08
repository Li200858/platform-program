const mongoose = require('mongoose');

const ActivityStageSchema = new mongoose.Schema({
  activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'ActivityApplication', required: true },
  name: { type: String, required: true }, // 阶段名称
  description: { type: String, default: '' }, // 阶段描述
  startTime: { type: Date, required: true }, // 开始时间
  endTime: { type: Date, required: true }, // 结束时间
  type: { 
    type: String, 
    enum: ['preparation', 'ongoing', 'completed', 'custom'], 
    default: 'custom' 
  }, // 阶段类型：准备阶段、进行中、已结束、自定义
  order: { type: Number, default: 0 }, // 顺序
  isActive: { type: Boolean, default: false }, // 当前是否激活
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 索引优化查询
ActivityStageSchema.index({ activityId: 1, order: 1 });
ActivityStageSchema.index({ activityId: 1, isActive: 1 });

module.exports = mongoose.model('ActivityStage', ActivityStageSchema);









