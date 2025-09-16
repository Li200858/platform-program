// 反馈路由
const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

// 创建反馈
router.post('/', async (req, res) => {
  try {
    const { content, category, authorName, authorClass, authorAvatar } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: '请填写反馈内容' });
    }

    if (!authorName || !authorClass) {
      return res.status(400).json({ error: '请先在个人信息页面填写姓名和班级信息' });
    }
    
    const feedback = await Feedback.create({
      content,
      category: category || '其他',
      author: authorName,
      authorName,
      authorClass,
      authorAvatar: authorAvatar || '',
      createdAt: new Date()
    });
    
    res.json(feedback);
  } catch (error) {
    console.error('反馈提交失败:', error);
    res.status(500).json({ error: '反馈提交失败' });
  }
});

// 获取所有反馈（管理员功能）
router.get('/', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    console.error('获取反馈失败:', error);
    res.status(500).json({ error: '获取反馈失败' });
  }
});

// 删除反馈（管理员功能）
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminName } = req.query;
    
    // 检查管理员权限
    const admin = await require('../models/User').findOne({ name: adminName, role: 'admin' });
    if (!admin && adminName !== '李昌轩') {
      return res.status(403).json({ error: '无权限删除反馈' });
    }
    
    const feedback = await Feedback.findById(id);
    if (!feedback) return res.status(404).json({ error: '反馈不存在' });
    
    await Feedback.findByIdAndDelete(id);
    res.json({ message: '反馈删除成功' });
  } catch (error) {
    console.error('删除反馈失败:', error);
    res.status(500).json({ error: '删除反馈失败' });
  }
});

module.exports = router;
