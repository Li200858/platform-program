const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FileBackup = require('./backup');

// 数据模型
const Art = require('./models/Art');
const Activity = require('./models/Activity');
const Feedback = require('./models/Feedback');
const User = require('./models/User');
const Maintenance = require('./models/Maintenance');
const Notification = require('./models/Notification');
const Team = require('./models/Team');

const app = express();
const PORT = process.env.PORT || 5000;

// 确保端口正确
console.log(`环境变量 PORT: ${process.env.PORT}`);
console.log(`使用端口: ${PORT}`);

// 中间件
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://platform-program-frontend.onrender.com',
    'https://platform-program.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));
app.use(express.json());

// 额外的CORS处理
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
// 配置静态文件服务 - 支持持久化存储
const uploadsDir = process.env.NODE_ENV === 'production' ? '/opt/render/project/src/uploads' : 'uploads';
app.use('/uploads', express.static(uploadsDir));

// 确保uploads目录存在
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 文件上传配置 - 支持持久化存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 在Render上使用持久化存储目录
    const uploadDir = process.env.NODE_ENV === 'production' ? '/opt/render/project/src/uploads' : 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    cb(null, true); // 允许所有文件类型
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

// 艺术作品API
app.post('/api/art', async (req, res) => {
  const { tab, title, content, media, authorName, authorClass } = req.body;
  
  if (!tab || !title || !content || !authorName || !authorClass) {
    return res.status(400).json({ error: '请填写完整信息' });
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
      likedUsers: [],
      favorites: []
    });
    
    res.json(post);
  } catch (error) {
    console.error('发布失败:', error);
    res.status(500).json({ error: '发布失败' });
  }
});

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

// 点赞功能
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

