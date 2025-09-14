const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Art = require('./models/Art');
const Activity = require('./models/Activity');
require('dotenv').config();

const Feedback = require('./models/Feedback');
const User = require('./models/User');
const app = express();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 维护模式状态
let maintenanceMode = false;
let maintenanceMessage = '网站正在维护中，请稍后再试...';

// 身份保护中间件
app.use((req, res, next) => {
  // 记录请求信息用于身份验证
  req.requestTime = new Date();
  req.userAgent = req.get('User-Agent') || '';
  req.ip = req.ip || req.connection.remoteAddress;
  next();
});

// 维护模式中间件
app.use((req, res, next) => {
  if (maintenanceMode && !req.path.startsWith('/api/admin/maintenance')) {
    return res.status(503).json({
      error: '维护模式',
      message: maintenanceMessage,
      maintenanceMode: true
    });
  }
  next();
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    // 允许所有文件类型
    cb(null, true);
  }
});

// 连接MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/platform-program')
  .then(() => console.log('MongoDB连接成功'))
  .catch(err => console.error('MongoDB连接失败:', err));

// 文件上传API
app.post('/api/upload', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '没有上传文件' });
    }
    
    const fileUrls = req.files.map(file => `/${file.filename}`);
    res.json({ urls: fileUrls });
  } catch (error) {
    console.error('文件上传错误:', error);
    res.status(500).json({ error: '文件上传失败' });
  }
});

// 发布艺术作品（需要身份信息）
app.post('/api/art', async (req, res) => {
  const { tab, title, content, media, authorName, authorClass } = req.body;
  
  if (!tab || !title || !content) {
    return res.status(400).json({ error: '请填写完整信息：分类、标题、内容' });
  }

  if (!authorName || !authorClass) {
    return res.status(400).json({ error: '请先在个人信息页面填写姓名和班级信息' });
  }
  
  try {
    const post = await Art.create({
      tab,
      title,
      content,
      author: authorName,
      authorName,
      authorClass,
      media: media || [],
      likes: 0,
      likedUsers: []
    });
    
    res.json(post);
  } catch (error) {
    console.error('发布失败:', error);
    res.status(500).json({ error: '发布失败' });
  }
});

// 获取艺术作品（可按tab分类，支持按热度或时间排序）
app.get('/api/art', async (req, res) => {
  // 确保只处理 /api/art 路径，不包括子路径
  if (req.path !== '/api/art') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  const { tab, sort } = req.query;
  const filter = tab ? { tab } : {};
  let query = Art.find(filter);
  
  if (sort === 'hot') {
    query = query.sort({ likes: -1, createdAt: -1 });
  } else {
    query = query.sort({ createdAt: -1 });
  }
  
  const posts = await query;
  res.json(posts);
});

// 点赞/取消点赞
app.post('/api/art/:id/like', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body; // 使用客户端生成的临时ID
  
  try {
    const art = await Art.findById(id);
    if (!art) return res.status(404).json({ error: '作品不存在' });
    
    if (!art.likedUsers) art.likedUsers = [];
    const idx = art.likedUsers.indexOf(userId);
    
    if (idx !== -1) {
      // 已点赞，取消点赞
      art.likedUsers.splice(idx, 1);
      art.likes = Math.max((art.likes || 1) - 1, 0);
    } else {
      // 未点赞，点赞
      art.likedUsers.push(userId);
      art.likes = (art.likes || 0) + 1;
    }
    
    await art.save();
    res.json(art);
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

// 添加评论
app.post('/api/art/:id/comment', async (req, res) => {
  const { id } = req.params;
  const { author, authorClass, content } = req.body;
  
  if (!author || !authorClass || !content) {
    return res.status(400).json({ error: '请填写完整信息' });
  }
  
  try {
    const art = await Art.findById(id);
    if (!art) return res.status(404).json({ error: '作品不存在' });
    
    const comment = {
      id: Date.now().toString(),
      author,
      authorClass,
      content,
      createdAt: new Date()
    };
    
    art.comments.push(comment);
    await art.save();
    
    res.json(art);
  } catch (error) {
    console.error('添加评论失败:', error);
    res.status(500).json({ error: '添加评论失败' });
  }
});

// 删除评论
app.delete('/api/art/:artId/comment/:commentId', async (req, res) => {
  const { artId, commentId } = req.params;
  const { authorName } = req.query;
  
  if (!authorName) {
    return res.status(400).json({ error: '缺少作者姓名参数' });
  }
  
  try {
    const art = await Art.findById(artId);
    if (!art) return res.status(404).json({ error: '作品不存在' });
    
    const commentIndex = art.comments.findIndex(comment => comment.id === commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ error: '评论不存在' });
    }
    
    const comment = art.comments[commentIndex];
    // 检查权限：评论作者本人可以删除
    if (comment.author !== authorName) {
      return res.status(403).json({ error: '无权限删除此评论' });
    }
    
    art.comments.splice(commentIndex, 1);
    await art.save();
    
    res.json(art);
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({ error: '删除评论失败' });
  }
});

