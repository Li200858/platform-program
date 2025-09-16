const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// 中间件
app.use(cors({
  origin: [
    'https://platform-program.vercel.app',
    'https://platform-program-production.up.railway.app',
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
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
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 导入Cloudinary配置和服务
const { cloudinary, verifyCloudinaryConfig, testCloudinaryConnection } = require('./config/cloudinary');
const CloudinaryStorage = require('./services/cloudinaryStorage');

// 检查Cloudinary配置
const cloudinaryConfigured = verifyCloudinaryConfig();
let cloudinaryStorage = null;

if (cloudinaryConfigured) {
  cloudinaryStorage = new CloudinaryStorage();
  console.log('✅ Cloudinary配置完成，强制使用云存储');
} else {
  console.log('❌ Cloudinary配置不完整，文件上传功能将不可用');
  console.log('💡 请设置以下环境变量以启用文件上传:');
  console.log('   - CLOUDINARY_CLOUD_NAME');
  console.log('   - CLOUDINARY_API_KEY');
  console.log('   - CLOUDINARY_API_SECRET');
}

// 配置multer - 使用内存存储以便上传到Cloudinary
const upload = multer({
  storage: multer.memoryStorage(), // 使用内存存储
  limits: { 
    fileSize: 50 * 1024 * 1024, // 增加到50MB，支持更大文件
    files: 10 // 允许同时上传10个文件
  },
  fileFilter: (req, file, cb) => {
    // 允许所有文件类型，Cloudinary会自动处理
    console.log(`📁 文件上传: ${file.originalname}, 类型: ${file.mimetype}, 大小: ${file.size} bytes`);
    cb(null, true);
  }
});

console.log(cloudinaryConfigured ? '✅ 强制使用Cloudinary云存储' : '❌ 文件存储服务不可用');

// 静态文件服务
app.use('/uploads', express.static('uploads'));

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
      // 图片格式
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      // 视频格式
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.wmv': 'video/x-ms-wmv',
      '.flv': 'video/x-flv',
      // 音频格式
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.aac': 'audio/aac',
      '.flac': 'audio/flac',
      '.m4a': 'audio/mp4',
      // 文档格式
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.rtf': 'application/rtf',
      // 压缩文件
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.7z': 'application/x-7z-compressed',
      '.tar': 'application/x-tar',
      '.gz': 'application/gzip',
      // 其他格式
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript'
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 缓存1年
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
app.post('/api/upload', upload.array('files', 5), async (req, res) => {
  try {
    console.log('📤 文件上传请求开始...');
    console.log('上传文件数量:', req.files ? req.files.length : 0);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '没有上传文件' });
    }
    
    // 记录文件信息
    req.files.forEach(file => {
      console.log(`文件: ${file.originalname}, 大小: ${file.size} bytes, 类型: ${file.mimetype}`);
    });
    
    let urls = [];
    let storageType = 'local';
    let totalSize = 0;
    
    if (cloudinaryConfigured && cloudinaryStorage) {
      // 使用Cloudinary上传
      console.log('☁️  使用Cloudinary上传文件...');
      
      try {
        const uploadResults = await cloudinaryStorage.uploadFiles(req.files);
        
        urls = uploadResults
          .filter(result => result.success)
          .map(result => result.url);
        
        totalSize = uploadResults
          .filter(result => result.success)
          .reduce((sum, result) => sum + (result.bytes || 0), 0);
        
        storageType = 'cloudinary';
        
        console.log('✅ Cloudinary上传成功，URLs:', urls);
        
        // 检查是否有上传失败的文件
        const failedUploads = uploadResults.filter(result => !result.success);
        if (failedUploads.length > 0) {
          console.warn('⚠️  部分文件上传失败:', failedUploads);
          // 如果有文件上传失败，返回错误
          return res.status(500).json({ 
            error: '部分文件上传失败', 
            failedFiles: failedUploads.map(f => f.error),
            successfulFiles: urls.length
          });
        }
        
      } catch (cloudinaryError) {
        console.error('❌ Cloudinary上传失败:', cloudinaryError);
        return res.status(500).json({ 
          error: '文件上传失败: ' + cloudinaryError.message,
          details: '请检查Cloudinary配置或稍后重试'
        });
      }
    } else {
      // Cloudinary未配置，拒绝上传
      console.error('❌ Cloudinary未配置，拒绝文件上传');
      return res.status(500).json({ 
        error: '文件存储服务未配置',
        details: '请联系管理员配置Cloudinary存储服务'
      });
    }
    
    res.json({
      urls: urls,
      storage: storageType,
      message: `成功上传 ${urls.length} 个文件`,
      totalSize: totalSize,
      cloudinaryConfigured: cloudinaryConfigured
    });
    
  } catch (error) {
    console.error('❌ 文件上传错误:', error);
    res.status(500).json({ error: '文件上传失败: ' + error.message });
  }
});

// 存储配置检查API
app.get('/api/storage-config', async (req, res) => {
  try {
    const config = {
      storageType: cloudinaryConfigured ? 'cloudinary' : 'none',
      cloudinary: {
        configured: cloudinaryConfigured,
        connected: false,
        required: true // 标记为必需
      },
      local: {
        configured: false, // 本地存储已禁用
        enabled: false
      },
      policy: {
        forceCloudinary: true,
        fallbackDisabled: true
      }
    };
    
    // 如果Cloudinary已配置，测试连接
    if (cloudinaryConfigured) {
      try {
        const connectionTest = await testCloudinaryConnection();
        config.cloudinary.connected = connectionTest;
      } catch (error) {
        console.error('Cloudinary连接测试失败:', error);
        config.cloudinary.connected = false;
      }
    }
    
    res.json(config);
  } catch (error) {
    console.error('获取存储配置失败:', error);
    res.status(500).json({ error: '获取存储配置失败' });
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

// 获取收藏的艺术作品
app.get('/api/art/favorites', async (req, res) => {
  const { authorName } = req.query;
  
  if (!authorName) {
    return res.status(400).json({ error: '缺少作者姓名参数' });
  }

  try {
    const works = await Art.find({ 
      favorites: { $in: [authorName] } 
    }).sort({ createdAt: -1 });
    res.json(works);
  } catch (error) {
    console.error('获取收藏作品失败:', error);
    res.status(500).json({ error: '获取收藏作品失败' });
  }
});

// 获取喜欢的艺术作品
app.get('/api/art/likes', async (req, res) => {
  const { authorName } = req.query;
  
  if (!authorName) {
    return res.status(400).json({ error: '缺少作者姓名参数' });
  }

  try {
    const works = await Art.find({ 
      likedUsers: { $in: [authorName] } 
    }).sort({ createdAt: -1 });
    res.json(works);
  } catch (error) {
    console.error('获取喜欢作品失败:', error);
    res.status(500).json({ error: '获取喜欢作品失败' });
  }
});

// 删除艺术作品
app.delete('/api/art/:id', async (req, res) => {
  const { id } = req.params;
  const { authorName, isAdmin } = req.query;
  
  try {
    const art = await Art.findById(id);
    if (!art) return res.status(404).json({ error: '作品不存在' });
    
    // 检查权限：只有作者或管理员可以删除
    if (art.authorName !== authorName && isAdmin !== 'true') {
      return res.status(403).json({ error: '无权限删除此作品' });
    }
    
    await Art.findByIdAndDelete(id);
    res.json({ message: '作品删除成功' });
  } catch (error) {
    console.error('删除作品失败:', error);
    res.status(500).json({ error: '删除作品失败' });
  }
});

// 收藏/取消收藏艺术作品
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
    console.error('收藏操作失败:', error);
    res.status(500).json({ error: '操作失败' });
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
    console.log(`🔍 检查管理员状态: "${userName}"`);
    
    // 检查是否是李昌轩（固定管理员）- 支持多种格式
    const isLiChangxuan = userName === '李昌轩' || userName === '李昌轩' || userName.includes('李昌轩');
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

// 用户身份映射API - 根据姓名获取用户信息
app.get('/api/user/identity', async (req, res) => {
  const { name } = req.query;
  
  if (!name) {
    return res.status(400).json({ error: '缺少姓名参数' });
  }

  try {
    console.log(`🔍 查找用户身份: "${name}"`);
    
    // 检查是否是李昌轩（固定管理员）
    if (name === '李昌轩' || name.includes('李昌轩')) {
      return res.json({
        userId: '李昌轩',
        name: '李昌轩',
        class: 'NEE4',
        role: 'admin',
        isAdmin: true,
        isInitial: true
      });
    }
    
    // 从数据库查找用户
    const user = await User.findOne({ 
      $or: [
        { name: name },
        { userId: name }
      ]
    });
    
    if (user) {
      console.log(`✅ 找到用户: ${user.name} (${user.userId})`);
      return res.json({
        userId: user.userId || user.name,
        name: user.name,
        class: user.class || '未知',
        role: user.role || 'user',
        isAdmin: user.isAdmin || user.role === 'admin',
        isInitial: false
      });
    }
    
    console.log(`❌ 用户 "${name}" 不存在`);
    res.status(404).json({ error: '用户不存在' });
  } catch (error) {
    console.error('❌ 查找用户身份失败:', error);
    res.status(500).json({ error: '查找失败' });
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

// 删除反馈（管理员功能）
app.delete('/api/admin/feedback/:id', async (req, res) => {
  const { id } = req.params;
  const { adminName } = req.query;
  
  try {
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
app.get('/api/admin/users', async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) {
    console.error('获取管理员失败:', error);
    res.status(500).json({ error: '获取管理员失败' });
  }
});

// 手动创建用户（用于测试）
app.post('/api/admin/create-user', async (req, res) => {
  try {
    const { name, class: userClass } = req.body;
    
    if (!name || !userClass) {
      return res.status(400).json({ error: '缺少必要字段' });
    }
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ name });
    if (existingUser) {
      return res.json({ message: '用户已存在', user: existingUser });
    }
    
    // 创建新用户
    const user = await User.create({
      userId: name, // 使用姓名作为userId
      name: name,
      class: userClass,
      role: 'user',
      isAdmin: false
    });
    
    console.log(`✅ 手动创建用户成功: ${name}`);
    res.json({ message: '用户创建成功', user });
  } catch (error) {
    console.error('❌ 创建用户失败:', error);
    res.status(500).json({ error: '创建用户失败', details: error.message });
  }
});

// 测试端点：获取所有用户（用于调试）
app.get('/api/admin/debug-users', async (req, res) => {
  try {
    console.log('🔍 调试：获取所有用户');
    
    // 检查数据库连接
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ 
        error: '数据库未连接', 
        status: mongoose.connection.readyState 
      });
    }
    
    const users = await User.find({})
      .select('userId name class role isAdmin createdAt')
      .sort({ createdAt: -1 })
      .limit(50);
    
    console.log(`📊 找到 ${users.length} 个用户`);
    
    res.json({
      count: users.length,
      users: users.map(user => ({
        userId: user.userId || '',
        name: user.name,
        class: user.class || '未知',
        role: user.role || 'user',
        isAdmin: user.isAdmin || false,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    console.error('❌ 调试获取用户失败:', error);
    res.status(500).json({ 
      error: '获取用户失败', 
      details: error.message 
    });
  }
});

// 搜索用户
app.get('/api/admin/search-users', async (req, res) => {
  const { q } = req.query;
  
  console.log(`🔍 收到搜索请求: "${q}"`);
  
  if (!q || q.trim().length === 0) {
    console.log('❌ 搜索查询为空，返回空结果');
    return res.json([]);
  }

  try {
    // 检查数据库连接状态
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ 数据库未连接，状态:', mongoose.connection.readyState);
      return res.status(500).json({ error: '数据库连接失败' });
    }
    
    console.log(`✅ 数据库连接正常，开始搜索用户: "${q}"`);
    console.log(`🔍 搜索查询长度: ${q.length}, 编码: ${Buffer.from(q, 'utf8').toString('hex')}`);
    
    // 只从User集合中搜索注册用户
    const searchRegex = new RegExp(q.trim(), 'i');
    console.log(`🔍 搜索正则表达式: ${searchRegex}`);
    
    // 先获取所有用户进行调试
    const allUsers = await User.find({}).select('name').limit(5);
    console.log(`📊 数据库中前5个用户:`, allUsers.map(u => u.name));
    
    const users = await User.find({
      name: searchRegex
    })
    .select('userId name class role isAdmin createdAt')
    .limit(20)
    .sort({ createdAt: -1 }); // 按创建时间倒序
    
    console.log(`📊 数据库查询完成，找到 ${users.length} 个用户`);
    console.log(`📊 搜索结果:`, users.map(u => u.name));
    
    const result = users.map(user => ({
      userId: user.userId || '',
      name: user.name,
      class: user.class || '未知',
      role: user.role || 'user',
      isAdmin: user.isAdmin || false,
      createdAt: user.createdAt
    }));
    
    console.log(`✅ 搜索 "${q}" 成功，返回 ${result.length} 个结果:`, result.map(u => `${u.name}(${u.role})`));
    res.json(result);
  } catch (error) {
    console.error('❌ 搜索用户失败:', error);
    console.error('错误详情:', error.message);
    res.status(500).json({ 
      error: '搜索失败', 
      details: error.message,
      query: q 
    });
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
        userId: userName, // 使用用户名作为userId
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

// 设置管理员（兼容旧API）
app.post('/api/admin/set-admin', async (req, res) => {
  const { userId, adminName } = req.body;
  
  if (!userId || !adminName) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    // 检查操作者是否有权限
    const adder = await User.findOne({ name: adminName, role: 'admin' });
    if (!adder && adminName !== '李昌轩') {
      return res.status(403).json({ error: '无权限添加管理员' });
    }

    // 查找或创建用户
    let user = await User.findOne({ name: userId });
    if (!user) {
      user = await User.create({
        userId: userId, // 设置userId字段
        email: `${userId}@temp.com`,
        password: 'temp',
        name: userId,
        role: 'admin'
      });
    } else {
      user.role = 'admin';
      await user.save();
    }

    res.json({ message: '管理员设置成功', user });
  } catch (error) {
    console.error('设置管理员失败:', error);
    res.status(500).json({ error: '设置失败' });
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

// 创建活动
app.post('/api/activities', async (req, res) => {
  const { title, description, startDate, endDate, image, media, authorName, authorClass, authorAvatar } = req.body;
  
  if (!title || !description || !startDate || !endDate) {
    return res.status(400).json({ error: '请填写完整信息：标题、描述、开始时间、结束时间' });
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
      image: image || '',
      media: media || [],
      author: authorName,
      authorName,
      authorClass,
      authorAvatar: authorAvatar || '',
      likes: 0,
      likedUsers: [],
      favorites: [],
      comments: []
    });
    
    res.json(activity);
  } catch (error) {
    console.error('创建活动失败:', error);
    res.status(500).json({ error: '创建活动失败' });
  }
});

// 活动点赞/取消点赞
app.post('/api/activities/:id/like', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  
  try {
    const activity = await Activity.findById(id);
    if (!activity) return res.status(404).json({ error: '活动不存在' });
    
    if (!activity.likedUsers) activity.likedUsers = [];
    const idx = activity.likedUsers.indexOf(userId);
    
    if (idx !== -1) {
      activity.likedUsers.splice(idx, 1);
      activity.likes = Math.max((activity.likes || 1) - 1, 0);
    } else {
      activity.likedUsers.push(userId);
      activity.likes = (activity.likes || 0) + 1;
    }
    
    await activity.save();
    res.json(activity);
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

// 活动收藏/取消收藏
app.post('/api/activities/:id/favorite', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  
  try {
    const activity = await Activity.findById(id);
    if (!activity) return res.status(404).json({ error: '活动不存在' });
    
    if (!activity.favorites) activity.favorites = [];
    const idx = activity.favorites.indexOf(userId);
    
    if (idx !== -1) {
      activity.favorites.splice(idx, 1);
    } else {
      activity.favorites.push(userId);
    }
    
    await activity.save();
    res.json(activity);
  } catch (error) {
    console.error('收藏操作失败:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

// 活动评论
app.post('/api/activities/:id/comment', async (req, res) => {
  const { id } = req.params;
  const { author, authorClass, content, authorAvatar } = req.body;
  
  if (!author || !authorClass || !content) {
    return res.status(400).json({ error: '请填写完整信息' });
  }
  
  try {
    const activity = await Activity.findById(id);
    if (!activity) return res.status(404).json({ error: '活动不存在' });
    
    const comment = {
      id: Date.now().toString(),
      author,
      authorClass,
      content,
      authorAvatar: authorAvatar || '',
      createdAt: new Date()
    };
    
    if (!activity.comments) activity.comments = [];
    activity.comments.push(comment);
    await activity.save();
    
    res.json(activity);
  } catch (error) {
    console.error('添加评论失败:', error);
    res.status(500).json({ error: '添加评论失败' });
  }
});

// 删除活动
app.delete('/api/activities/:id', async (req, res) => {
  const { id } = req.params;
  const { authorName, isAdmin } = req.query;
  
  try {
    const activity = await Activity.findById(id);
    if (!activity) return res.status(404).json({ error: '活动不存在' });
    
    // 检查权限：只有作者或管理员可以删除
    if (activity.authorName !== authorName && isAdmin !== 'true') {
      return res.status(403).json({ error: '无权限删除此活动' });
    }
    
    await Activity.findByIdAndDelete(id);
    res.json({ message: '活动删除成功' });
  } catch (error) {
    console.error('删除活动失败:', error);
    res.status(500).json({ error: '删除活动失败' });
  }
});

// 获取我的活动
app.get('/api/activities/my-activities', async (req, res) => {
  const { authorName } = req.query;
  
  if (!authorName) {
    return res.status(400).json({ error: '缺少作者姓名参数' });
  }

  try {
    const activities = await Activity.find({ authorName }).sort({ createdAt: -1 });
    res.json(activities);
  } catch (error) {
    console.error('获取我的活动失败:', error);
    res.status(500).json({ error: '获取活动失败' });
  }
});

// 获取收藏的活动
app.get('/api/activities/favorites', async (req, res) => {
  const { authorName } = req.query;
  
  if (!authorName) {
    return res.status(400).json({ error: '缺少作者姓名参数' });
  }

  try {
    const activities = await Activity.find({ 
      favorites: { $in: [authorName] } 
    }).sort({ createdAt: -1 });
    res.json(activities);
  } catch (error) {
    console.error('获取收藏活动失败:', error);
    res.status(500).json({ error: '获取收藏活动失败' });
  }
});

// 获取喜欢的活动
app.get('/api/activities/likes', async (req, res) => {
  const { authorName } = req.query;
  
  if (!authorName) {
    return res.status(400).json({ error: '缺少作者姓名参数' });
  }

  try {
    const activities = await Activity.find({ 
      likedUsers: { $in: [authorName] } 
    }).sort({ createdAt: -1 });
    res.json(activities);
  } catch (error) {
    console.error('获取喜欢活动失败:', error);
    res.status(500).json({ error: '获取喜欢活动失败' });
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

// 维护模式相关API
// 获取维护状态
app.get('/api/admin/maintenance/status', async (req, res) => {
  try {
    // 这里可以从数据库或环境变量读取维护状态
    // 暂时返回默认状态
    res.json({
      maintenanceMode: false,
      maintenanceMessage: ''
    });
  } catch (error) {
    console.error('获取维护状态失败:', error);
    res.status(500).json({ error: '获取维护状态失败' });
  }
});

// 切换维护模式
app.post('/api/admin/maintenance/toggle', async (req, res) => {
  const { enabled, message, adminName } = req.body;
  
  if (!adminName) {
    return res.status(400).json({ error: '缺少管理员信息' });
  }

  try {
    // 检查操作者是否有权限
    const admin = await User.findOne({ name: adminName, role: 'admin' });
    if (!admin && adminName !== '李昌轩') {
      return res.status(403).json({ error: '无权限操作维护模式' });
    }

    // 这里可以将维护状态保存到数据库
    // 暂时返回成功状态
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

const PORT = process.env.PORT || 5000;

// 启动服务器
const server = app.listen(PORT, () => {
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

// 导出app用于Vercel
module.exports = app;