// 收藏功能
app.post('/api/art/:id/favorite', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  
  try {
    const art = await Art.findById(id);
    if (!art) return res.status(404).json({ error: '作品不存在' });
    
    if (!art.favorites) art.favorites = [];
    const idx = art.favorites.indexOf(userId);
    
    if (idx !== -1) {
      art.favorites.splice(idx, 1);
    } else {
      art.favorites.push(userId);
    }
    
    await art.save();
    res.json(art);
  } catch (error) {
    console.error('收藏失败:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

// 评论功能
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
  
  try {
    const art = await Art.findById(artId);
    if (!art) return res.status(404).json({ error: '作品不存在' });
    
    const commentIndex = art.comments.findIndex(comment => comment.id === commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ error: '评论不存在' });
    }
    
    const comment = art.comments[commentIndex];
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

// 邀请合作用户
app.post('/api/art/:id/collaborate', async (req, res) => {
  const { id } = req.params;
  const { username, name, class: userClass, invitedBy } = req.body;
  
  if (!username || !name || !userClass || !invitedBy) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    const art = await Art.findById(id);
    if (!art) {
      return res.status(404).json({ error: '作品不存在' });
    }

    // 检查权限：只有作品作者可以邀请合作用户
    if (art.authorName !== invitedBy) {
      return res.status(403).json({ error: '只有作品作者可以邀请合作用户' });
    }

    // 检查是否已经是合作用户
    const isCollaborator = art.collaborators.some(collab => collab.username === username);
    if (isCollaborator) {
      return res.status(400).json({ error: '该用户已经是合作用户' });
    }

    // 检查是否邀请自己
    if (username === art.authorName) {
      return res.status(400).json({ error: '不能邀请自己作为合作用户' });
    }

    // 添加合作用户
    art.collaborators.push({
      username,
      name,
      class: userClass,
      joinedAt: new Date()
    });

    await art.save();

    // 通知被邀请的用户
    await Notification.create({
      recipient: username,
      sender: invitedBy,
      type: 'team_invite',
      content: `${invitedBy} 邀请您参与作品 "${art.title}" 的创作`,
      relatedId: art._id,
      relatedType: 'art'
    });

    res.json({ message: '邀请已发送', art });
  } catch (error) {
    console.error('邀请合作用户失败:', error);
    res.status(500).json({ error: '邀请合作用户失败' });
  }
});

// 移除合作用户
app.delete('/api/art/:id/collaborate/:username', async (req, res) => {
  const { id, username } = req.params;
  const { removedBy } = req.body;
  
  if (!removedBy) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    const art = await Art.findById(id);
    if (!art) {
      return res.status(404).json({ error: '作品不存在' });
    }

    // 检查权限：只有作品作者可以移除合作用户
    if (art.authorName !== removedBy) {
      return res.status(403).json({ error: '只有作品作者可以移除合作用户' });
    }

    // 移除合作用户
    art.collaborators = art.collaborators.filter(collab => collab.username !== username);
    await art.save();

    res.json({ message: '合作用户已移除', art });
  } catch (error) {
    console.error('移除合作用户失败:', error);
    res.status(500).json({ error: '移除合作用户失败' });
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

// 获取我的收藏
app.get('/api/art/favorites', async (req, res) => {
  const { authorName } = req.query;
  
  if (!authorName) {
    return res.status(400).json({ error: '缺少作者姓名参数' });
  }

  try {
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
  
  try {
    const work = await Art.findById(id);
    if (!work) {
      return res.status(404).json({ error: '作品不存在' });
    }

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

// 活动相关API
app.get('/api/activities', async (req, res) => {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 });
    res.json(activities);
  } catch (error) {
    console.error('获取活动失败:', error);
    res.status(500).json({ error: '获取活动失败' });
  }
});

app.post('/api/activities', async (req, res) => {
  const { title, description, startDate, endDate, image, authorName, authorClass, media } = req.body;
  
  if (!title || !description || !startDate || !endDate || !authorName || !authorClass) {
    return res.status(400).json({ error: '请填写所有必要信息' });
  }
  
  try {
    const activity = await Activity.create({
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      image,
      media: media || [],
      author: authorName,
      authorName,
      authorClass,
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
  const { content, author, authorClass } = req.body;

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

// 反馈功能
app.post('/api/feedback', async (req, res) => {
  const { content, authorName, authorClass, media } = req.body;
  
  if (!content || !authorName || !authorClass) {
    return res.status(400).json({ error: '请填写完整信息' });
  }
  
  try {
    const feedback = await Feedback.create({
      content,
      media: media || [],
      author: authorName,
      authorName,
      authorClass,
      createdAt: new Date()
    });
    
    res.json(feedback);
  } catch (error) {
    console.error('反馈提交失败:', error);
    res.status(500).json({ error: '反馈提交失败' });
  }
});

// 管理员相关API
app.get('/api/admin/check', async (req, res) => {
  const { userName } = req.query;
  
  if (!userName) {
    return res.status(400).json({ error: '缺少用户名参数' });
  }

  try {
    // 检查是否是固定管理员
    if (userName === '测试员' || userName === '李昌轩') {
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
app.get('/api/admin/feedback', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    console.error('获取反馈失败:', error);
    res.status(500).json({ error: '获取反馈失败' });
  }
});

// 获取单个反馈详情
app.get('/api/admin/feedback/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: '反馈不存在' });
    }
    res.json(feedback);
  } catch (error) {
    console.error('获取反馈详情失败:', error);
    res.status(500).json({ error: '获取反馈详情失败' });
  }
});

// 管理员回复反馈
app.post('/api/admin/feedback/:id/reply', async (req, res) => {
  try {
    const { content, adminName, adminClass } = req.body;
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({ error: '反馈不存在' });
    }

    const conversationId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    feedback.conversations.push({
      id: conversationId,
      author: adminName,
      authorName: adminName,
      authorClass: adminClass,
      content: content,
      isAdmin: true,
      createdAt: new Date()
    });

    await feedback.save();
    res.json(feedback);
  } catch (error) {
    console.error('回复反馈失败:', error);
    res.status(500).json({ error: '回复反馈失败' });
  }
});

// 标记反馈为已收到
app.post('/api/admin/feedback/:id/received', async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({ error: '反馈不存在' });
    }

    feedback.status = 'received';
    await feedback.save();
    res.json(feedback);
  } catch (error) {
    console.error('标记反馈失败:', error);
    res.status(500).json({ error: '标记反馈失败' });
  }
});

// 用户回复反馈
app.post('/api/feedback/:id/reply', async (req, res) => {
  try {
    const { content, authorName, authorClass, authorAvatar } = req.body;
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({ error: '反馈不存在' });
    }

    const conversationId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    feedback.conversations.push({
      id: conversationId,
      author: authorName,
      authorName: authorName,
      authorClass: authorClass,
      authorAvatar: authorAvatar || '',
      content: content,
      isAdmin: false,
      createdAt: new Date()
    });

    await feedback.save();
    res.json(feedback);
  } catch (error) {
    console.error('回复反馈失败:', error);
    res.status(500).json({ error: '回复反馈失败' });
  }
});

// 获取用户的反馈
app.get('/api/feedback/my', async (req, res) => {
  try {
    const { authorName } = req.query;
    if (!authorName) {
      return res.status(400).json({ error: '缺少作者名称' });
    }

    const feedbacks = await Feedback.find({ authorName }).sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    console.error('获取用户反馈失败:', error);
    res.status(500).json({ error: '获取用户反馈失败' });
  }
});

// 删除活动
app.delete('/api/activities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { authorName, isAdmin } = req.query;

    const activity = await Activity.findById(id);
    if (!activity) {
      return res.status(404).json({ error: '活动不存在' });
    }

    // 检查权限：只有作者本人或管理员可以删除
    if (activity.authorName !== authorName && !isAdmin) {
      return res.status(403).json({ error: '没有权限删除此活动' });
    }

    await Activity.findByIdAndDelete(id);
    res.json({ message: '活动删除成功' });
  } catch (error) {
    console.error('删除活动失败:', error);
    res.status(500).json({ error: '删除活动失败' });
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
  
  if (!q || q.trim() === '') {
    return res.json([]);
  }

  try {
    // 从User集合中搜索用户
    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { class: { $regex: q, $options: 'i' } }
      ]
    }).select('name class userID role isAdmin createdAt').limit(20);

    // 如果User集合中没有找到，则从Art和Feedback中搜索
    if (users.length === 0) {
      const artUsers = await Art.distinct('authorName', { 
        authorName: { $regex: q, $options: 'i' } 
      });
      const feedbackUsers = await Feedback.distinct('authorName', { 
        authorName: { $regex: q, $options: 'i' } 
      });
      
      const allUsers = [...new Set([...artUsers, ...feedbackUsers])];
      const fallbackUsers = allUsers.map(name => ({ 
        name, 
        class: '未知班级',
        userID: 'unknown',
        role: 'user',
        isAdmin: false
      }));
      
      return res.json(fallbackUsers);
    }
    
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
    if (addedBy !== '测试员' && addedBy !== '李昌轩') {
      const adder = await User.findOne({ name: addedBy, role: 'admin' });
      if (!adder) {
        return res.status(403).json({ error: '无权限添加管理员' });
      }
    }

    // 查找或创建用户
    let user = await User.findOne({ name: userName });
    if (!user) {
      user = await User.create({
        name: userName,
        class: '测试班级',
        role: 'admin',
        isAdmin: true
      });
    } else {
      user.role = 'admin';
      user.isAdmin = true;
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
    if (removedBy !== '测试员' && removedBy !== '李昌轩') {
      const remover = await User.findOne({ name: removedBy, role: 'admin' });
      if (!remover) {
        return res.status(403).json({ error: '无权限移除管理员' });
      }
    }

    // 不能移除自己
    if (userName === removedBy) {
      return res.status(400).json({ error: '不能移除自己的管理员权限' });
    }

    const user = await User.findOne({ name: userName });
    if (user) {
      user.role = 'user';
      user.isAdmin = false;
      await user.save();
    }

    res.json({ message: '管理员移除成功' });
  } catch (error) {
    console.error('移除管理员失败:', error);
    res.status(500).json({ error: '移除失败' });
  }
});

