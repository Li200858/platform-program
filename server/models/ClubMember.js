const mongoose = require('mongoose');

const ClubMemberSchema = new mongoose.Schema({
  userID: { type: String, required: true },
  name: { type: String, required: true },
  class: { type: String, default: '' },
  clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  clubName: { type: String, required: true }, // 冗余字段，方便查询
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  }, // 报名状态
  appliedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  // 社团轮换相关
  switchRequest: {
    requestedClubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
    requestedClubName: { type: String },
    requestedAt: { type: Date },
    status: { 
      type: String, 
      enum: ['none', 'pending', 'approved', 'rejected'], 
      default: 'none' 
    },
    switchStartTime: { type: Date }, // 轮换开始时间（周日17:00）
    switchEndTime: { type: Date } // 轮换截止时间（周四21:50）
  }
});

// 确保每个用户在同一时间只能属于一个社团
ClubMemberSchema.index({ userID: 1, status: 1 });

module.exports = mongoose.model('ClubMember', ClubMemberSchema);









