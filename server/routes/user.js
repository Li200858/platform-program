// 用户路由
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 保存用户数据到云端
router.post('/', async (req, res) => {
  try {
    const { userId, name, class: userClass, avatar, isAdmin } = req.body;
    
    if (!userId || !name || !userClass) {
      return res.status(400).json({ error: '缺少必要字段' });
    }
    
    // 查找或创建用户
    const existingUser = await User.findOne({ userId });
    
    if (existingUser) {
      // 更新现有用户
      existingUser.name = name;
      existingUser.class = userClass;
      existingUser.avatar = avatar || '';
      existingUser.isAdmin = isAdmin || false;
      await existingUser.save();
    } else {
      // 创建新用户
      await User.create({
        userId,
        name,
        class: userClass,
        avatar: avatar || '',
        isAdmin: isAdmin || false
      });
    }
    
    res.json({ message: '用户数据保存成功' });
  } catch (error) {
    console.error('保存用户数据失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取用户数据（通过用户ID）
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOne({ userId });
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 返回用户数据（不包含敏感信息）
    res.json({
      userId: user.userId,
      name: user.name,
      class: user.class,
      avatar: user.avatar,
      isAdmin: user.isAdmin || false,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('获取用户数据失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
