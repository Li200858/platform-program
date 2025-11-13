const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FileBackup = require('./backup');

const SYSTEM_STAGE_DEFINITIONS = [
  { key: 'preparation', name: '活动准备', allowEdit: false, order: 0 },
  { key: 'kickoff', name: '活动开始', allowEdit: false, order: 1 },
  { key: 'closing', name: '活动结束', allowEdit: false, order: 9999 }
];

const SYSTEM_STAGE_KEYS = SYSTEM_STAGE_DEFINITIONS.map(def => def.key);

const generateCustomStageKey = (prefix = 'stage') => {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const parseDate = (value, fallback) => {
  if (value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  if (fallback) {
    const fallbackDate = fallback instanceof Date ? fallback : new Date(fallback);
    if (!Number.isNaN(fallbackDate.getTime())) {
      return fallbackDate;
    }
  }
  throw new Error('阶段时间格式无效，请检查后重试');
};

const normalizeStages = (stagesInput, {
  defaultPreparationStart = new Date(),
  defaultKickoffStart = defaultPreparationStart,
  defaultClosingStart = defaultKickoffStart
} = {}) => {
  const normalized = [];
  const seenKeys = new Set();
  const inputArray = Array.isArray(stagesInput) ? stagesInput : [];

  inputArray.forEach((stage, index) => {
    if (!stage) {
      return;
    }

    const requestedKey = stage.key || stage.stageKey || stage.id;
    const systemDefinition = SYSTEM_STAGE_DEFINITIONS.find(def => def.key === requestedKey);
    let finalKey = requestedKey;

    if (!finalKey) {
      finalKey = systemDefinition ? systemDefinition.key : generateCustomStageKey(`custom${index}`);
    }

    if (seenKeys.has(finalKey)) {
      finalKey = generateCustomStageKey(`custom${index}`);
    }

    const isSystemStage = SYSTEM_STAGE_KEYS.includes(finalKey);
    const fallbackStart = isSystemStage
      ? (finalKey === 'kickoff'
        ? defaultKickoffStart
        : finalKey === 'closing'
          ? defaultClosingStart
          : defaultPreparationStart)
      : defaultKickoffStart;

    const normalizedStage = {
      key: finalKey,
      name: stage.name || (systemDefinition ? systemDefinition.name : `阶段${index + 1}`),
      description: stage.description || '',
      startAt: parseDate(stage.startAt || stage.time || stage.startDate, fallbackStart),
      isSystemDefault: isSystemStage || !!stage.isSystemDefault,
      allowEdit: isSystemStage ? false : (stage.allowEdit === false ? false : true)
    };

    normalized.push(normalizedStage);
    seenKeys.add(finalKey);
  });

  SYSTEM_STAGE_DEFINITIONS.forEach(definition => {
    if (!seenKeys.has(definition.key)) {
      const fallbackStart = definition.key === 'kickoff'
        ? defaultKickoffStart
        : definition.key === 'closing'
          ? defaultClosingStart
          : defaultPreparationStart;

      normalized.push({
        key: definition.key,
        name: definition.name,
        description: '',
        startAt: parseDate(null, fallbackStart),
        isSystemDefault: true,
        allowEdit: false
      });
      seenKeys.add(definition.key);
    }
  });

  normalized.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

  normalized.forEach((stage, index) => {
    stage.order = index;
    stage.endAt = index < normalized.length - 1 ? new Date(normalized[index + 1].startAt) : null;
    if (SYSTEM_STAGE_KEYS.includes(stage.key)) {
      stage.isSystemDefault = true;
      stage.allowEdit = false;
      stage.name = stage.name || SYSTEM_STAGE_DEFINITIONS.find(def => def.key === stage.key).name;
    }
  });

  const kickoffStage = normalized.find(stage => stage.key === 'kickoff');
  const closingStage = normalized.find(stage => stage.key === 'closing');
  const normalizedStartDate = kickoffStage ? new Date(kickoffStage.startAt) : new Date(normalized[0].startAt);
  const normalizedEndDate = closingStage ? new Date(closingStage.startAt) : new Date(normalized[normalized.length - 1].startAt);

  return {
    stages: normalized,
    startDate: normalizedStartDate,
    endDate: normalizedEndDate
  };
};

const computeCurrentStage = (stages, now = new Date()) => {
  if (!Array.isArray(stages) || stages.length === 0) {
    return null;
  }

  const sortedStages = stages.slice().sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  const currentTime = now.getTime();
  let currentStage = sortedStages[0];

  for (const stage of sortedStages) {
    const stageStart = new Date(stage.startAt).getTime();
    if (Number.isNaN(stageStart)) {
      continue;
    }
    if (currentTime >= stageStart) {
      currentStage = stage;
    } else {
      break;
    }
  }

  return currentStage;
};

const formatActivityForResponse = (activity, { serverNow = new Date() } = {}) => {
  if (!activity) {
    return activity;
  }

  const activityObject = activity.toObject ? activity.toObject() : { ...activity };
  if (Array.isArray(activityObject.stages)) {
    activityObject.stages = activityObject.stages
      .map(stage => ({
        ...stage,
        startAt: stage.startAt ? new Date(stage.startAt) : null,
        endAt: stage.endAt ? new Date(stage.endAt) : null
      }))
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
    activityObject.currentStage = computeCurrentStage(activityObject.stages, serverNow);
  } else {
    activityObject.stages = [];
    activityObject.currentStage = null;
  }
  activityObject.serverTime = serverNow.toISOString();
  return activityObject;
};

// 数据模型
const Art = require('./models/Art');
const Activity = require('./models/Activity');
const Feedback = require('./models/Feedback');
const User = require('./models/User');
const Maintenance = require('./models/Maintenance');
const Notification = require('./models/Notification');
const Portfolio = require('./models/Portfolio');
const Resource = require('./models/Resource');

// 文件删除工具函数
const deleteFile = (filePath) => {
  try {
    if (!filePath) {
      console.log('文件路径为空，跳过删除');
      return false;
    }
    
    // 从任何格式的路径中提取文件名
    const fileName = path.basename(filePath);
    console.log('提取的文件名:', fileName);
    
    // 根据环境确定正确的上传目录
    let uploadDir;
    if (process.env.NODE_ENV === 'production') {
      uploadDir = '/opt/render/project/src/uploads';
    } else {
      uploadDir = path.join(__dirname, 'uploads');
    }
    
    // 构建完整的文件路径
    const fullPath = path.join(uploadDir, fileName);
    console.log('尝试删除文件:', fullPath);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log('文件已删除:', fullPath);
      return true;
    } else {
      console.log('文件不存在:', fullPath);
      return false;
    }
  } catch (error) {
    console.error('删除文件失败:', filePath, error.message);
  }
  return false;
};

// 删除多个文件
const deleteFiles = (filePaths) => {
  try {
    if (!filePaths || !Array.isArray(filePaths)) {
      console.log('文件路径数组为空或无效，跳过删除');
      return;
    }
    
    console.log(`开始删除 ${filePaths.length} 个文件`);
    let deletedCount = 0;
    
    filePaths.forEach((filePath, index) => {
      try {
        if (filePath) {
          console.log(`删除文件 ${index + 1}/${filePaths.length}:`, filePath);
          if (deleteFile(filePath)) {
            deletedCount++;
          }
        }
      } catch (error) {
        console.error(`删除文件失败 ${index + 1}/${filePaths.length}:`, filePath, error.message);
      }
    });
    
    console.log(`文件删除完成，成功删除 ${deletedCount}/${filePaths.length} 个文件`);
  } catch (error) {
    console.error('批量删除文件时发生错误:', error);
  }
};

// 清理孤立文件 - 删除不在数据库中引用的文件
const cleanupOrphanedFiles = async () => {
  try {
    console.log('开始清理孤立文件...');
    const uploadsDir = process.env.NODE_ENV === 'production' ? 
      '/opt/render/project/src/uploads' : 
      path.join(__dirname, 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('uploads目录不存在，跳过清理');
      return;
    }
    
    const files = fs.readdirSync(uploadsDir);
    console.log(`找到 ${files.length} 个文件需要检查`);
    
    // 获取所有数据库中引用的文件路径
    const referencedFiles = new Set();
    
    // 从作品表中获取文件路径
    const arts = await Art.find({}, 'media');
    arts.forEach(art => {
      if (art.media && Array.isArray(art.media)) {
        art.media.forEach(filePath => {
          if (filePath) {
            const fileName = path.basename(filePath);
            referencedFiles.add(fileName);
          }
        });
      }
    });
    
    // 从活动表中获取文件路径
    const activities = await Activity.find({}, 'image media');
    activities.forEach(activity => {
      if (activity.image) {
        const fileName = path.basename(activity.image);
        referencedFiles.add(fileName);
      }
      if (activity.media && Array.isArray(activity.media)) {
        activity.media.forEach(filePath => {
          if (filePath) {
            const fileName = path.basename(filePath);
            referencedFiles.add(fileName);
          }
        });
      }
    });
    
    // 从作品集表中获取文件路径
    const portfolios = await Portfolio.find({}, 'coverImage');
    portfolios.forEach(portfolio => {
      if (portfolio.coverImage) {
        const fileName = path.basename(portfolio.coverImage);
        referencedFiles.add(fileName);
      }
    });
    
    // 从资源库表中获取文件路径
    const resources = await Resource.find({}, 'files');
    resources.forEach(resource => {
      if (resource.files && Array.isArray(resource.files)) {
        resource.files.forEach(filePath => {
          if (filePath) {
            const fileName = path.basename(filePath);
            referencedFiles.add(fileName);
          }
        });
      }
    });
    
    console.log(`数据库中共引用 ${referencedFiles.size} 个文件`);
    
    // 删除未被引用的文件（仅删除创建超过1小时的孤立文件，防止误删正在上传的文件）
    let deletedCount = 0;
    const oneHourAgo = Date.now() - (60 * 60 * 1000); // 1小时前
    
    files.forEach(fileName => {
      if (!referencedFiles.has(fileName)) {
        const filePath = path.join(uploadsDir, fileName);
        try {
          const stats = fs.statSync(filePath);
          const fileAge = stats.birthtimeMs || stats.ctimeMs;
          
          // 只删除创建超过1小时的孤立文件
          if (fileAge < oneHourAgo) {
          fs.unlinkSync(filePath);
            console.log('删除孤立文件:', fileName, `(创建于 ${new Date(fileAge).toLocaleString()})`);
          deletedCount++;
          } else {
            console.log('跳过最近上传的文件:', fileName, '(可能正在处理中)');
          }
        } catch (error) {
          console.error('删除孤立文件失败:', fileName, error.message);
        }
      }
    });
    
    console.log(`孤立文件清理完成，删除了 ${deletedCount} 个文件`);
  } catch (error) {
    console.error('清理孤立文件失败:', error);
  }
};

const app = express();
const PORT = process.env.PORT || 5000;

// 确保端口正确
console.log(`环境变量 PORT: ${process.env.PORT}`);
console.log(`使用端口: ${PORT}`);

// 中间件
// CORS配置
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://platform-program-frontend.onrender.com',
      'https://platform-program.onrender.com',
      'https://platform-mobile.onrender.com',
      'https://platform-mobile-frontend.onrender.com',
      'https://hwartplatform.org',
      'https://www.hwartplatform.org',
      'https://mobile.hwartplatform.org',
      'https://ipad.hwartplatform.org'
    ];
    
    console.log('CORS请求来源:', origin);
    
    // 允许没有origin的请求（如移动应用）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS拒绝来源:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// 增加请求体大小限制（支持大文件）
