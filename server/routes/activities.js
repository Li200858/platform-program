// 活动路由
const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');

// 获取所有活动
router.get('/', async (req, res) => {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 });
    res.json(activities);
  } catch (error) {
    console.error('获取活动失败:', error);
    res.status(500).json({ error: '获取活动失败' });
  }
});

// 创建活动
router.post('/', async (req, res) => {
  try {
    const { title, description, startDate, endDate, image, media, authorName, authorClass, authorAvatar } = req.body;
    
    if (!title || !description || !startDate || !endDate) {
      return res.status(400).json({ error: '请填写完整信息：标题、描述、开始时间、结束时间' });
    }

    if (!authorName || !authorClass) {
      return res.status(400).json({ error: '请先在个人信息页面填写姓名和班级信息' });
    }
    
    const activity = await Activity.create({
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      image: image || '',
      media: media || [],
      author: authorName,
      authorName,
      authorClass,
      authorAvatar: authorAvatar || '',
      likes: 0,
      likedUsers: [],
      favorites: [],
      comments: []
    });
    
    res.json(activity);
  } catch (error) {
    console.error('创建活动失败:', error);
    res.status(500).json({ error: '创建活动失败' });
  }
});

// 活动点赞/取消点赞
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const activity = await Activity.findById(id);
    if (!activity) return res.status(404).json({ error: '活动不存在' });
    
    if (!activity.likedUsers) activity.likedUsers = [];
    const idx = activity.likedUsers.indexOf(userId);
    
    if (idx !== -1) {
      activity.likedUsers.splice(idx, 1);
      activity.likes = Math.max((activity.likes || 1) - 1, 0);
    } else {
      activity.likedUsers.push(userId);
      activity.likes = (activity.likes || 0) + 1;
    }
    
    await activity.save();
    res.json(activity);
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

// 活动收藏/取消收藏
router.post('/:id/favorite', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const activity = await Activity.findById(id);
    if (!activity) return res.status(404).json({ error: '活动不存在' });
    
    if (!activity.favorites) activity.favorites = [];
    const idx = activity.favorites.indexOf(userId);
    
    if (idx !== -1) {
      activity.favorites.splice(idx, 1);
    } else {
      activity.favorites.push(userId);
    }
    
    await activity.save();
    res.json(activity);
  } catch (error) {
    console.error('收藏操作失败:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

// 活动评论
router.post('/:id/comment', async (req, res) => {
  try {
    const { id } = req.params;
    const { author, authorClass, content, authorAvatar } = req.body;
    
    if (!author || !authorClass || !content) {
      return res.status(400).json({ error: '请填写完整信息' });
    }
    
    const activity = await Activity.findById(id);
    if (!activity) return res.status(404).json({ error: '活动不存在' });
    
    const comment = {
      id: Date.now().toString(),
      author,
      authorClass,
      content,
      authorAvatar: authorAvatar || '',
      createdAt: new Date()
    };
    
    if (!activity.comments) activity.comments = [];
    activity.comments.push(comment);
    await activity.save();
    
    res.json(activity);
  } catch (error) {
    console.error('添加评论失败:', error);
    res.status(500).json({ error: '添加评论失败' });
  }
});

// 删除活动
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { authorName, isAdmin } = req.query;
    
    const activity = await Activity.findById(id);
    if (!activity) return res.status(404).json({ error: '活动不存在' });
    
    // 检查权限：只有作者或管理员可以删除
    if (activity.authorName !== authorName && isAdmin !== 'true') {
      return res.status(403).json({ error: '无权限删除此活动' });
    }
    
    await Activity.findByIdAndDelete(id);
    res.json({ message: '活动删除成功' });
  } catch (error) {
    console.error('删除活动失败:', error);
    res.status(500).json({ error: '删除活动失败' });
  }
});

// 获取我的活动
router.get('/my-activities', async (req, res) => {
  try {
    const { authorName } = req.query;
    
    if (!authorName) {
      return res.status(400).json({ error: '缺少作者姓名参数' });
    }

    const activities = await Activity.find({ authorName }).sort({ createdAt: -1 });
    res.json(activities);
  } catch (error) {
    console.error('获取我的活动失败:', error);
    res.status(500).json({ error: '获取活动失败' });
  }
});

// 获取收藏的活动
router.get('/favorites', async (req, res) => {
  try {
    const { authorName } = req.query;
    
    if (!authorName) {
      return res.status(400).json({ error: '缺少作者姓名参数' });
    }

    const activities = await Activity.find({ 
      favorites: { $in: [authorName] } 
    }).sort({ createdAt: -1 });
    res.json(activities);
  } catch (error) {
    console.error('获取收藏活动失败:', error);
    res.status(500).json({ error: '获取收藏活动失败' });
  }
});

// 获取喜欢的活动
router.get('/likes', async (req, res) => {
  try {
    const { authorName } = req.query;
    
    if (!authorName) {
      return res.status(400).json({ error: '缺少作者姓名参数' });
    }

    const activities = await Activity.find({ 
      likedUsers: { $in: [authorName] } 
    }).sort({ createdAt: -1 });
    res.json(activities);
  } catch (error) {
    console.error('获取喜欢活动失败:', error);
    res.status(500).json({ error: '获取喜欢活动失败' });
  }
});

module.exports = router;