// 用户ID同步API
app.post('/api/user/sync', async (req, res) => {
  const { userID, name, class: userClass, avatar } = req.body;
  
  if (!userID) {
    return res.status(400).json({ error: '缺少用户ID' });
  }

  try {
    // 查找用户（根据userID）
    let user = await User.findOne({ userID });
    
    if (!user) {
      // 如果没有找到用户，创建新用户
      user = await User.create({
        userID,
        name: name || '用户',
        class: userClass || '未知班级',
        avatar: avatar || '',
        role: 'user',
        isAdmin: false
      });
    } else {
      // 如果找到用户，更新用户信息（保持绑定关系）
      // 姓名一旦设置就不能更改，只能更新班级和头像
      if (userClass && userClass !== '未知班级') user.class = userClass;
      if (avatar) user.avatar = avatar;
      await user.save();
    }
    
    res.json({ 
      success: true, 
      user: {
        name: user.name,
        class: user.class,
        avatar: user.avatar,
        role: user.role,
        isAdmin: user.isAdmin,
        userID: user.userID
      }
    });
  } catch (error) {
    console.error('用户同步失败:', error);
    res.status(500).json({ error: '用户同步失败' });
  }
});

// 根据用户ID获取用户信息
app.get('/api/user/:userID', async (req, res) => {
  const { userID } = req.params;
  
  try {
    const user = await User.findOne({ userID });
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({
      name: user.name,
      class: user.class,
      avatar: user.avatar,
      role: user.role,
      isAdmin: user.isAdmin,
      userID: user.userID
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  console.log('健康检查请求');
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT,
    nodeEnv: process.env.NODE_ENV
  });
});

// 根路径
app.get('/', (req, res) => {
  console.log('根路径请求');
  res.json({ 
    message: '校园艺术平台API服务运行中',
    timestamp: new Date().toISOString(),
    port: PORT,
    nodeEnv: process.env.NODE_ENV
  });
});


// 初始化默认管理员
async function initializeAdmin() {
  try {
    const adminUser = await User.findOne({ name: '测试员' });
    if (!adminUser) {
      await User.create({
        name: '测试员',
        class: '测试班级',
        role: 'admin',
        isAdmin: true,
        createdAt: new Date()
      });
      console.log('默认管理员已创建：测试员');
    } else if (!adminUser.isAdmin || adminUser.role !== 'admin') {
      adminUser.isAdmin = true;
      adminUser.role = 'admin';
      await adminUser.save();
      console.log('用户测试员已设置为管理员');
    }
  } catch (error) {
    console.error('初始化管理员失败:', error);
  }
}

// 维护模式相关API
// 获取维护模式状态
app.get('/api/maintenance/status', async (req, res) => {
  try {
    let maintenance = await Maintenance.findOne();
    if (!maintenance) {
      // 如果没有维护记录，创建一个默认的
      maintenance = await Maintenance.create({
        isEnabled: false,
        message: '网站正在维护中，暂时无法发布作品和评论，请稍后再试。'
      });
    }
    res.json({
      isEnabled: maintenance.isEnabled,
      message: maintenance.message,
      enabledBy: maintenance.enabledBy,
      enabledAt: maintenance.enabledAt,
      disabledAt: maintenance.disabledAt
    });
  } catch (error) {
    console.error('获取维护状态失败:', error);
    res.status(500).json({ error: '获取维护状态失败' });
  }
});

// 开启维护模式（仅管理员）
app.post('/api/admin/maintenance/enable', async (req, res) => {
  try {
    const { message, adminName } = req.body;
    
    let maintenance = await Maintenance.findOne();
    if (!maintenance) {
      maintenance = await Maintenance.create({
        isEnabled: true,
        message: message || '网站正在维护中，暂时无法发布作品和评论，请稍后再试。',
        enabledBy: adminName || '管理员',
        enabledAt: new Date()
      });
    } else {
      maintenance.isEnabled = true;
      maintenance.message = message || maintenance.message;
      maintenance.enabledBy = adminName || maintenance.enabledBy;
      maintenance.enabledAt = new Date();
      maintenance.updatedAt = new Date();
      await maintenance.save();
    }
    
    res.json({ 
      success: true, 
      message: '维护模式已开启',
      maintenance: {
        isEnabled: maintenance.isEnabled,
        message: maintenance.message,
        enabledBy: maintenance.enabledBy,
        enabledAt: maintenance.enabledAt
      }
    });
  } catch (error) {
    console.error('开启维护模式失败:', error);
    res.status(500).json({ error: '开启维护模式失败' });
  }
});

// 关闭维护模式（仅管理员）
app.post('/api/admin/maintenance/disable', async (req, res) => {
  try {
    let maintenance = await Maintenance.findOne();
    if (!maintenance) {
      return res.json({ success: true, message: '维护模式未开启' });
    }
    
    maintenance.isEnabled = false;
    maintenance.disabledAt = new Date();
    maintenance.updatedAt = new Date();
    await maintenance.save();
    
    res.json({ 
      success: true, 
      message: '维护模式已关闭',
      maintenance: {
        isEnabled: maintenance.isEnabled,
        disabledAt: maintenance.disabledAt
      }
    });
  } catch (error) {
    console.error('关闭维护模式失败:', error);
    res.status(500).json({ error: '关闭维护模式失败' });
  }
});

// 文件备份管理API
app.get('/api/admin/backups', (req, res) => {
  try {
    const backup = new FileBackup();
    const backups = backup.listBackups();
    res.json({ backups });
  } catch (error) {
    console.error('获取备份列表失败:', error);
    res.status(500).json({ error: '获取备份列表失败' });
  }
});

app.post('/api/admin/backup/create', async (req, res) => {
  try {
    const backup = new FileBackup();
    const backupFile = await backup.createBackup();
    res.json({ message: '备份创建成功', backupFile });
  } catch (error) {
    console.error('创建备份失败:', error);
    res.status(500).json({ error: '创建备份失败' });
  }
});

app.post('/api/admin/backup/restore', async (req, res) => {
  try {
    const { backupFile } = req.body;
    if (!backupFile) {
      return res.status(400).json({ error: '请指定备份文件' });
    }
    
    const backup = new FileBackup();
    await backup.restoreBackup(backupFile);
    res.json({ message: '备份恢复成功' });
  } catch (error) {
    console.error('恢复备份失败:', error);
    res.status(500).json({ error: '恢复备份失败' });
  }
});

app.listen(PORT, async () => {
  console.log('艺术平台服务器运行在端口', PORT);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`MongoDB连接成功`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
  console.log(`根路径: http://localhost:${PORT}/`);
  
  // 初始化管理员
  await initializeAdmin();
  
  // 初始化文件备份系统
  const backup = new FileBackup();
  try {
    // 尝试恢复最新的备份
    const backups = backup.listBackups();
    if (backups.length > 0) {
      const latestBackup = path.join(backup.backupDir, backups[0]);
      console.log('发现备份文件，尝试恢复:', latestBackup);
      await backup.restoreBackup(latestBackup);
      console.log('文件备份恢复成功');
    }
    
    // 清理旧备份
    backup.cleanupOldBackups();
    
    // 创建新的备份
    await backup.createBackup();
    console.log('文件备份系统初始化完成');
  } catch (error) {
    console.log('文件备份系统初始化失败，但不影响服务运行:', error.message);
  }
});

// ==================== 用户互动功能 API ====================



// 创建通知
app.post('/api/notifications', async (req, res) => {
  const { recipient, sender, type, content, relatedId, relatedType } = req.body;
  
  try {
    const notification = new Notification({
      recipient,
      sender,
      type,
      content,
      relatedId,
      relatedType,
      isRead: false,
      createdAt: new Date()
    });
    
    await notification.save();
    res.json(notification);
  } catch (error) {
    console.error('创建通知失败:', error);
    res.status(500).json({ error: '创建通知失败' });
  }
});

// 获取通知列表
app.get('/api/notifications/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const notifications = await Notification.find({ recipient: username })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    console.error('获取通知失败:', error);
    res.status(500).json({ error: '获取通知失败' });
  }
});

