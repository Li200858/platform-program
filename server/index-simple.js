const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// 导入数据模型
const Art = require('./models/Art');
const Activity = require('./models/Activity');
const Feedback = require('./models/Feedback');
const User = require('./models/User');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 导入文件上传服务
const cloudinaryService = require('./services/cloudinaryService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置本地文件上传
const localUpload = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${cleanName}`);
  }
});

const upload = multer({
  storage: localUpload,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    cb(null, true); // 允许所有文件类型
  }
});

// 静态文件服务
app.use(express.static('uploads'));

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    message: '艺术平台API服务运行正常',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({ 
    message: '艺术平台API服务运行中',
    version: '2.0.0',
    status: 'OK'
  });
});

// 基础API端点
// 获取艺术作品
app.get('/api/art', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('获取艺术作品失败:', error);
    res.status(500).json({ error: '获取作品失败' });
  }
});

// 发布艺术作品
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

// 点赞/取消点赞
app.post('/api/art/:id/like', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  
  try {
    const art = await Art.findById(id);
    if (!art) return res.status(404).json({ error: '作品不存在' });
    
    if (!art.likedUsers) art.likedUsers = [];
    const idx = art.likedUsers.indexOf(userId);
    
    if (idx !== -1) {
      art.likedUsers.splice(idx, 1);
      art.likes = Math.max((art.likes || 1) - 1, 0);
    } else {
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

// 文件上传API
app.post('/api/upload', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '没有上传文件' });
    }
    
    const fileUrls = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ urls: fileUrls, storage: 'local' });
  } catch (error) {
    console.error('文件上传错误:', error);
    res.status(500).json({ error: '文件上传失败' });
  }
});

// 存储配置检查API
app.get('/api/storage-config', (req, res) => {
  const config = {
    storageType: 'local',
    cloudinary: {
      configured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
      cloudName: process.env.CLOUDINARY_CLOUD_NAME
    },
    local: {
      configured: true,
      path: path.join(__dirname, 'uploads')
    }
  };
  
  res.json(config);
});

// 连接MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/platform-program')
  .then(() => console.log('MongoDB连接成功'))
  .catch(err => console.error('MongoDB连接失败:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('艺术平台服务器运行在端口', PORT);
});
