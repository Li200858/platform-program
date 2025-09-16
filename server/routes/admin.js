// 管理员路由
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Feedback = require('../models/Feedback');

// 检查管理员状态
router.get('/check', async (req, res) => {
  try {
    const { userName } = req.query;
    
    if (!userName) {
      return res.status(400).json({ error: '缺少用户名参数' });
    }

    console.log(`🔍 检查管理员状态: "${userName}"`);
    
    // 检查是否是李昌轩（固定管理员）
    const isLiChangxuan = userName === '李昌轩' || userName.includes('李昌轩');
    if (isLiChangxuan) {
      console.log('✅ 识别为固定管理员: 李昌轩');
      return res.json({ isAdmin: true, isInitial: true, name: '李昌轩' });
    }

    // 检查数据库中是否有该用户的管理员记录
    const user = await User.findOne({ 
      $or: [
        { name: userName },
        { userId: userName }
      ],
      role: 'admin' 
    });
    
    if (user) {
      console.log(`✅ 找到管理员用户: ${user.name} (${user.userId})`);
      return res.json({ 
        isAdmin: true, 
        isInitial: false, 
        name: user.name,
        userId: user.userId,
        class: user.class
      });
    }
    
    console.log(`❌ 用户 "${userName}" 不是管理员`);
    res.json({ isAdmin: false, isInitial: false });
  } catch (error) {
    console.error('❌ 检查管理员状态失败:', error);
    res.status(500).json({ error: '检查失败' });
  }
});

// 获取所有反馈
router.get('/feedback', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    console.error('获取反馈失败:', error);
    res.status(500).json({ error: '获取反馈失败' });
  }
});

// 删除反馈
router.delete('/feedback/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminName } = req.query;
    
    // 检查管理员权限
    const admin = await User.findOne({ name: adminName, role: 'admin' });
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

// 获取所有管理员用户
router.get('/users', async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) {
    console.error('获取管理员失败:', error);
    res.status(500).json({ error: '获取管理员失败' });
  }
});

// 搜索用户
router.get('/search-users', async (req, res) => {
  try {
    const { q } = req.query;
    
    console.log(`🔍 收到搜索请求: "${q}"`);
    
    if (!q || q.trim().length === 0) {
      console.log('❌ 搜索查询为空，返回空结果');
      return res.json([]);
    }

    // 检查数据库连接状态
    if (require('mongoose').connection.readyState !== 1) {
      console.error('❌ 数据库未连接，状态:', require('mongoose').connection.readyState);
      return res.status(500).json({ error: '数据库连接失败' });
    }
    
    console.log(`✅ 数据库连接正常，开始搜索用户: "${q}"`);
    
    const searchRegex = new RegExp(q.trim(), 'i');
    console.log(`🔍 搜索正则表达式: ${searchRegex}`);
    
    const users = await User.find({
      name: searchRegex
    })
    .select('userId name class role isAdmin createdAt')
    .limit(20)
    .sort({ createdAt: -1 });
    
    console.log(`📊 数据库查询完成，找到 ${users.length} 个用户`);
    
    const result = users.map(user => ({
      userId: user.userId || '',
      name: user.name,
      class: user.class || '未知',
      role: user.role || 'user',
      isAdmin: user.isAdmin || false,
      createdAt: user.createdAt
    }));
    
    console.log(`✅ 搜索 "${q}" 成功，返回 ${result.length} 个结果`);
    res.json(result);
  } catch (error) {
    console.error('❌ 搜索用户失败:', error);
    res.status(500).json({ 
      error: '搜索失败', 
      details: error.message,
      query: req.query.q 
    });
  }
});

// 添加管理员
router.post('/add-admin', async (req, res) => {
  try {
    const { userName, addedBy } = req.body;
    
    if (!userName || !addedBy) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 检查添加者是否有权限
    const adder = await User.findOne({ name: addedBy, role: 'admin' });
    if (!adder && addedBy !== '李昌轩') {
      return res.status(403).json({ error: '无权限添加管理员' });
    }

    // 查找或创建用户
    let user = await User.findOne({ name: userName });
    if (!user) {
      user = await User.create({
        userId: userName,
        email: `${userName}@temp.com`,
        password: 'temp',
        name: userName,
        role: 'admin'
      });
    } else {
      user.role = 'admin';
      await user.save();
    }

    res.json({ message: '管理员添加成功', user });
  } catch (error) {
    console.error('添加管理员失败:', error);
    res.status(500).json({ error: '添加失败' });
  }
});

// 移除管理员
router.post('/remove-admin', async (req, res) => {
  try {
    const { userName, removedBy } = req.body;
    
    if (!userName || !removedBy) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 检查移除者是否有权限
    const remover = await User.findOne({ name: removedBy, role: 'admin' });
    if (!remover && removedBy !== '李昌轩') {
      return res.status(403).json({ error: '无权限移除管理员' });
    }

    // 不能移除自己
    if (userName === removedBy) {
      return res.status(400).json({ error: '不能移除自己的管理员权限' });
    }

    const user = await User.findOne({ name: userName });
    if (user) {
      user.role = 'user';
      await user.save();
    }

    res.json({ message: '管理员移除成功' });
  } catch (error) {
    console.error('移除管理员失败:', error);
    res.status(500).json({ error: '移除失败' });
  }
});

// 维护模式相关API
router.get('/maintenance/status', async (req, res) => {
  try {
    res.json({
      maintenanceMode: false,
      maintenanceMessage: ''
    });
  } catch (error) {
    console.error('获取维护状态失败:', error);
    res.status(500).json({ error: '获取维护状态失败' });
  }
});

router.post('/maintenance/toggle', async (req, res) => {
  try {
    const { enabled, message, adminName } = req.body;
    
    if (!adminName) {
      return res.status(400).json({ error: '缺少管理员信息' });
    }

    // 检查操作者是否有权限
    const admin = await User.findOne({ name: adminName, role: 'admin' });
    if (!admin && adminName !== '李昌轩') {
      return res.status(403).json({ error: '无权限操作维护模式' });
    }

    res.json({
      maintenanceMode: enabled,
      maintenanceMessage: message || '',
      message: enabled ? '维护模式已开启' : '维护模式已关闭'
    });
  } catch (error) {
    console.error('切换维护模式失败:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

module.exports = router;