app.use(express.json({ limit: '2gb' }));
app.use(express.urlencoded({ limit: '2gb', extended: true }));

// 设置超时时间（30分钟，适合大文件上传）
app.use((req, res, next) => {
  req.setTimeout(1800000); // 30分钟
  res.setTimeout(1800000);
  next();
});

// 额外的CORS处理
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log('CORS Request from origin:', origin);
  
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    res.sendStatus(200);
  } else {
    next();
  }
});
// 配置静态文件服务 - 支持持久化存储
const uploadsDir = process.env.NODE_ENV === 'production' ? '/opt/render/project/src/uploads' : 'uploads';
console.log('静态文件服务目录:', uploadsDir);
console.log('目录是否存在:', fs.existsSync(uploadsDir));
if (fs.existsSync(uploadsDir)) {
  console.log('目录内容:', fs.readdirSync(uploadsDir));
}
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
  limits: { 
    fileSize: 2048 * 1024 * 1024, // 2GB
    files: 20 // 增加到20个文件
  },
  fileFilter: (req, file, cb) => {
    const sizeMB = file.size ? (file.size / 1024 / 1024).toFixed(2) : '未知';
    console.log(`📤 接收文件: ${file.originalname} (${sizeMB}MB)`);
    cb(null, true); // 允许所有文件类型
  }
});