// 标记通知为已读
app.put('/api/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  
  try {
    await Notification.findByIdAndUpdate(id, { 
      isRead: true, 
      readAt: new Date() 
    });
    res.json({ message: '通知已标记为已读' });
  } catch (error) {
    console.error('标记通知失败:', error);
    res.status(500).json({ error: '标记通知失败' });
  }
});

// 标记所有通知为已读
app.put('/api/notifications/:username/read-all', async (req, res) => {
  const { username } = req.params;
  
  try {
    await Notification.updateMany(
      { recipient: username, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.json({ message: '所有通知已标记为已读' });
  } catch (error) {
    console.error('标记所有通知失败:', error);
    res.status(500).json({ error: '标记所有通知失败' });
  }
});

// ==================== 团队协作功能 API ====================

// 创建团队
app.post('/api/teams', async (req, res) => {
  const { name, description, creator } = req.body;
  
  if (!name || !creator) {
    return res.status(400).json({ error: '请填写团队名称和创建者信息' });
  }

  try {
    const team = await Team.create({
      name,
      description: description || '',
      creator,
      members: [{
        username: creator,
        role: 'owner'
      }],
      createdAt: new Date()
    });

    res.json(team);
  } catch (error) {
    console.error('创建团队失败:', error);
    res.status(500).json({ error: '创建团队失败' });
  }
});

// 获取用户参与的团队
app.get('/api/teams/user/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const teams = await Team.find({
      'members.username': username
    }).sort({ updatedAt: -1 });
    
    res.json(teams);
  } catch (error) {
    console.error('获取团队列表失败:', error);
    res.status(500).json({ error: '获取团队列表失败' });
  }
});