// 收藏/取消收藏
app.post('/api/art/:id/favorite', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  
  try {
    const art = await Art.findById(id);
    if (!art) return res.status(404).json({ error: '作品不存在' });
    
    if (!art.favorites) art.favorites = [];
    const idx = art.favorites.indexOf(userId);
    
    if (idx !== -1) {
      // 已收藏，取消收藏
      art.favorites.splice(idx, 1);
    } else {
      // 未收藏，收藏
      art.favorites.push(userId);
    }
    
    await art.save();
    res.json(art);
  } catch (error) {
    console.error('收藏失败:', error);
    res.status(500).json({ error: '操作失败' });
  }
});


// 增加浏览量
app.post('/api/art/:id/view', async (req, res) => {
  const { id } = req.params;
  
  try {
    const art = await Art.findById(id);
    if (!art) return res.status(404).json({ error: '作品不存在' });
    
    art.views = (art.views || 0) + 1;
    await art.save();
    
    res.json({ views: art.views });
  } catch (error) {
    console.error('增加浏览量失败:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

// 搜索功能（只搜索艺术板块）
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.json({ art: [] });
  }

  try {
    const searchRegex = new RegExp(q, 'i');
    const artResults = await Art.find({ 
      $or: [{ title: searchRegex }, { content: searchRegex }] 
    }).sort({ createdAt: -1 }).limit(20);
    
    res.json({ art: artResults });
  } catch (error) {
    console.error('搜索失败:', error);
    res.status(500).json({ error: '搜索失败' });
  }
});

// 获取我的作品
app.get('/api/art/my-works', async (req, res) => {
  const { authorName } = req.query;
  
  if (!authorName) {
    return res.status(400).json({ error: '缺少作者姓名参数' });
  }

  try {
    // 查询 author 字段，因为模型中只有 author 字段
    const works = await Art.find({ author: authorName }).sort({ createdAt: -1 });
    res.json(works);
  } catch (error) {
    console.error('获取我的作品失败:', error);
    res.status(500).json({ error: '获取作品失败' });
  }
});

// 获取我的收藏
app.get('/api/art/favorites', async (req, res) => {
  const { authorName } = req.query;
  
  if (!authorName) {
    return res.status(400).json({ error: '缺少作者姓名参数' });
  }

  try {
    // 查询 favorites 数组中包含该用户ID的作品
    const works = await Art.find({ favorites: { $in: [authorName] } }).sort({ createdAt: -1 });
    res.json(works);
  } catch (error) {
    console.error('获取收藏失败:', error);
    res.status(500).json({ error: '获取收藏失败' });
  }
});

// 获取我的喜欢
app.get('/api/art/likes', async (req, res) => {
  const { authorName } = req.query;
  
  if (!authorName) {
    return res.status(400).json({ error: '缺少作者姓名参数' });
  }

  try {
    // 查询 likedUsers 数组中包含该用户ID的作品
    const works = await Art.find({ likedUsers: { $in: [authorName] } }).sort({ createdAt: -1 });
    res.json(works);
  } catch (error) {
    console.error('获取喜欢失败:', error);
    res.status(500).json({ error: '获取喜欢失败' });
  }
});

// 删除作品
app.delete('/api/art/:id', async (req, res) => {
  const { id } = req.params;
  const { authorName, isAdmin } = req.query;
  
  if (!authorName) {
    return res.status(400).json({ error: '缺少作者姓名参数' });
  }

  try {
    const work = await Art.findById(id);
    if (!work) {
      return res.status(404).json({ error: '作品不存在' });
    }

    // 检查权限：作者本人或管理员可以删除
    const isAuthor = work.authorName === authorName || work.author === authorName;
    const isAdminUser = isAdmin === 'true';

    if (!isAuthor && !isAdminUser) {
      return res.status(403).json({ error: '无权限删除此作品' });
    }

    await Art.findByIdAndDelete(id);
    res.json({ message: '作品已删除' });
  } catch (error) {
    console.error('删除作品失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

// 管理员删除任意作品
app.delete('/api/admin/art/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const art = await Art.findById(id);
    if (!art) return res.status(404).json({ error: '作品不存在' });

    await Art.findByIdAndDelete(id);
    res.json({ message: '作品删除成功' });
  } catch (error) {
    console.error('删除作品失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

// 获取所有反馈（管理员功能）
app.get('/api/admin/feedback', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    console.error('获取反馈失败:', error);
    res.status(500).json({ error: '获取反馈失败' });
  }
});

// 设置管理员
app.post('/api/admin/set-admin', async (req, res) => {
  const { userId, adminName } = req.body;

  if (!userId || !adminName) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    // 查找要设置为管理员的用户
    const user = await User.findOne({ name: userId });
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    user.isAdmin = true;
    await user.save();

    res.json({ message: `用户 ${userId} 已设置为管理员` });
  } catch (error) {
    console.error('设置管理员失败:', error);
    res.status(500).json({ error: '设置管理员失败' });
  }
});

// 取消管理员权限
app.post('/api/admin/remove-admin', async (req, res) => {
  const { userId, adminName } = req.body;

  if (!userId || !adminName) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    const user = await User.findOne({ name: userId });
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    user.isAdmin = false;
    await user.save();

    res.json({ message: `用户 ${userId} 的管理员权限已取消` });
  } catch (error) {
    console.error('取消管理员权限失败:', error);
    res.status(500).json({ error: '取消管理员权限失败' });
  }
});

// 活动相关API
// 获取所有活动
app.get('/api/activities', async (req, res) => {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 });
    res.json(activities);
  } catch (error) {
    console.error('获取活动失败:', error);
    res.status(500).json({ error: '获取活动失败' });
  }
});

