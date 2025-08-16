const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const CrossCampus = require('./models/CrossCampus');
const Study = require('./models/Study');
const Art = require('./models/Art');
const Activity = require('./models/Activity');
const PendingContent = require('./models/PendingContent');
require('dotenv').config();

const User = require('./models/User');
const Feedback = require('./models/Feedback');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cloudinary 配置（可选）
// const cloudinary = require('cloudinary').v2;
// if (process.env.CLOUDINARY_CLOUD_NAME) {
//   cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET
//   });
// }

// 认证中间件
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: '无效的认证令牌' });
  }
};

// 权限检查中间件
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);
      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ error: '权限不足' });
      }
      req.user = user;
      next();
    } catch (error) {
      res.status(500).json({ error: '权限验证失败' });
    }
  };
};

app.use(cors());
app.use(express.json());

// 确保 uploads 目录存在
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
  }
});
const upload = multer({ storage: storage });

// 静态资源托管
app.use('/uploads', express.static('uploads'));

// 连接MongoDB
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/campus-platform');

// 测试接口
app.get('/', (req, res) => {
  res.send('后端服务已启动');
});

// 文件上传接口（支持图片、视频、文档等）
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有文件' });
  }
  
  try {
    let fileUrl;
    
    // 如果配置了 Cloudinary，使用云存储
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: 'auto',
        folder: 'campus-platform'
      });
      fileUrl = result.secure_url;
      
      // 删除本地文件
      fs.unlinkSync(req.file.path);
    } else {
      // 使用本地存储
      fileUrl = `/uploads/${req.file.filename}`;
    }
    
    res.json({ url: fileUrl });
  } catch (error) {
    console.error('文件上传错误:', error);
    res.status(500).json({ error: '文件上传失败' });
  }
});

// 注册接口（邮箱唯一，名字唯一且只能设置一次）
app.post('/api/register', async (req, res) => {
  const { email, password, name, age, class: userClass, avatar } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码必填' });
  }
  try {
    // 名字唯一性校验
    if (name) {
      const nameExist = await User.findOne({ name });
      if (nameExist) {
        return res.status(400).json({ error: '名字已被占用' });
      }
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword, name, age, class: userClass, avatar });
    res.json({ message: '注册成功' });
  } catch (e) {
    res.status(400).json({ error: '邮箱已被注册' });
  }
});

// 登录接口
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: '用户不存在' });
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: '密码错误' });
  // 生成token
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '7d' });
  res.json({ token, email: user.email, role: user.role });
});

// 获取当前用户信息
app.get('/api/me', auth, async (req, res) => {
  const user = await User.findById(req.userId).select('-password');
  res.json(user);
});

// 更新用户信息（昵称、年级、班级、头像，名字只能设置一次且全站唯一）
app.post('/api/me', auth, async (req, res) => {
  const { name, age, class: userClass, avatar } = req.body;
  const user = await User.findById(req.userId);

  // 名字只能设置一次且全站唯一
  if (name && (!user.name || user.name === '')) {
    const nameExist = await User.findOne({ name });
    if (nameExist) {
      return res.status(400).json({ error: '名字已被占用' });
    }
    user.name = name;
  } else if (name && user.name && user.name !== name) {
    return res.status(400).json({ error: '名字只能设置一次，无法修改' });
  }

  if (age !== undefined) user.age = age;
  if (userClass !== undefined) user.class = userClass;
  if (avatar !== undefined) user.avatar = avatar;

  await user.save();
  res.json(user);
});

// 发布意见
app.post('/api/feedback', auth, async (req, res) => {
  const { category, content, media } = req.body;
  const user = await User.findById(req.userId);
  if (!category || !content || !user) {
    return res.status(400).json({ error: '信息不完整' });
  }
  const feedback = await Feedback.create({
    category,
    content,
    author: user.email,
    authorName: user.name,
    authorAvatar: user.avatar,
    authorClass: user.class,
    media: media || [],
    createdAt: new Date()
  });
  res.json(feedback);
});

// 获取所有意见（按时间倒序）
app.get('/api/feedback', async (req, res) => {
  const list = await Feedback.find().sort({ createdAt: -1 });
  res.json(list);
});

