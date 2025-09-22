const mongoose = require('mongoose');

const MaintenanceSchema = new mongoose.Schema({
  isEnabled: { type: Boolean, default: false },
  message: { type: String, default: '网站正在维护中，暂时无法发布作品和评论，请稍后再试。' },
  enabledBy: { type: String, default: '' }, // 开启维护模式的管理员
  enabledAt: { type: Date, default: null },
  disabledAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Maintenance', MaintenanceSchema);