// 创建活动（管理员功能）
app.post('/api/activities', async (req, res) => {
  const { title, description, startDate, endDate, image, authorName, authorClass, authorAvatar } = req.body;
  
  if (!title || !description || !startDate || !endDate) {
    return res.status(400).json({ error: '请填写所有必要信息' });
  }

  if (!authorName || !authorClass) {
    return res.status(400).json({ error: '请先在个人信息页面填写姓名和班级信息' });
  }
  
  try {
    const activity = await Activity.create({
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      image,
      author: authorName,
      authorName,
      authorClass,
      authorAvatar: authorAvatar || '',
      createdAt: new Date()
    });
    
    res.json(activity);
  } catch (error) {
    console.error('创建活动失败:', error);
    res.status(500).json({ error: '创建活动失败' });
  }
});

// 活动点赞
app.post('/api/activities/:id/like', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: '缺少用户ID' });
  }

  try {
    const activity = await Activity.findById(id);
    if (!activity) {
      return res.status(404).json({ error: '活动不存在' });
    }

    const isLiked = activity.likedUsers.includes(userId);
    
    if (isLiked) {
      activity.likedUsers = activity.likedUsers.filter(user => user !== userId);
      activity.likes = Math.max(0, activity.likes - 1);
    } else {
      activity.likedUsers.push(userId);
      activity.likes += 1;
    }

    await activity.save();
    res.json(activity);
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json({ error: '点赞失败' });
  }
});

// 活动收藏
app.post('/api/activities/:id/favorite', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: '缺少用户ID' });
  }

  try {
    const activity = await Activity.findById(id);
    if (!activity) {
      return res.status(404).json({ error: '活动不存在' });
    }

    const isFavorited = activity.favorites.includes(userId);
    
    if (isFavorited) {
      activity.favorites = activity.favorites.filter(user => user !== userId);
    } else {
      activity.favorites.push(userId);
    }

    await activity.save();
    res.json(activity);
  } catch (error) {
    console.error('收藏失败:', error);
    res.status(500).json({ error: '收藏失败' });
  }
});

// 活动评论
app.post('/api/activities/:id/comment', async (req, res) => {
  const { id } = req.params;
  const { content, author, authorClass, authorAvatar } = req.body;

  if (!content || !author || !authorClass) {
    return res.status(400).json({ error: '请填写评论内容和作者信息' });
  }

  try {
    const activity = await Activity.findById(id);
    if (!activity) {
      return res.status(404).json({ error: '活动不存在' });
    }

    const comment = {
      id: Date.now().toString(),
      author,
      authorClass,
      authorAvatar: authorAvatar || '',
      content: content.trim(),
      createdAt: new Date()
    };

    activity.comments.push(comment);
    await activity.save();
    res.json(activity);
  } catch (error) {
    console.error('评论失败:', error);
    res.status(500).json({ error: '评论失败' });
  }
});

