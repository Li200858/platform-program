const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 立即添加健康检查端点，不依赖任何其他模块
app.get('/api/health', (req, res) => {
  const mongodbStatus = mongoose.connection.readyState;
  const mongodbStatusText = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }[mongodbStatus] || 'unknown';
  
  res.status(200).json({ 
    status: 'OK',
    message: '艺术平台API服务运行正常',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    mongodb: {
      status: mongodbStatusText,
      readyState: mongodbStatus
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT
    }
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({ 
    message: '艺术平台API服务运行中',
    status: 'OK'
  });
});

// 导入数据模型（延迟加载）
let Art, Activity, Feedback, User;
try {
  Art = require('./models/Art');
  Activity = require('./models/Activity');
  Feedback = require('./models/Feedback');
  User = require('./models/User');
} catch (error) {
  console.error('模型加载失败:', error);
}

// 导入文件上传服务
const cloudinaryService = require('./services/cloudinaryService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 动态配置文件上传存储
const isCloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

let upload;
if (isCloudinaryConfigured) {
  // 使用Cloudinary存储
  const cloudinaryService = require('./services/cloudinaryService');
  upload = cloudinaryService.upload;
} else {
  // 使用本地存储
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

  upload = multer({
    storage: localUpload,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
      cb(null, true); // 允许所有文件类型
    }
  });
}

// 静态文件服务
app.use(express.static('uploads'));

// 添加静态文件服务路由，处理URL编码的文件名
app.get('/uploads/*', (req, res) => {
  const filePath = req.path;
  const decodedPath = decodeURIComponent(filePath);
  const fs = require('fs');
  const path = require('path');
  
  console.log('请求文件路径:', filePath);
  console.log('解码后路径:', decodedPath);
  
  // 构建实际文件路径
  const actualPath = path.join(__dirname, decodedPath);
  console.log('实际文件路径:', actualPath);
  
  // 检查文件是否存在
  if (fs.existsSync(actualPath)) {
    console.log('文件存在，开始发送文件');
    // 设置正确的Content-Type
    const ext = path.extname(actualPath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain'
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.sendFile(actualPath);
  } else {
    console.log('文件不存在');
    res.status(404).json({ 
      error: '文件不存在',
      requestedPath: filePath,
      decodedPath: decodedPath,
      actualPath: actualPath
    });
  }
});

// 健康检查端点已在上面定义

// 测试端点
app.get('/api/test', (req, res) => {
  res.json({
    message: '测试端点工作正常',
    timestamp: new Date().toISOString(),
    file: 'index-test.js'
  });
});

// 根路径已在上面定义

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
    
    const fileUrls = req.files.map(file => {
      // 如果是Cloudinary，使用secure_url；如果是本地，使用filename
      return file.secure_url || `/uploads/${file.filename}`;
    });
    
    const storageType = isCloudinaryConfigured ? 'cloudinary' : 'local';
    res.json({ urls: fileUrls, storage: storageType });
  } catch (error) {
    console.error('文件上传错误:', error);
    res.status(500).json({ error: '文件上传失败' });
  }
});

// 存储配置检查API
app.get('/api/storage-config', (req, res) => {
  const isCloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
  
  const config = {
    storageType: isCloudinaryConfigured ? 'cloudinary' : 'local',
    cloudinary: {
      configured: isCloudinaryConfigured,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME
    },
    local: {
      configured: true,
      path: path.join(__dirname, 'uploads')
    }
  };
  
  res.json(config);
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

// 搜索功能
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
    const works = await Art.find({ author: authorName }).sort({ createdAt: -1 });
    res.json(works);
  } catch (error) {
    console.error('获取我的作品失败:', error);
    res.status(500).json({ error: '获取作品失败' });
  }
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

// 用户管理API
// 获取用户数据（通过用户ID）
app.get('/api/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 从User集合中查找用户
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

// 保存用户数据到云端
app.post('/api/user', async (req, res) => {
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

const PORT = process.env.PORT || 5000;

// 启动服务器
app.listen(PORT, () => {
  console.log('🚀 艺术平台服务器运行在端口', PORT);
  console.log('✅ 健康检查端点: /api/health');
  console.log('📊 环境信息:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- PORT:', PORT);
  console.log('- MONGODB_URI:', process.env.MONGODB_URI ? '已设置' : '未设置');
  
  // 连接MongoDB
  if (process.env.MONGODB_URI) {
    console.log('🔗 正在连接MongoDB...');
    mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10秒超时
      socketTimeoutMS: 45000, // 45秒超时
    })
    .then(() => {
      console.log('✅ MongoDB连接成功');
      console.log('📊 数据库状态:', mongoose.connection.readyState);
    })
    .catch(err => {
      console.error('❌ MongoDB连接失败:', err.message);
      console.log('⚠️  服务器将继续运行，但数据库功能可能不可用');
      console.log('💡 请检查MONGODB_URI环境变量是否正确设置');
    });
  } else {
    console.log('⚠️  未设置MONGODB_URI环境变量，使用本地数据库');
    mongoose.connect('mongodb://localhost:27017/platform-program')
      .then(() => console.log('✅ 本地MongoDB连接成功'))
      .catch(err => {
        console.error('❌ 本地MongoDB连接失败:', err.message);
        console.log('⚠️  服务器将继续运行，但数据库功能可能不可用');
      });
  }
});