// 发布跨校联合内容
app.post('/api/crosscampus', auth, async (req, res) => {
  const { title, content, media } = req.body;
  const user = await User.findById(req.userId);
  if (!title || !content || !user) {
    return res.status(400).json({ error: '信息不完整' });
  }
  const post = await CrossCampus.create({
    title,
    content,
    author: user.email,
    authorId: user._id,
    authorName: user.name,
    authorAvatar: user.avatar,
    authorClass: user.class,
    media: media || [],
    createdAt: new Date()
  });
  res.json(post);
});

// 获取所有跨校联合内容（按时间倒序）
app.get('/api/crosscampus', async (req, res) => {
  const list = await CrossCampus.find().sort({ createdAt: -1 });
  res.json(list);
});

// 发布学习板块内容
app.post('/api/study', auth, async (req, res) => {
  const { tab, title, content, media } = req.body;
  const user = await User.findById(req.userId);
  if (!tab || !title || !content || !user) {
    return res.status(400).json({ error: '信息不完整' });
  }
  const post = await Study.create({
    tab,
    title,
    content,
    author: user.email,
    authorId: user._id,
    authorName: user.name,
    authorAvatar: user.avatar,
    authorClass: user.class,
    media: media || [],
    createdAt: new Date()
  });
  res.json(post);
});

// 获取学习板块内容（可按tab分类，按时间倒序）
app.get('/api/study', async (req, res) => {
  const { tab } = req.query;
  const filter = tab ? { tab } : {};
  const list = await Study.find(filter).sort({ createdAt: -1 });
  res.json(list);
});

// 发布艺术作品
app.post('/api/art', auth, async (req, res) => {
  const { tab, title, content, media } = req.body;
  const user = await User.findById(req.userId);
  if (!tab || !title || !content || !user) {
    return res.status(400).json({ error: '信息不完整' });
  }
  const post = await Art.create({
    tab,
    title,
    content,
    author: user.email,
    authorId: user._id,
    authorName: user.name,
    authorAvatar: user.avatar,
    authorClass: user.class,
    media: media || [],
    likes: 0,
    likedUsers: [],
    createdAt: new Date()
  });
  res.json(post);
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
  const list = await query;
  res.json(list);
});

// 点赞/取消点赞
app.post('/api/art/:id/like', auth, async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
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
});

// 发布活动
app.post('/api/activity', auth, async (req, res) => {
  const { title, content, media } = req.body;
  const user = await User.findById(req.userId);
  if (!title || !content || !user) {
    return res.status(400).json({ error: '信息不完整' });
  }
  const activity = await Activity.create({
    title,
    content,
    author: user.email,
    authorId: user._id,
    authorName: user.name,
    authorAvatar: user.avatar,
    authorClass: user.class,
    media: media || [],
    status: 'pending',
    createdAt: new Date()
  });
  res.json(activity);
});

// 获取活动列表（可选status，默认只展示已审核通过的）
app.get('/api/activity', async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : { status: 'approved' };
  const list = await Activity.find(filter).sort({ createdAt: -1 });
  res.json(list);
});

// 审核活动（管理员用，实际项目应加权限校验）
app.post('/api/activity/:id/approve', auth, requireRole(['founder', 'admin']), async (req, res) => {
  const { id } = req.params;
  const activity = await Activity.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
  res.json(activity);
});

// 全局搜索API
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.json({ study: [], art: [], activity: [], crosscampus: [] });
  }

  try {
    const searchRegex = new RegExp(q, 'i');
    const [studyResults, artResults, activityResults, crosscampusResults] = await Promise.all([
      Study.find({ $or: [{ title: searchRegex }, { content: searchRegex }] }).sort({ createdAt: -1 }).limit(10),
      Art.find({ $or: [{ title: searchRegex }, { content: searchRegex }] }).sort({ createdAt: -1 }).limit(10),
      Activity.find({ $or: [{ title: searchRegex }, { content: searchRegex }], status: 'approved' }).sort({ createdAt: -1 }).limit(10),
      CrossCampus.find({ $or: [{ title: searchRegex }, { content: searchRegex }] }).sort({ createdAt: -1 }).limit(10)
    ]);
    res.json({
      study: studyResults,
      art: artResults,
      activity: activityResults,
      crosscampus: crosscampusResults
    });
  } catch (error) {
    res.status(500).json({ error: '搜索失败' });
  }
});

// 权限管理API
// 搜索用户（通过邮箱）
app.get('/api/users/search', auth, requireRole(['founder', 'admin']), async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: '请提供邮箱' });
  }
  const user = await User.findOne({ email }).select('-password');
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json(user);
});