// 获取我的活动（管理员）
app.get('/api/activities/my-activities', async (req, res) => {
  const { authorName } = req.query;
  
  if (!authorName) {
    return res.status(400).json({ error: '缺少作者姓名参数' });
  }

  try {
    const activities = await Activity.find({ author: authorName }).sort({ createdAt: -1 });
    res.json(activities);
  } catch (error) {
    console.error('获取我的活动失败:', error);
    res.status(500).json({ error: '获取我的活动失败' });
  }
});

// 获取活动收藏
app.get('/api/activities/favorites', async (req, res) => {
  const { authorName } = req.query;
  
  if (!authorName) {
    return res.status(400).json({ error: '缺少作者姓名参数' });
  }

  try {
    const activities = await Activity.find({ favorites: { $in: [authorName] } }).sort({ createdAt: -1 });
    res.json(activities);
  } catch (error) {
    console.error('获取活动收藏失败:', error);
    res.status(500).json({ error: '获取活动收藏失败' });
  }
});

// 获取活动喜欢
app.get('/api/activities/likes', async (req, res) => {
  const { authorName } = req.query;
  
  if (!authorName) {
    return res.status(400).json({ error: '缺少作者姓名参数' });
  }

  try {
    const activities = await Activity.find({ likedUsers: { $in: [authorName] } }).sort({ createdAt: -1 });
    res.json(activities);
  } catch (error) {
    console.error('获取活动喜欢失败:', error);
    res.status(500).json({ error: '获取活动喜欢失败' });
  }
});

// 删除活动
app.delete('/api/activities/:id', async (req, res) => {
  const { id } = req.params;
  const { authorName, isAdmin } = req.query;
  
  if (!authorName) {
    return res.status(400).json({ error: '缺少作者姓名参数' });
  }

  try {
    const activity = await Activity.findById(id);
    if (!activity) {
      return res.status(404).json({ error: '活动不存在' });
    }

    // 检查权限：作者本人或管理员可以删除
    const isAuthor = activity.author === authorName;
    const isAdminUser = isAdmin === 'true';

    if (!isAuthor && !isAdminUser) {
      return res.status(403).json({ error: '无权限删除此活动' });
    }

    await Activity.findByIdAndDelete(id);
    res.json({ message: '活动已删除' });
  } catch (error) {
    console.error('删除活动失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

// 反馈功能
app.post('/api/feedback', async (req, res) => {
  const { content, category, authorName, authorClass, authorAvatar } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: '请填写反馈内容' });
  }

  if (!authorName || !authorClass) {
    return res.status(400).json({ error: '请先在个人信息页面填写姓名和班级信息' });
  }
  
  try {
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

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 管理员相关API
// 检查管理员状态
app.get('/api/admin/check', async (req, res) => {
  const { userName } = req.query;
  
  if (!userName) {
    return res.status(400).json({ error: '缺少用户名参数' });
  }

  try {
    // 检查是否是李昌轩（固定管理员）
    if (userName === '李昌轩') {
      return res.json({ isAdmin: true, isInitial: true });
    }

    // 检查数据库中是否有该用户的管理员记录
    const user = await User.findOne({ name: userName, role: 'admin' });
    res.json({ isAdmin: !!user, isInitial: false });
  } catch (error) {
    console.error('检查管理员状态失败:', error);
    res.status(500).json({ error: '检查失败' });
  }
});

// 获取所有反馈
app.get('/api/admin/feedbacks', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    console.error('获取反馈失败:', error);
    res.status(500).json({ error: '获取反馈失败' });
  }
});

// 获取所有管理员用户
app.get('/api/admin/users', async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) {
    console.error('获取管理员失败:', error);
    res.status(500).json({ error: '获取管理员失败' });
  }
});

// 搜索用户
app.get('/api/admin/search-users', async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.json([]);
  }

  try {
    // 从艺术作品和反馈中搜索用户
    const artUsers = await Art.distinct('authorName', { 
      authorName: { $regex: q, $options: 'i' } 
    });
    const feedbackUsers = await Feedback.distinct('authorName', { 
      authorName: { $regex: q, $options: 'i' } 
    });
    
    const allUsers = [...new Set([...artUsers, ...feedbackUsers])];
    const users = allUsers.map(name => ({ name, class: '未知' }));
    
    res.json(users);
  } catch (error) {
    console.error('搜索用户失败:', error);
    res.status(500).json({ error: '搜索失败' });
  }
});

