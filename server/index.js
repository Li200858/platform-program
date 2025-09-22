const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 数据模型
const Art = require('./models/Art');
const Activity = require('./models/Activity');
const Feedback = require('./models/Feedback');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// 确保uploads目录存在
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
}

// 文件上传配置 - 简化版本
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
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
  const { title, description, startDate, endDate, image, authorName, authorClass } = req.body;
  
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
  const { content, category, authorName, authorClass } = req.body;
  
  if (!content || !authorName || !authorClass) {
    return res.status(400).json({ error: '请填写完整信息' });
  }
  
  try {
    const feedback = await Feedback.create({
      content,
      category: category || '其他',
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
    // 查找或创建用户
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
      // 更新用户信息
      if (name) user.name = name;
      if (userClass) user.class = userClass;
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
    version: '3.0.0',
    features: ['艺术作品展示', '点赞系统', '搜索功能', '反馈系统', '管理员系统']
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

app.listen(PORT, async () => {
  console.log('艺术平台服务器运行在端口', PORT);
  await initializeAdmin();
});