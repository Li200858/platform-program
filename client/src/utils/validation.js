// 验证工具函数
export const validation = {
  // 验证用户信息
  validateUser(userInfo) {
    if (!userInfo) {
      return { valid: false, message: '用户信息不存在' };
    }
    
    if (!userInfo.name || !userInfo.name.trim()) {
      return { valid: false, message: '请填写姓名' };
    }
    
    if (!userInfo.class || !userInfo.class.trim()) {
      return { valid: false, message: '请填写班级' };
    }
    
    return { valid: true };
  },

  // 验证艺术作品数据
  validateArt(artData) {
    if (!artData.title || !artData.title.trim()) {
      return { valid: false, message: '请填写作品标题' };
    }
    
    if (!artData.content || !artData.content.trim()) {
      return { valid: false, message: '请填写作品描述' };
    }
    
    if (!artData.tab || !artData.tab.trim()) {
      return { valid: false, message: '请选择作品分类' };
    }
    
    return { valid: true };
  },

  // 验证活动数据
  validateActivity(activityData) {
    if (!activityData.title || !activityData.title.trim()) {
      return { valid: false, message: '请填写活动名称' };
    }
    
    if (!activityData.description || !activityData.description.trim()) {
      return { valid: false, message: '请填写活动描述' };
    }
    
    if (!activityData.startDate) {
      return { valid: false, message: '请选择开始时间' };
    }
    
    if (!activityData.endDate) {
      return { valid: false, message: '请选择结束时间' };
    }
    
    if (new Date(activityData.startDate) >= new Date(activityData.endDate)) {
      return { valid: false, message: '结束时间必须晚于开始时间' };
    }
    
    return { valid: true };
  },

  // 验证反馈数据
  validateFeedback(feedbackData) {
    if (!feedbackData.content || !feedbackData.content.trim()) {
      return { valid: false, message: '请填写反馈内容' };
    }
    
    if (feedbackData.content.trim().length < 10) {
      return { valid: false, message: '反馈内容至少需要10个字符' };
    }
    
    return { valid: true };
  },

  // 验证文件
  validateFile(file, options = {}) {
    const { maxSize = 50 * 1024 * 1024, allowedTypes = [] } = options;
    
    if (!file) {
      return { valid: false, message: '请选择文件' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, message: `文件大小不能超过 ${Math.round(maxSize / 1024 / 1024)}MB` };
    }
    
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return { valid: false, message: '不支持的文件类型' };
    }
    
    return { valid: true };
  },

  // 验证评论
  validateComment(comment) {
    if (!comment || !comment.trim()) {
      return { valid: false, message: '请输入评论内容' };
    }
    
    if (comment.trim().length < 2) {
      return { valid: false, message: '评论内容至少需要2个字符' };
    }
    
    return { valid: true };
  }
};