// 连接MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/platform-program')
  .then(() => console.log('MongoDB连接成功'))
  .catch(err => console.error('MongoDB连接失败:', err));

// 文件上传API（增强版）
app.post('/api/upload', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      console.log('❌ 上传失败: 没有文件');
      return res.status(400).json({ error: '没有上传文件' });
    }
    
    console.log(`✅ 成功上传 ${req.files.length} 个文件`);
    
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://platform-program.onrender.com' 
      : 'http://localhost:5000';
    
    const fileUrls = req.files.map(file => {
      const url = `${baseUrl}/uploads/${file.filename}`;
      console.log(`  📁 ${file.originalname} -> ${file.filename} (${(file.size / 1024).toFixed(2)}KB)`);
      return url;
    });
    
    // 等待一小段时间确保文件写入完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    res.json({ 
      urls: fileUrls,
      success: true,
      count: fileUrls.length
    });
  } catch (error) {
    console.error('❌ 文件上传错误:', error);
    res.status(500).json({ 
      error: '文件上传失败: ' + error.message,
      success: false 
    });
  }
});

// 获取服务器当前时间
app.get('/api/time', (req, res) => {
  res.json({ serverTime: new Date().toISOString() });
});

// 艺术作品API
app.post('/api/art', async (req, res) => {
  const { tab, title, content, media, authorName, authorClass, allowDownload } = req.body;
  
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
      allowDownload: allowDownload !== false,
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

    // 创建通知并实时推送
    const notification = await Notification.create({
      recipient: username,
      sender: invitedBy,
      type: 'mention',
      content: `${invitedBy} 邀请您参与作品 "${art.title}" 的创作`,
      relatedId: art._id,
      relatedType: 'art'
    });

    // 🔔 实时推送通知（如果用户在线，立即收到）
    if (global.sendRealtimeNotification) {
      const sent = global.sendRealtimeNotification(username, {
        ...notification.toObject(),
        message: `${invitedBy} 邀请您参与作品 "${art.title}" 的创作`,
        timestamp: new Date()
      });
      
      if (sent) {
        console.log(`✅ 实时通知已推送给在线用户: ${username}`);
      }
    }

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
    console.log(`删除作品请求: ID=${id}, authorName=${authorName}, isAdmin=${isAdmin}`);
    
    const work = await Art.findById(id);
    if (!work) {
      console.log('作品不存在:', id);
      return res.status(404).json({ error: '作品不存在' });
    }

    const isAuthor = work.authorName === authorName || work.author === authorName;
    const isAdminUser = isAdmin === 'true';

    console.log(`权限检查: isAuthor=${isAuthor}, isAdminUser=${isAdminUser}`);

    if (!isAuthor && !isAdminUser) {
      console.log('权限不足，拒绝删除');
      return res.status(403).json({ error: '无权限删除此作品' });
    }

    // 删除相关文件
    if (work.media && Array.isArray(work.media)) {
      console.log(`开始删除 ${work.media.length} 个媒体文件`);
      deleteFiles(work.media);
    } else {
      console.log('没有媒体文件需要删除');
    }

    // 删除数据库记录
    await Art.findByIdAndDelete(id);
    console.log('作品删除成功:', id);
    
    res.json({ message: '作品已删除' });
  } catch (error) {
    console.error('删除作品失败:', error);
    res.status(500).json({ error: '删除失败: ' + error.message });
  }
});

// 活动相关API
app.get('/api/activities', async (req, res) => {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 });
    const serverNow = new Date();
    const formatted = activities.map(activity => formatActivityForResponse(activity, { serverNow }));
    res.json({
      serverTime: serverNow.toISOString(),
      items: formatted
    });
  } catch (error) {
    console.error('获取活动失败:', error);
    res.status(500).json({ error: '获取活动失败' });
  }
});

app.post('/api/activities', async (req, res) => {
  const {
    title,
    description,
    startDate,
    endDate,
    image,
    authorName,
    authorClass,
    media,
    stages: stagesInput
  } = req.body;
  
  if (!title || !description || !authorName || !authorClass) {
    return res.status(400).json({ error: '请填写所有必要信息' });
  }
  
  try {
    const normalized = normalizeStages(stagesInput, {
      defaultPreparationStart: new Date(),
      defaultKickoffStart: startDate ? new Date(startDate) : new Date(),
      defaultClosingStart: endDate ? new Date(endDate) : (startDate ? new Date(startDate) : new Date())
    });

    const activity = await Activity.create({
      title,
      description,
      startDate: normalized.startDate,
      endDate: normalized.endDate,
      image,
      media: media || [],
      stages: normalized.stages,
      author: authorName,
      authorName,
      authorClass,
      createdAt: new Date()
    });
    
    res.json(formatActivityForResponse(activity));
  } catch (error) {
    console.error('创建活动失败:', error);
    res.status(500).json({ error: '创建活动失败: ' + error.message });
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
    res.json(formatActivityForResponse(activity));
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
    res.json(formatActivityForResponse(activity));
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
    res.json(formatActivityForResponse(activity));
  } catch (error) {
    console.error('评论失败:', error);
    res.status(500).json({ error: '评论失败' });
  }
});