// 获取团队详情
app.get('/api/teams/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ error: '团队不存在' });
    }
    res.json(team);
  } catch (error) {
    console.error('获取团队详情失败:', error);
    res.status(500).json({ error: '获取团队详情失败' });
  }
});

// 邀请用户加入团队
app.post('/api/teams/:id/invite', async (req, res) => {
  const { id } = req.params;
  const { inviter, invitee, role = 'member' } = req.body;
  
  try {
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ error: '团队不存在' });
    }

    // 检查邀请者权限
    const inviterMember = team.members.find(m => m.username === inviter);
    if (!inviterMember || !['owner', 'admin'].includes(inviterMember.role)) {
      return res.status(403).json({ error: '无权限邀请用户' });
    }

    // 检查用户是否已在团队中
    if (team.members.some(m => m.username === invitee)) {
      return res.status(400).json({ error: '用户已在团队中' });
    }

    // 添加成员
    team.members.push({
      username: invitee,
      role,
      joinedAt: new Date()
    });
    
    await team.save();

    // 创建通知
    await Notification.create({
      recipient: invitee,
      sender: inviter,
      type: 'team_invite',
      content: `${inviter} 邀请你加入团队 "${team.name}"`,
      relatedId: team._id,
      relatedType: 'team'
    });

    res.json(team);
  } catch (error) {
    console.error('邀请用户失败:', error);
    res.status(500).json({ error: '邀请用户失败' });
  }
});

