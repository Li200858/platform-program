const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Art = require('./models/Art');
const PendingContent = require('./models/PendingContent');
require('dotenv').config();

const Feedback = require('./models/Feedback');
const app = express();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/platform-program', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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
  
  if (!tab || !title || !content || !authorName || !authorClass) {
    return res.status(400).json({ error: '请填写完整信息：分类、标题、内容、姓名和班级' });
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

// 评分
app.post('/api/art/:id/rate', async (req, res) => {
  const { id } = req.params;
  const { userId, rating } = req.body;
  
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: '评分必须在1-5之间' });
  }
  
  try {
    const art = await Art.findById(id);
    if (!art) return res.status(404).json({ error: '作品不存在' });
    
    if (!art.ratedUsers) art.ratedUsers = [];
    if (!art.rating) art.rating = { total: 0, count: 0, average: 0 };
    
    const existingRatingIndex = art.ratedUsers.indexOf(userId);
    
    if (existingRatingIndex !== -1) {
      // 用户已评分，更新评分
      const oldRating = art.rating.total / art.rating.count;
      art.rating.total = art.rating.total - oldRating + rating;
      art.rating.average = art.rating.total / art.rating.count;
    } else {
      // 新评分
      art.ratedUsers.push(userId);
      art.rating.total += rating;
      art.rating.count += 1;
      art.rating.average = art.rating.total / art.rating.count;
    }
    
    await art.save();
    res.json(art);
  } catch (error) {
    console.error('评分失败:', error);
    res.status(500).json({ error: '评分失败' });
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

// 反馈功能
app.post('/api/feedback', async (req, res) => {
  const { content, contact } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: '请填写反馈内容' });
  }
  
  try {
    const feedback = await Feedback.create({
      content,
      contact: contact || '匿名',
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

// 根路径
app.get('/', (req, res) => {
  res.json({ 
    message: '艺术平台API服务运行中',
    version: '2.0.0',
    features: ['艺术作品展示', '点赞系统', '搜索功能', '反馈系统']
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('艺术平台服务器运行在端口', PORT);
});