// 更新活动（阶段、信息等）
app.put('/api/activities/:id', async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    image,
    media,
    stages: stagesInput,
    startDate,
    endDate,
    authorName,
    isAdmin
  } = req.body;

  try {
    const activity = await Activity.findById(id);
    if (!activity) {
      return res.status(404).json({ error: '活动不存在' });
    }

    const isAuthor = authorName && activity.authorName === authorName;
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: '无权编辑此活动' });
    }

    if (typeof title === 'string' && title.trim()) {
      activity.title = title.trim();
    }
    if (typeof description === 'string' && description.trim()) {
      activity.description = description.trim();
    }
    if (typeof image === 'string') {
      activity.image = image;
    }
    if (Array.isArray(media)) {
      activity.media = media;
    }

    if (stagesInput) {
      const normalized = normalizeStages(stagesInput, {
        defaultPreparationStart: activity.stages?.[0]?.startAt || activity.startDate || new Date(),
        defaultKickoffStart: startDate || activity.startDate || new Date(),
        defaultClosingStart: endDate || activity.endDate || new Date()
      });
      activity.stages = normalized.stages;
      activity.startDate = normalized.startDate;
      activity.endDate = normalized.endDate;
    } else if (startDate || endDate) {
      const normalized = normalizeStages(activity.stages, {
        defaultPreparationStart: activity.stages?.[0]?.startAt || activity.startDate || new Date(),
        defaultKickoffStart: startDate || activity.startDate || new Date(),
        defaultClosingStart: endDate || activity.endDate || new Date()
      });
      activity.stages = normalized.stages;
      activity.startDate = startDate ? parseDate(startDate, normalized.startDate) : normalized.startDate;
      activity.endDate = endDate ? parseDate(endDate, normalized.endDate) : normalized.endDate;
    }

    activity.updatedAt = new Date();
    await activity.save();
    res.json(formatActivityForResponse(activity));
  } catch (error) {
    console.error('更新活动失败:', error);
    res.status(500).json({ error: '更新活动失败: ' + error.message });
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

// 设置超级管理员
app.post('/api/admin/set-super-admin', async (req, res) => {
  const { targetUserName, setByUserName } = req.body;
  
  if (!targetUserName || !setByUserName) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    // 检查操作者是否是超级管理员
    const operator = await User.findOne({ name: setByUserName });
    if (!operator || operator.role !== 'super_admin') {
      return res.status(403).json({ error: '只有超级管理员可以设置其他超级管理员' });
    }

    // 检查目标用户是否存在
    const targetUser = await User.findOne({ name: targetUserName });
    if (!targetUser) {
      return res.status(404).json({ error: '目标用户不存在' });
    }

    // 检查是否已经有其他超级管理员
    const existingSuperAdmin = await User.findOne({ 
      role: 'super_admin', 
      name: { $ne: setByUserName } 
    });
    
    if (existingSuperAdmin) {
      return res.status(400).json({ error: '只能有一个超级管理员，请先移除现有的超级管理员' });
    }

    // 设置目标用户为超级管理员
    targetUser.role = 'super_admin';
    targetUser.isAdmin = true;
    await targetUser.save();

    // 将操作者降级为普通管理员
    operator.role = 'admin';
    await operator.save();

    res.json({ 
      message: '超级管理员设置成功',
      newSuperAdmin: targetUserName,
      previousSuperAdmin: setByUserName
    });
  } catch (error) {
    console.error('设置超级管理员失败:', error);
    res.status(500).json({ error: '设置失败' });
  }
});

// 移除超级管理员权限
app.post('/api/admin/remove-super-admin', async (req, res) => {
  const { targetUserName, setByUserName } = req.body;
  
  if (!targetUserName || !setByUserName) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    // 检查操作者是否是超级管理员
    const operator = await User.findOne({ name: setByUserName });
    if (!operator || operator.role !== 'super_admin') {
      return res.status(403).json({ error: '只有超级管理员可以移除超级管理员权限' });
    }

    // 检查目标用户是否存在
    const targetUser = await User.findOne({ name: targetUserName });
    if (!targetUser) {
      return res.status(404).json({ error: '目标用户不存在' });
    }

    // 不能移除自己的超级管理员权限
    if (targetUserName === setByUserName) {
      return res.status(400).json({ error: '不能移除自己的超级管理员权限' });
    }

    // 将目标用户降级为普通管理员
    targetUser.role = 'admin';
    await targetUser.save();

    res.json({ 
      message: '超级管理员权限已移除',
      targetUser: targetUserName
    });
  } catch (error) {
    console.error('移除超级管理员权限失败:', error);
    res.status(500).json({ error: '操作失败' });
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

// 删除反馈
app.delete('/api/feedback/:id', async (req, res) => {
  const { id } = req.params;
  const { authorName, isAdmin } = req.query;
  
  try {
    console.log(`删除反馈请求: ID=${id}, authorName=${authorName}, isAdmin=${isAdmin}`);
    
    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ error: '反馈不存在' });
    }

    // 检查权限：只有作者本人或管理员可以删除
    const isAuthor = feedback.authorName === authorName;
    const isAdminUser = isAdmin === 'true';
    
    if (!isAuthor && !isAdminUser) {
      return res.status(403).json({ error: '没有权限删除此反馈' });
    }

    // 删除相关文件
    if (feedback.media && Array.isArray(feedback.media)) {
      console.log(`删除反馈的 ${feedback.media.length} 个媒体文件`);
      deleteFiles(feedback.media);
    }

    await Feedback.findByIdAndDelete(id);
    console.log('反馈删除成功:', id);
    res.json({ message: '反馈删除成功' });
  } catch (error) {
    console.error('删除反馈失败:', error);
    res.status(500).json({ error: '删除反馈失败' });
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
    const isAuthor = activity.authorName === authorName;
    const isAdminUser = isAdmin === 'true';
    
    if (!isAuthor && !isAdminUser) {
      return res.status(403).json({ error: '没有权限删除此活动' });
    }

    // 删除相关文件
    if (activity.image) {
      deleteFile(activity.image);
    }
    if (activity.media && Array.isArray(activity.media)) {
      deleteFiles(activity.media);
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
      // 如果没有找到用户，检查姓名是否已被使用
      if (name && name !== '用户') {
        const existingUser = await User.findOne({ name });
        if (existingUser) {
          return res.status(400).json({ 
            error: '该姓名已被注册，请使用其他姓名',
            code: 'NAME_TAKEN'
          });
        }
      }
      
      // 创建新用户
      user = await User.create({
        userID,
        name: name || '用户',
        class: userClass || '未知班级',
        avatar: avatar || '',
        role: 'user',
        isAdmin: false
      });
    } else {
      // 如果找到用户，检查姓名是否被其他用户使用
      if (name && name !== '用户' && name !== user.name) {
        const existingUser = await User.findOne({ name });
        if (existingUser && existingUser.userID !== userID) {
          return res.status(400).json({ 
            error: '该姓名已被其他用户注册，请使用其他姓名',
            code: 'NAME_TAKEN'
          });
        }
      }
      
      // 更新用户信息（保持绑定关系）
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

// 检查姓名是否可用
app.post('/api/user/check-name', async (req, res) => {
  const { name, userID } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '缺少姓名参数' });
  }
  
  try {
    const existingUser = await User.findOne({ name });
    
    if (!existingUser) {
      // 姓名可用
      return res.json({ available: true });
    }
    
    if (userID && existingUser.userID === userID) {
      // 是当前用户自己的姓名
      return res.json({ available: true, isOwn: true });
    }
    
    // 姓名已被其他用户使用
    return res.json({ 
      available: false, 
      error: '该姓名已被注册，请使用其他姓名' 
    });
  } catch (error) {
    console.error('检查姓名失败:', error);
    res.status(500).json({ error: '检查姓名失败' });
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

// 清理孤立文件端点（管理员专用）
app.post('/api/admin/cleanup-files', async (req, res) => {
  try {
    await cleanupOrphanedFiles();
    res.json({ message: '孤立文件清理完成' });
  } catch (error) {
    console.error('清理孤立文件失败:', error);
    res.status(500).json({ error: '清理失败' });
  }
});

// 测试文件删除功能（管理员专用）
app.post('/api/admin/test-file-delete', async (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: '请提供文件路径' });
    }
    
    console.log('测试删除文件:', filePath);
    const result = deleteFile(filePath);
    
    res.json({ 
      success: result,
      message: result ? '文件删除成功' : '文件删除失败',
      filePath: filePath
    });
  } catch (error) {
    console.error('测试文件删除失败:', error);
    res.status(500).json({ error: '测试失败' });
  }
});