// 创建团队项目
app.post('/api/teams/:id/projects', async (req, res) => {
  const { id } = req.params;
  const { title, description, type, content, media, creator } = req.body;
  
  try {
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ error: '团队不存在' });
    }

    // 检查用户权限
    const member = team.members.find(m => m.username === creator);
    if (!member) {
      return res.status(403).json({ error: '无权限创建项目' });
    }

    const project = {
      title,
      description: description || '',
      type,
      content: content || '',
      media: media || [],
      contributors: [creator],
      versions: [{
        version: '1.0',
        content: content || '',
        media: media || [],
        author: creator,
        message: '初始版本',
        createdAt: new Date()
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    team.projects.push(project);
    await team.save();

    res.json(team);
  } catch (error) {
    console.error('创建项目失败:', error);
    res.status(500).json({ error: '创建项目失败' });
  }
});

// 更新团队项目
app.put('/api/teams/:id/projects/:projectId', async (req, res) => {
  const { id, projectId } = req.params;
  const { content, media, author, message, version } = req.body;
  
  try {
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ error: '团队不存在' });
    }

    const project = team.projects.id(projectId);
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }

    // 检查用户权限
    const member = team.members.find(m => m.username === author);
    if (!member) {
      return res.status(403).json({ error: '无权限修改项目' });
    }

    // 添加新版本
    const newVersion = {
      version: version || `v${project.versions.length + 1}`,
      content,
      media: media || [],
      author,
      message: message || '更新内容',
      createdAt: new Date()
    };

    project.versions.push(newVersion);
    project.content = content;
    project.media = media || [];
    project.updatedAt = new Date();

    if (!project.contributors.includes(author)) {
      project.contributors.push(author);
    }

    await team.save();

    // 通知团队成员
    for (const member of team.members) {
      if (member.username !== author) {
        await Notification.create({
          recipient: member.username,
          sender: author,
          type: 'team_update',
          content: `${author} 更新了项目 "${project.title}"`,
          relatedId: project._id,
          relatedType: 'team'
        });
      }
    }

    res.json(team);
  } catch (error) {
    console.error('更新项目失败:', error);
    res.status(500).json({ error: '更新项目失败' });
  }
});