// 转让权限（创始人可以指定管理员，创始人和管理员可以转让权限）
app.post('/api/users/:id/transfer-role', auth, requireRole(['founder', 'admin']), async (req, res) => {
  const { id } = req.params;
  const { newRole } = req.body;
  const currentUser = req.user;

  // 只有创始人可以指定管理员
  if (newRole === 'admin' && currentUser.role !== 'founder') {
    return res.status(403).json({ error: '只有创始人可以指定管理员' });
  }

  // 只有创始人可以转让创始人权限
  if (newRole === 'founder' && currentUser.role !== 'founder') {
    return res.status(403).json({ error: '只有创始人可以转让创始人权限' });
  }

  try {
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 更新目标用户权限
    targetUser.role = newRole;
    await targetUser.save();

    // 如果是转让创始人权限，当前用户变为管理员
    if (newRole === 'founder' && currentUser.role === 'founder') {
      currentUser.role = 'admin';
      await currentUser.save();
    }

    res.json({ message: '权限转让成功', user: targetUser });
  } catch (error) {
    res.status(500).json({ error: '权限转让失败' });
  }
});

// 获取所有用户（仅创始人和管理员可见）
app.get('/api/users', auth, requireRole(['founder', 'admin']), async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
});

// 内容审核API
// 提交内容到审核区域
app.post('/api/pending-content', auth, async (req, res) => {
  const { type, category, title, content, media, authorName, authorAvatar } = req.body;
  const user = await User.findById(req.userId);

  if (!type || !category || !title || !content) {
    return res.status(400).json({ error: '信息不完整' });
  }

  try {
    const pendingContent = await PendingContent.create({
      type,
      category,
      title,
      content,
      author: authorName || user.name || user.email,
      authorId: user._id,
      media: media || [],
      authorName: authorName || user.name || user.email,
      authorAvatar: authorAvatar || user.avatar || ''
    });
    res.json({ message: '内容已提交审核', content: pendingContent });
  } catch (error) {
    res.status(500).json({ error: '提交失败' });
  }
});

// 获取待审核内容列表（仅创始人和管理员可见）
app.get('/api/pending-content', auth, requireRole(['founder', 'admin']), async (req, res) => {
  const { status, category, type } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (type) filter.type = type;

  try {
    const list = await PendingContent.find(filter)
      .populate('authorId', 'name email')
      .populate('reviewer', 'name email')
      .sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: '获取审核列表失败' });
  }
});

// 获取用户内容处理状态
app.get('/api/user-content-status', auth, async (req, res) => {
  try {
    const userId = req.userId;
    // 获取用户的所有待审核内容
    const pendingContents = await PendingContent.find({ authorId: userId }).sort({ createdAt: -1 });
    // 获取用户的所有已通过内容（从各个板块中查找）
    const [studyContents, artContents, activityContents, crosscampusContents] = await Promise.all([
      Study.find({ authorId: userId }).sort({ createdAt: -1 }),
      Art.find({ authorId: userId }).sort({ createdAt: -1 }),
      Activity.find({ authorId: userId }).sort({ createdAt: -1 }),
      CrossCampus.find({ authorId: userId }).sort({ createdAt: -1 })
    ]);
    // 整理数据
    const contentStatus = {
      pending: pendingContents.filter(item => item.status === 'pending').map(item => ({
        ...item.toObject(),
        type: 'pending',
        statusText: '审核中'
      })),
      approved: [
        ...studyContents.map(item => ({ ...item.toObject(), type: 'study', statusText: '已通过' })),
        ...artContents.map(item => ({ ...item.toObject(), type: 'art', statusText: '已通过' })),
        ...activityContents.map(item => ({ ...item.toObject(), type: 'activity', statusText: '已通过' })),
        ...crosscampusContents.map(item => ({ ...item.toObject(), type: 'crosscampus', statusText: '已通过' }))
      ],
      rejected: pendingContents.filter(item => item.status === 'rejected').map(item => ({
        ...item.toObject(),
        type: 'rejected',
        statusText: '被驳回'
      }))
    };
    res.json(contentStatus);
  } catch (error) {
    res.status(500).json({ error: '获取内容状态失败' });
  }
});