// 磁盘使用情况监控
app.get('/api/disk-usage', (req, res) => {
  try {
    const { monitorDiskUsage } = require('./monitor-disk-usage');
    const usage = monitorDiskUsage();
    
    if (usage) {
      res.json({
        success: true,
        data: {
          totalSize: usage.totalSize,
          sizeInMB: usage.sizeInMB,
          sizeInGB: usage.sizeInGB,
          usagePercent: usage.usagePercent,
          remainingGB: (5 - usage.sizeInGB).toFixed(2),
          warning: usage.usagePercent > 80,
          critical: usage.usagePercent > 90
        }
      });
    } else {
      res.json({
        success: false,
        error: '无法获取磁盘使用情况'
      });
    }
  } catch (error) {
    console.error('获取磁盘使用情况失败:', error);
    res.status(500).json({
      success: false,
      error: '获取磁盘使用情况失败'
    });
  }
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

// ==================== 分块上传API (方案B) ====================
const { v4: uuidv4 } = require('uuid');

// 临时分块存储目录
const CHUNKS_DIR = path.join(uploadsDir, 'chunks');

// 确保目录存在
if (!fs.existsSync(CHUNKS_DIR)) {
  fs.mkdirSync(CHUNKS_DIR, { recursive: true });
}

// 1. 初始化上传（获取uploadId）
app.post('/api/upload/init', async (req, res) => {
  try {
    const { filename, fileSize, totalChunks } = req.body;
    
    if (!filename || !fileSize || !totalChunks) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 生成唯一的上传ID
    const uploadId = uuidv4();
    
    // 创建上传会话目录
    const uploadDir = path.join(CHUNKS_DIR, uploadId);
    fs.mkdirSync(uploadDir, { recursive: true });
    
    // 保存上传元数据
    const metadata = {
      uploadId,
      filename,
      fileSize,
      totalChunks,
      uploadedChunks: [],
      createdAt: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(uploadDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    console.log(`📤 初始化分块上传: ${filename} (${(fileSize / 1024 / 1024).toFixed(2)}MB, ${totalChunks}个分块)`);
    
    res.json({
      success: true,
      uploadId,
      message: '上传初始化成功'
    });
  } catch (error) {
    console.error('❌ 初始化上传失败:', error);
    res.status(500).json({ error: '初始化失败: ' + error.message });
  }
});

// 2. 上传单个分块
app.post('/api/upload/chunk', upload.single('chunk'), async (req, res) => {
  try {
    const { uploadId, chunkIndex } = req.body;
    
    if (!uploadId || chunkIndex === undefined || !req.file) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const uploadDir = path.join(CHUNKS_DIR, uploadId);
    const metadataPath = path.join(uploadDir, 'metadata.json');
    
    // 检查上传会话是否存在
    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({ error: '上传会话不存在' });
    }
    
    // 读取元数据
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    
    // 移动分块到上传目录
    const chunkPath = path.join(uploadDir, `chunk_${chunkIndex}`);
    fs.renameSync(req.file.path, chunkPath);
    
    // 更新元数据
    if (!metadata.uploadedChunks.includes(parseInt(chunkIndex))) {
      metadata.uploadedChunks.push(parseInt(chunkIndex));
      metadata.uploadedChunks.sort((a, b) => a - b);
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    }
    
    const progress = ((metadata.uploadedChunks.length / metadata.totalChunks) * 100).toFixed(2);
    console.log(`  📦 分块 ${parseInt(chunkIndex) + 1}/${metadata.totalChunks} (${progress}%)`);
    
    res.json({
      success: true,
      uploadedChunks: metadata.uploadedChunks.length,
      totalChunks: metadata.totalChunks,
      progress: parseFloat(progress)
    });
  } catch (error) {
    console.error('❌ 上传分块失败:', error);
    res.status(500).json({ error: '上传分块失败: ' + error.message });
  }
});

// 3. 完成上传（合并所有分块）
app.post('/api/upload/complete', async (req, res) => {
  try {
    const { uploadId } = req.body;
    
    if (!uploadId) {
      return res.status(400).json({ error: '缺少uploadId' });
    }
    
    const uploadDir = path.join(CHUNKS_DIR, uploadId);
    const metadataPath = path.join(uploadDir, 'metadata.json');
    
    // 检查上传会话是否存在
    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({ error: '上传会话不存在' });
    }
    
    // 读取元数据
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    
    // 检查是否所有分块都已上传
    if (metadata.uploadedChunks.length !== metadata.totalChunks) {
      return res.status(400).json({ 
        error: '上传未完成',
        uploadedChunks: metadata.uploadedChunks.length,
        totalChunks: metadata.totalChunks
      });
    }
    
    console.log(`🔗 开始合并文件: ${metadata.filename}`);
    
    // 生成最终文件名
    const finalFilename = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(metadata.filename);
    const finalPath = path.join(uploadsDir, finalFilename);
    
    // 创建写入流
    const writeStream = fs.createWriteStream(finalPath);
    
    // 按顺序合并所有分块
    for (let i = 0; i < metadata.totalChunks; i++) {
      const chunkPath = path.join(uploadDir, `chunk_${i}`);
      
      if (!fs.existsSync(chunkPath)) {
        throw new Error(`分块 ${i} 不存在`);
      }
      
      const chunkData = fs.readFileSync(chunkPath);
      writeStream.write(chunkData);
      
      // 进度提示
      if ((i + 1) % 10 === 0 || i === metadata.totalChunks - 1) {
        console.log(`  合并进度: ${i + 1}/${metadata.totalChunks}`);
      }
    }
    
    writeStream.end();
    
    // 等待写入完成
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
    
    // 清理临时文件
    fs.rmSync(uploadDir, { recursive: true, force: true });
    
    // 验证文件大小
    const stats = fs.statSync(finalPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log(`✅ 文件合并成功: ${finalFilename} (${sizeMB}MB)`);
    
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://platform-program.onrender.com' 
      : 'http://localhost:5000';
    
    const fileUrl = `${baseUrl}/uploads/${finalFilename}`;
    
    res.json({
      success: true,
      url: fileUrl,
      filename: finalFilename,
      originalName: metadata.filename,
      size: stats.size,
      sizeMB: parseFloat(sizeMB)
    });
  } catch (error) {
    console.error('❌ 完成上传失败:', error);
    res.status(500).json({ error: '完成上传失败: ' + error.message });
  }
});

// 4. 取消上传（清理临时文件）
app.post('/api/upload/cancel', async (req, res) => {
  try {
    const { uploadId } = req.body;
    
    if (!uploadId) {
      return res.status(400).json({ error: '缺少uploadId' });
    }
    
    const uploadDir = path.join(CHUNKS_DIR, uploadId);
    
    if (fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
      console.log(`🗑️  已取消上传: ${uploadId}`);
    }
    
    res.json({
      success: true,
      message: '上传已取消'
    });
  } catch (error) {
    console.error('❌ 取消上传失败:', error);
    res.status(500).json({ error: '取消上传失败: ' + error.message });
  }
});

// 5. 查询上传状态
app.get('/api/upload/status/:uploadId', async (req, res) => {
  try {
    const { uploadId } = req.params;
    
    const uploadDir = path.join(CHUNKS_DIR, uploadId);
    const metadataPath = path.join(uploadDir, 'metadata.json');
    
    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({ error: '上传会话不存在' });
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    
    res.json({
      success: true,
      ...metadata,
      progress: ((metadata.uploadedChunks.length / metadata.totalChunks) * 100).toFixed(2)
    });
  } catch (error) {
    console.error('❌ 查询状态失败:', error);
    res.status(500).json({ error: '查询状态失败: ' + error.message });
  }
});

// 6. 清理过期的临时文件（定期执行）
async function cleanupExpiredChunks() {
  try {
    if (!fs.existsSync(CHUNKS_DIR)) {
      return;
    }
    
    const uploads = fs.readdirSync(CHUNKS_DIR);
    const now = Date.now();
    const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24小时
    
    let cleanedCount = 0;
    
    for (const uploadId of uploads) {
      const uploadDir = path.join(CHUNKS_DIR, uploadId);
      const metadataPath = path.join(uploadDir, 'metadata.json');
      
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        const createdAt = new Date(metadata.createdAt).getTime();
        
        // 删除超过24小时的未完成上传
        if (now - createdAt > EXPIRY_TIME) {
          fs.rmSync(uploadDir, { recursive: true, force: true });
          console.log(`🗑️  清理过期上传: ${uploadId}`);
          cleanedCount++;
        }
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`✅ 清理了 ${cleanedCount} 个过期上传`);
    }
  } catch (error) {
    console.error('❌ 清理过期文件失败:', error);
  }
}

// 每小时清理一次过期文件
setInterval(cleanupExpiredChunks, 60 * 60 * 1000);

console.log('✅ 分块上传API已启用 (支持5GB超大文件，断点续传)');

// ==================== WebSocket实时通知系统 ====================
// 创建HTTP服务器
const server = http.createServer(app);

// 创建Socket.IO服务器
const io = socketIO(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://platform-program-frontend.onrender.com',
      'https://platform-program.onrender.com',
      'https://platform-mobile.onrender.com',
      'https://platform-mobile-frontend.onrender.com',
      'https://hwartplatform.org',
      'https://www.hwartplatform.org',
      'https://mobile.hwartplatform.org',
      'https://ipad.hwartplatform.org'
    ],
    credentials: true
  }
});