// 申请加入团队
app.post('/api/teams/:id/join', async (req, res) => {
  const { id } = req.params;
  const { username, requestedBy, message } = req.body;
  
  if (!username || !requestedBy) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ error: '团队不存在' });
    }

    // 检查是否已经是成员
    const isMember = team.members.some(member => member.username === username);
    if (isMember) {
      return res.status(400).json({ error: '您已经是团队成员' });
    }

    // 检查是否已经有待处理的申请
    const existingRequest = team.joinRequests.find(req => 
      req.username === username && req.status === 'pending'
    );
    if (existingRequest) {
      return res.status(400).json({ error: '您已经提交过加入申请，请等待审核' });
    }

    // 添加加入申请
    team.joinRequests.push({
      username,
      requestedBy,
      message: message || '',
      status: 'pending'
    });

    await team.save();

    // 通知团队创建者
    await Notification.create({
      recipient: team.creator,
      sender: username,
      type: 'team_invite',
      content: `${username} 申请加入团队 "${team.name}"`,
      relatedId: team._id,
      relatedType: 'team'
    });

    res.json({ message: '加入申请已提交，等待团队创建者审核' });
  } catch (error) {
    console.error('申请加入团队失败:', error);
    res.status(500).json({ error: '申请加入团队失败' });
  }
});

// 处理加入申请
app.put('/api/teams/:id/join-requests/:requestId', async (req, res) => {
  const { id, requestId } = req.params;
  const { action, processedBy } = req.body; // action: 'approve' or 'reject'
  
  if (!action || !processedBy) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ error: '团队不存在' });
    }

    // 检查处理者是否有权限
    const isOwner = team.creator === processedBy;
    const isAdmin = team.members.some(member => 
      member.username === processedBy && member.role === 'admin'
    );
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: '无权限处理加入申请' });
    }

    const request = team.joinRequests.id(requestId);
    if (!request) {
      return res.status(404).json({ error: '申请不存在' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: '申请已被处理' });
    }

    if (action === 'approve') {
      // 批准申请，添加为成员
      team.members.push({
        username: request.username,
        role: 'member',
        joinedAt: new Date()
      });

      // 通知申请人
      await Notification.create({
        recipient: request.username,
        sender: processedBy,
        type: 'team_invite',
        content: `您的加入团队 "${team.name}" 的申请已通过`,
        relatedId: team._id,
        relatedType: 'team'
      });
    } else if (action === 'reject') {
      // 拒绝申请
      await Notification.create({
        recipient: request.username,
        sender: processedBy,
        type: 'team_invite',
        content: `您的加入团队 "${team.name}" 的申请被拒绝`,
        relatedId: team._id,
        relatedType: 'team'
      });
    }

    // 更新申请状态
    request.status = action === 'approve' ? 'approved' : 'rejected';
    request.processedAt = new Date();
    request.processedBy = processedBy;

    await team.save();
    res.json({ message: `申请已${action === 'approve' ? '批准' : '拒绝'}` });
  } catch (error) {
    console.error('处理加入申请失败:', error);
    res.status(500).json({ error: '处理加入申请失败' });
  }
});