// 删除被驳回的内容
app.delete('/api/pending-content/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const pendingContent = await PendingContent.findOne({ _id: id, authorId: userId });
    if (!pendingContent) {
      return res.status(404).json({ error: '内容不存在或无权限删除' });
    }
    if (pendingContent.status !== 'rejected') {
      return res.status(400).json({ error: '只能删除被驳回的内容' });
    }
    await PendingContent.findByIdAndDelete(id);
    res.json({ message: '内容已删除' });
  } catch (error) {
    res.status(500).json({ error: '删除失败' });
  }
});

// 更新被驳回的内容
app.put('/api/pending-content/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, media } = req.body;
    const userId = req.userId;
    const pendingContent = await PendingContent.findOne({ _id: id, authorId: userId });
    if (!pendingContent) {
      return res.status(404).json({ error: '内容不存在或无权限修改' });
    }
    if (pendingContent.status !== 'rejected') {
      return res.status(400).json({ error: '只能修改被驳回的内容' });
    }
    // 更新内容
    pendingContent.title = title;
    pendingContent.content = content;
    pendingContent.category = category;
    pendingContent.media = media || [];
    pendingContent.status = 'pending'; // 重新提交审核
    pendingContent.reviewNote = ''; // 清空驳回原因
    await pendingContent.save();
    res.json({ message: '内容已更新并重新提交审核', content: pendingContent });
  } catch (error) {
    res.status(500).json({ error: '更新失败' });
  }
});

// 检查用户信息是否完善
app.get('/api/user-profile-complete', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    // 检查必填字段
    const requiredFields = ['email', 'name', 'age', 'class', 'avatar'];
    const missingFields = requiredFields.filter(field => {
      if (field === 'age') {
        return !user[field] || user[field] === null;
      }
      return !user[field] || user[field].trim() === '';
    });
    const isComplete = missingFields.length === 0;
    res.json({
      isComplete,
      missingFields,
      message: isComplete ? '个人信息已完善' : '请完善个人信息'
    });
  } catch (error) {
    res.status(500).json({ error: '检查失败' });
  }
});

// 审核内容（通过/驳回）
app.post('/api/pending-content/:id/review', auth, requireRole(['founder', 'admin']), async (req, res) => {
  const { id } = req.params;
  const { action, note } = req.body; // action: 'approve' 或 'reject'
  const reviewer = await User.findById(req.userId);

  // 如果是驳回，必须填写驳回原因
  if (action === 'reject' && (!note || note.trim() === '')) {
    return res.status(400).json({ error: '驳回时必须填写驳回原因' });
  }

  try {
    const pendingContent = await PendingContent.findById(id);
    if (!pendingContent) {
      return res.status(404).json({ error: '内容不存在' });
    }
    pendingContent.status = action === 'approve' ? 'approved' : 'rejected';
    pendingContent.reviewer = reviewer._id;
    pendingContent.reviewNote = note || '';

    if (action === 'approve') {
      // 审核通过，创建正式内容
      let newContent;
      try {
        // 获取用户信息
        const user = await User.findById(pendingContent.authorId);
        const contentData = {
          title: pendingContent.title,
          content: pendingContent.content,
          author: pendingContent.author,
          authorId: pendingContent.authorId,
          authorName: pendingContent.authorName || (user ? user.name : pendingContent.author),
          authorAvatar: pendingContent.authorAvatar || (user ? user.avatar : ''),
          authorClass: user ? user.class : '',
          createdAt: new Date()
        };
        switch (pendingContent.type) {
          case 'study':
            newContent = await Study.create({
              ...contentData,
              tab: pendingContent.category,
              media: pendingContent.media || []
            });
            break;
          case 'art':
            newContent = await Art.create({
              ...contentData,
              tab: pendingContent.category,
              media: pendingContent.media || [],
              likes: 0
            });
            break;
          case 'activity':
            newContent = await Activity.create({
              ...contentData,
              status: 'approved',
              media: pendingContent.media || []
            });
            break;
          case 'crosscampus':
            newContent = await CrossCampus.create({
              ...contentData,
              media: pendingContent.media || []
            });
            break;
          default:
            throw new Error(`Unknown content type: ${pendingContent.type}`);
        }
        pendingContent.originalData = newContent;
      } catch (error) {
        return res.status(500).json({ error: `创建内容失败: ${error.message}` });
      }
    }
    await pendingContent.save();
    res.json({ message: `内容已${action === 'approve' ? '通过' : '驳回'}`, content: pendingContent });
  } catch (error) {
    res.status(500).json({ error: '审核失败' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});