// 存储在线用户的socket连接
const userSockets = new Map(); // username -> socket.id

// WebSocket连接处理
io.on('connection', (socket) => {
  console.log(`🔌 WebSocket连接: ${socket.id}`);

  // 用户注册（绑定username和socket）
  socket.on('register', (username) => {
    if (username) {
      userSockets.set(username, socket.id);
      console.log(`👤 用户注册: ${username} (Socket: ${socket.id})`);
      console.log(`📊 当前在线用户: ${userSockets.size}人`);
    }
  });

  // 断开连接
  socket.on('disconnect', () => {
    // 从map中移除该socket
    for (const [username, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(username);
        console.log(`👋 用户离线: ${username}`);
        console.log(`📊 当前在线用户: ${userSockets.size}人`);
        break;
      }
    }
  });
});

// 实时推送通知函数
const sendRealtimeNotification = (username, notification) => {
  const socketId = userSockets.get(username);
  if (socketId) {
    io.to(socketId).emit('new-notification', notification);
    console.log(`📨 实时通知已发送给: ${username}`);
    return true;
  } else {
    console.log(`📭 用户${username}不在线，通知已保存，等待下次登录查看`);
    return false;
  }
};

// 导出io和sendRealtimeNotification供其他地方使用
global.io = io;
global.sendRealtimeNotification = sendRealtimeNotification;

console.log('✅ WebSocket实时通知系统已启用');

// ==================== 启动服务器 ====================

