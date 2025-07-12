const mongoose = require('mongoose');

const PendingContentSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true, 
    enum: ['study', 'art', 'activity', 'crosscampus'] 
  }, // 内容类型
  category: { 
    type: String, 
    required: true,
    enum: [
      // 学习板块分类
      'PBL项目式学习', '学习经验分享', '学习资料分享', '科普内容',
      // 艺术板块分类
      '音乐', '绘画', '舞蹈', '写作',
      // 跨校联合分类
      '活动举办', '学术交流',
      // 活动板块分类
      '活动策划',
      // 其他
      '其他'
    ]
  }, // 分类
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, default: '' }, // 作者昵称
  authorAvatar: { type: String, default: '' }, // 作者头像
  media: [{ type: String }], // 媒体文件URL数组
  status: { 
    type: String, 
    default: 'pending', 
    enum: ['pending', 'approved', 'rejected'] 
  }, // 审核状态
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 审核人
  reviewNote: { type: String, default: '' }, // 审核备注
  originalData: { type: mongoose.Schema.Types.Mixed }, // 原始数据（用于审核通过后创建正式内容）
}, { timestamps: true });

module.exports = mongoose.model('PendingContent', PendingContentSchema); 