// 添加管理员
app.post('/api/admin/add-admin', async (req, res) => {
  const { userName, addedBy } = req.body;
  
  if (!userName || !addedBy) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    // 检查添加者是否有权限
    const adder = await User.findOne({ name: addedBy, role: 'admin' });
    if (!adder && addedBy !== '李昌轩') {
      return res.status(403).json({ error: '无权限添加管理员' });
    }

    // 查找或创建用户
    let user = await User.findOne({ name: userName });
    if (!user) {
      user = await User.create({
        email: `${userName}@temp.com`, // 临时邮箱
        password: 'temp', // 临时密码
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
app.post('/api/admin/remove-admin', async (req, res) => {
  const { userName, removedBy } = req.body;
  
  if (!userName || !removedBy) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
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

// 维护模式管理API
// 获取维护模式状态
app.get('/api/admin/maintenance/status', async (req, res) => {
  res.json({
    maintenanceMode,
    maintenanceMessage
  });
});

// 设置维护模式
app.post('/api/admin/maintenance/toggle', async (req, res) => {
  const { enabled, message, adminName } = req.body;
  
  // 检查管理员权限
  const admin = await User.findOne({ name: adminName, role: 'admin' });
  if (!admin && adminName !== '李昌轩') {
    return res.status(403).json({ error: '无权限操作维护模式' });
  }

  maintenanceMode = enabled;
  if (message) {
    maintenanceMessage = message;
  }

  res.json({
    message: maintenanceMode ? '维护模式已开启' : '维护模式已关闭',
    maintenanceMode,
    maintenanceMessage
  });
});

// 身份保护API
// 验证用户身份
app.post('/api/verify-identity', async (req, res) => {
  const { authorName, authorClass, userInfo } = req.body;
  
  if (!authorName || !authorClass) {
    return res.status(400).json({ error: '缺少身份信息' });
  }

  try {
    // 检查是否有相同姓名的用户（任何班级都不允许重名）
    const existingArtUsers = await Art.distinct('authorClass', { authorName });
    const existingFeedbackUsers = await Feedback.distinct('authorClass', { authorName });
    const existingDbUsers = await User.distinct('class', { name: authorName });
    
    const allClasses = [...new Set([...existingArtUsers, ...existingFeedbackUsers, ...existingDbUsers])];
    
    if (allClasses.length > 0) {
      return res.status(409).json({ 
        error: '姓名已被使用',
        message: `姓名"${authorName}"已被其他用户使用，每个姓名只能注册一个账号`,
        existingClasses: allClasses
      });
    }

    res.json({ 
      verified: true, 
      message: '身份验证通过' 
    });
  } catch (error) {
    console.error('身份验证失败:', error);
    res.status(500).json({ error: '验证失败' });
  }
});

// 举报身份冒充
app.post('/api/report-impersonation', async (req, res) => {
  const { reportedName, reportedClass, reporterName, reporterClass, reason } = req.body;
  
  if (!reportedName || !reporterName) {
    return res.status(400).json({ error: '缺少必要信息' });
  }

  try {
    // 这里可以记录举报信息到数据库
    console.log('身份冒充举报:', {
      reportedName,
      reportedClass,
      reporterName,
      reporterClass,
      reason,
      timestamp: new Date()
    });

    res.json({ 
      message: '举报已提交，我们会尽快处理' 
    });
  } catch (error) {
    console.error('举报提交失败:', error);
    res.status(500).json({ error: '举报失败' });
  }
});

// 根路径
app.get('/', (req, res) => {
  res.json({ 
    message: '艺术平台API服务运行中',
    version: '2.0.0',
    features: ['艺术作品展示', '点赞系统', '搜索功能', '反馈系统', '管理员系统']
  });
});

// 初始化默认管理员
async function initializeAdmin() {
  try {
    const adminUser = await User.findOne({ name: '李昌轩' });
    if (!adminUser) {
      await User.create({
        name: '李昌轩',
        class: 'NEE4',
        role: 'admin',
        isAdmin: true,
        createdAt: new Date()
      });
      console.log('默认管理员已创建：李昌轩');
    } else if (!adminUser.isAdmin || adminUser.role !== 'admin') {
      adminUser.isAdmin = true;
      adminUser.role = 'admin';
      await adminUser.save();
      console.log('用户李昌轩已设置为管理员');
    }
  } catch (error) {
    console.error('初始化管理员失败:', error);
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log('艺术平台服务器运行在端口', PORT);
  await initializeAdmin();
});