server.listen(PORT, async () => {
  console.log('艺术平台服务器运行在端口', PORT);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`MongoDB连接成功`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
  console.log(`根路径: http://localhost:${PORT}/`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
  
  // 初始化管理员
  await initializeAdmin();
  
  // 清理孤立文件（启动时执行一次）
  console.log('启动时清理孤立文件...');
  await cleanupOrphanedFiles();
  
  // 初始化文件备份系统（已禁用自动恢复，防止覆盖新上传的文件）
  const backup = new FileBackup();
  try {
    // ⚠️ 已禁用自动恢复备份，防止覆盖新文件
    // 如需手动恢复，请使用管理员面板
    
    // 清理旧备份（保留最近7天）
    backup.cleanupOldBackups();
    
    // 创建新的备份
    await backup.createBackup();
    console.log('✅ 文件备份系统初始化完成（自动恢复已禁用）');
  } catch (error) {
    console.log('⚠️ 文件备份系统初始化失败，但不影响服务运行:', error.message);
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

// ==================== 作品集功能 API ====================

// 创建作品集
app.post('/api/portfolio', async (req, res) => {
  const { title, description, category, tags, creator, isPublic, featured } = req.body;
  
  if (!title || !creator) {
    return res.status(400).json({ error: '请填写作品集标题和创建者信息' });
  }

  try {
    const portfolio = await Portfolio.create({
      title,
      description: description || '',
      category: category || 'art',
      tags: tags || [],
      creator,
      isPublic: isPublic !== false,
      featured: featured || false
    });

    res.json(portfolio);
  } catch (error) {
    console.error('创建作品集失败:', error);
    res.status(500).json({ error: '创建作品集失败' });
  }
});

// 获取用户的作品集
app.get('/api/portfolio/user/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const portfolios = await Portfolio.find({ creator: username })
      .populate('works', 'title content media authorName createdAt')
      .sort({ updatedAt: -1 });
    
    res.json(portfolios);
  } catch (error) {
    console.error('获取作品集失败:', error);
    res.status(500).json({ error: '获取作品集失败' });
  }
});

// 获取所有公开作品集
app.get('/api/portfolio/public', async (req, res) => {
  try {
    const portfolios = await Portfolio.find({ isPublic: true })
      .populate('works', 'title content media authorName authorClass createdAt')
      .sort({ updatedAt: -1 });
    
    res.json(portfolios);
  } catch (error) {
    console.error('获取公开作品集失败:', error);
    res.status(500).json({ error: '获取公开作品集失败' });
  }
});

// 获取作品集详情
app.get('/api/portfolio/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const portfolio = await Portfolio.findById(id)
      .populate('works', 'title content media authorName authorClass createdAt');
    
    if (!portfolio) {
      return res.status(404).json({ error: '作品集不存在' });
    }
    
    res.json(portfolio);
  } catch (error) {
    console.error('获取作品集详情失败:', error);
    res.status(500).json({ error: '获取作品集详情失败' });
  }
});

// 更新作品集
app.put('/api/portfolio/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, category, tags, isPublic, featured } = req.body;
  
  try {
    const portfolio = await Portfolio.findById(id);
    if (!portfolio) {
      return res.status(404).json({ error: '作品集不存在' });
    }

    portfolio.title = title || portfolio.title;
    portfolio.description = description || portfolio.description;
    portfolio.category = category || portfolio.category;
    portfolio.tags = tags || portfolio.tags;
    portfolio.isPublic = isPublic !== undefined ? isPublic : portfolio.isPublic;
    portfolio.featured = featured !== undefined ? featured : portfolio.featured;
    portfolio.updatedAt = new Date();

    await portfolio.save();
    res.json(portfolio);
  } catch (error) {
    console.error('更新作品集失败:', error);
    res.status(500).json({ error: '更新作品集失败' });
  }
});

// 删除作品集
app.delete('/api/portfolio/:id', async (req, res) => {
  const { id } = req.params;
  const { authorName, isAdmin } = req.query;
  
  try {
    console.log(`删除作品集请求: ID=${id}, authorName=${authorName}, isAdmin=${isAdmin}`);
    
    const portfolio = await Portfolio.findById(id);
    if (!portfolio) {
      console.log('作品集不存在:', id);
      return res.status(404).json({ error: '作品集不存在' });
    }

    // 检查权限：只有作者本人或管理员可以删除
    const isAuthor = portfolio.creator === authorName;
    const isAdminUser = isAdmin === 'true';
    
    console.log(`权限检查: isAuthor=${isAuthor}, isAdminUser=${isAdminUser}, creator=${portfolio.creator}`);

    if (!isAuthor && !isAdminUser) {
      console.log('权限不足，拒绝删除作品集');
      return res.status(403).json({ error: '没有权限删除此作品集' });
    }

    // 删除作品集封面图片
    if (portfolio.coverImage) {
      console.log('删除作品集封面图片:', portfolio.coverImage);
      deleteFile(portfolio.coverImage);
    }

    await Portfolio.findByIdAndDelete(id);
    console.log('作品集删除成功:', id);
    res.json({ message: '作品集删除成功' });
  } catch (error) {
    console.error('删除作品集失败:', error);
    res.status(500).json({ error: '删除作品集失败' });
  }
});

// 添加作品到作品集
app.post('/api/portfolio/:id/works', async (req, res) => {
  const { id } = req.params;
  const { workId } = req.body;
  
  try {
    const portfolio = await Portfolio.findById(id);
    if (!portfolio) {
      return res.status(404).json({ error: '作品集不存在' });
    }

    if (!portfolio.works.includes(workId)) {
      portfolio.works.push(workId);
      await portfolio.save();
    }

    res.json(portfolio);
  } catch (error) {
    console.error('添加作品失败:', error);
    res.status(500).json({ error: '添加作品失败' });
  }
});

// 从作品集移除作品
app.delete('/api/portfolio/:id/works/:workId', async (req, res) => {
  const { id, workId } = req.params;
  
  try {
    const portfolio = await Portfolio.findById(id);
    if (!portfolio) {
      return res.status(404).json({ error: '作品集不存在' });
    }

    portfolio.works = portfolio.works.filter(w => w.toString() !== workId);
    await portfolio.save();

    res.json(portfolio);
  } catch (error) {
    console.error('移除作品失败:', error);
    res.status(500).json({ error: '移除作品失败' });
  }
});