// 解散团队
app.delete('/api/teams/:id', async (req, res) => {
  const { id } = req.params;
  const { deletedBy } = req.body;
  
  if (!deletedBy) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ error: '团队不存在' });
    }

    // 检查是否有权限解散团队
    if (team.creator !== deletedBy) {
      return res.status(403).json({ error: '只有团队创建者可以解散团队' });
    }

    // 通知所有成员团队已解散
    for (const member of team.members) {
      if (member.username !== deletedBy) {
        await Notification.create({
          recipient: member.username,
          sender: deletedBy,
          type: 'team_update',
          content: `团队 "${team.name}" 已被解散`,
          relatedId: team._id,
          relatedType: 'team'
        });
      }
    }

    await Team.findByIdAndDelete(id);
    res.json({ message: '团队已解散' });
  } catch (error) {
    console.error('解散团队失败:', error);
    res.status(500).json({ error: '解散团队失败' });
  }
});

// ==================== 改进搜索功能 API ====================

// 全局搜索（支持艺术作品和活动）
app.get('/api/search', async (req, res) => {
  const { q, type = 'all', limit = 20 } = req.query;
  
  if (!q || q.trim() === '') {
    return res.json({ arts: [], activities: [], users: [] });
  }

  try {
    const searchQuery = { $regex: q, $options: 'i' };
    const results = { arts: [], activities: [], users: [] };

    // 搜索艺术作品
    if (type === 'all' || type === 'art') {
      const arts = await Art.find({
        $or: [
          { title: searchQuery },
          { content: searchQuery },
          { authorName: searchQuery },
          { authorClass: searchQuery }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
      results.arts = arts;
    }

    // 搜索活动
    if (type === 'all' || type === 'activity') {
      const activities = await Activity.find({
        $or: [
          { title: searchQuery },
          { description: searchQuery },
          { authorName: searchQuery },
          { authorClass: searchQuery }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
      results.activities = activities;
    }

    // 搜索用户
    if (type === 'all' || type === 'user') {
      // 从User集合中搜索用户
      const users = await User.find({
        $or: [
          { name: searchQuery },
          { class: searchQuery }
        ]
      }).select('name class userID role isAdmin createdAt').limit(parseInt(limit));

      // 如果User集合中没有找到，则从Art和Feedback中搜索
      if (users.length === 0) {
        const artUsers = await Art.distinct('authorName', { 
          authorName: searchQuery 
        });
        const feedbackUsers = await Feedback.distinct('authorName', { 
          authorName: searchQuery 
        });
        
        const allUsers = [...new Set([...artUsers, ...feedbackUsers])];
        const fallbackUsers = allUsers.map(name => ({ 
          name, 
          class: '未知班级',
          userID: 'unknown',
          role: 'user',
          isAdmin: false
        }));
        
        results.users = fallbackUsers;
      } else {
        results.users = users;
      }
    }

    // 搜索团队
    if (type === 'all' || type === 'team') {
      const teams = await Team.find({
        $or: [
          { name: searchQuery },
          { description: searchQuery },
          { creator: searchQuery }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
      results.teams = teams;
    }

    res.json(results);
  } catch (error) {
    console.error('搜索失败:', error);
    res.status(500).json({ error: '搜索失败' });
  }
});

// 获取用户列表（用于@提及功能）
app.get('/api/users/search', async (req, res) => {
  const { q } = req.query;
  
  if (!q || q.trim() === '') {
    return res.json([]);
  }

  try {
    const users = await User.find({
      name: { $regex: q, $options: 'i' }
    })
    .select('name class')
    .limit(10);
    
    res.json(users);
  } catch (error) {
    console.error('搜索用户失败:', error);
    res.status(500).json({ error: '搜索用户失败' });
  }
});