// 删除作品集内容（直接上传的内容）
app.delete('/api/portfolio/:id/contents/:contentId', async (req, res) => {
  const { id, contentId } = req.params;
  const { authorName, isAdmin } = req.query;
  
  try {
    console.log(`删除作品集内容请求: portfolioId=${id}, contentId=${contentId}, authorName=${authorName}`);
    
    const portfolio = await Portfolio.findById(id);
    if (!portfolio) {
      return res.status(404).json({ error: '作品集不存在' });
    }

    // 检查权限
    const isAuthor = portfolio.creator === authorName;
    const isAdminUser = isAdmin === 'true';
    
    if (!isAuthor && !isAdminUser) {
      return res.status(403).json({ error: '没有权限删除此内容' });
    }

    // 查找要删除的内容
    const contentIndex = portfolio.contents.findIndex(c => c._id.toString() === contentId);
    if (contentIndex === -1) {
      return res.status(404).json({ error: '内容不存在' });
    }

    const content = portfolio.contents[contentIndex];
    
    // 删除相关文件
    if (content.media && Array.isArray(content.media)) {
      console.log(`删除内容的 ${content.media.length} 个媒体文件`);
      const filePaths = content.media.map(m => m.url || m);
      deleteFiles(filePaths);
    }

    // 从数组中移除内容
    portfolio.contents.splice(contentIndex, 1);
    await portfolio.save();

    console.log('作品集内容删除成功');
    res.json({ message: '内容删除成功', portfolio });
  } catch (error) {
    console.error('删除作品集内容失败:', error);
    res.status(500).json({ error: '删除内容失败' });
  }
});

// 直接上传内容到作品集
app.post('/api/portfolio/upload-content', upload.array('files'), async (req, res) => {
  console.log('收到上传内容请求:', {
    body: req.body,
    files: req.files ? req.files.length : 0
  });
  
  const { title, content, authorName, authorClass, category, portfolioId, allowDownload } = req.body;
  
  if (!title || !authorName || !portfolioId) {
    console.log('缺少必要信息:', { title, authorName, portfolioId });
    return res.status(400).json({ error: '请填写必要信息' });
  }

  try {
    console.log('查找作品集:', portfolioId);
    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio) {
      console.log('作品集不存在:', portfolioId);
      return res.status(404).json({ error: '作品集不存在' });
    }

    const files = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      type: file.mimetype,
      size: file.size,
      path: file.path,
      url: `${process.env.NODE_ENV === 'production' ? 'https://platform-program.onrender.com' : 'http://localhost:5000'}/uploads/${file.filename}`
    })) : [];

    console.log('处理文件:', files);

    const newContent = {
      title,
      content: content || '',
      authorName,
      authorClass: authorClass || '未知班级',
      allowDownload: allowDownload !== 'false',
      media: files,
      createdAt: new Date()
    };

    console.log('添加新内容到作品集:', newContent);
    portfolio.contents.push(newContent);
    await portfolio.save();

    console.log('内容上传成功');
    res.json({ message: '内容上传成功', content: newContent });
  } catch (error) {
    console.error('上传内容失败:', error);
    res.status(500).json({ error: '上传内容失败' });
  }
});

// ==================== 学习资料库功能 API ====================

// 获取所有资料
app.get('/api/resources', async (req, res) => {
  try {
    const resources = await Resource.find({ isPublic: true })
      .sort({ createdAt: -1 });
    
    res.json(resources);
  } catch (error) {
    console.error('获取资料失败:', error);
    res.status(500).json({ error: '获取资料失败' });
  }
});

// 获取资料分类
app.get('/api/resources/categories', async (req, res) => {
  try {
    const categories = ['template', 'image', 'video', 'audio', 'document', 'tutorial'];
    res.json(categories);
  } catch (error) {
    console.error('获取分类失败:', error);
    res.status(500).json({ error: '获取分类失败' });
  }
});

// 上传资料
app.post('/api/resources/upload', upload.array('files'), async (req, res) => {
  const { title, description, category, tags, isPublic, uploader } = req.body;
  
  if (!title || !uploader) {
    return res.status(400).json({ error: '请填写资料标题和上传者信息' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: '请选择要上传的文件' });
  }

  try {
    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      type: file.mimetype,
      size: file.size,
      path: file.path,
      url: `${process.env.NODE_ENV === 'production' ? 'https://platform-program.onrender.com' : 'http://localhost:5000'}/uploads/${file.filename}`
    }));

    console.log('上传的文件信息:', files);

    const resource = await Resource.create({
      title,
      description: description || '',
      category: category || 'template',
      tags: tags ? JSON.parse(tags) : [],
      uploader,
      isPublic: isPublic !== 'false',
      files
    });

    console.log('资料创建成功:', resource._id);
    res.json(resource);
  } catch (error) {
    console.error('上传资料失败:', error);
    res.status(500).json({ error: '上传资料失败' });
  }
});

// 删除资料
app.delete('/api/resources/:id', async (req, res) => {
  const { id } = req.params;
  const { authorName, isAdmin } = req.query;
  
  try {
    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ error: '资料不存在' });
    }

    // 检查权限：只有作者本人或管理员可以删除
    const isAuthor = resource.authorName === authorName;
    const isAdminUser = isAdmin === 'true';
    
    if (!isAuthor && !isAdminUser) {
      return res.status(403).json({ error: '没有权限删除此资料' });
    }

    // 删除相关文件
    if (resource.files && Array.isArray(resource.files)) {
      deleteFiles(resource.files);
    }

    await Resource.findByIdAndDelete(id);
    res.json({ message: '资料删除成功' });
  } catch (error) {
    console.error('删除资料失败:', error);
    res.status(500).json({ error: '删除资料失败' });
  }
});

// 下载资料
app.get('/api/resources/:id/download', async (req, res) => {
  const { id } = req.params;
  
  try {
    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ error: '资料不存在' });
    }

    // 增加下载次数
    resource.downloads += 1;
    await resource.save();

    // 返回文件信息，让前端处理下载
    res.json({ 
      message: '下载成功', 
      files: resource.files.map(file => ({
        filename: file.filename,
        originalName: file.originalName,
        url: file.url,
        size: file.size,
        mimetype: file.mimetype
      }))
    });
  } catch (error) {
    console.error('下载资料失败:', error);
    res.status(500).json({ error: '下载资料失败' });
  }
});

// 直接下载文件
app.get('/api/resources/file/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(uploadsDir, filename);
  
  console.log('请求文件:', filename);
  console.log('文件路径:', filePath);
  console.log('文件是否存在:', fs.existsSync(filePath));
  
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    console.log('文件不存在，返回404');
    return res.status(404).json({ error: '文件不存在' });
  }
  
  // 设置下载头
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  
  // 发送文件
  res.sendFile(filePath);
});

// 调试文件访问端点
app.get('/api/debug/files', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const fileInfo = files.map(file => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        created: stats.birthtime,
        url: `/uploads/${file}`
      };
    });
    
    res.json({
      uploadsDir,
      files: fileInfo,
      totalFiles: files.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});