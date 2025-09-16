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

// 导入路由
const artRoutes = require('./routes/art');
const activityRoutes = require('./routes/activities');
const feedbackRoutes = require('./routes/feedback');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

// 使用路由
app.use('/api/art', artRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// 健康检查端点
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

// 搜索功能
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json({ art: [] });
    }

    const Art = require('./models/Art');
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

// 文件上传API
const multer = require('multer');
const { cloudinary, verifyCloudinaryConfig } = require('./config/cloudinary');
const CloudinaryStorage = require('./services/cloudinaryStorage');

// 检查Cloudinary配置
const cloudinaryConfigured = verifyCloudinaryConfig();
let cloudinaryStorage = null;

if (cloudinaryConfigured) {
  cloudinaryStorage = new CloudinaryStorage();
  console.log('✅ Cloudinary配置完成，强制使用云存储');
} else {
  console.log('❌ Cloudinary配置不完整，文件上传功能将不可用');
}

// 配置multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10
  },
  fileFilter: (req, file, cb) => {
    console.log(`📁 文件上传: ${file.originalname}, 类型: ${file.mimetype}, 大小: ${file.size} bytes`);
    cb(null, true);
  }
});

app.post('/api/upload', upload.array('files', 5), async (req, res) => {
  try {
    console.log('📤 文件上传请求开始...');
    console.log('上传文件数量:', req.files ? req.files.length : 0);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '没有上传文件' });
    }
    
    let urls = [];
    let storageType = 'local';
    let totalSize = 0;
    
    if (cloudinaryConfigured && cloudinaryStorage) {
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
        
        const failedUploads = uploadResults.filter(result => !result.success);
        if (failedUploads.length > 0) {
          console.warn('⚠️  部分文件上传失败:', failedUploads);
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
        required: true
      },
      local: {
        configured: false,
        enabled: false
      },
      policy: {
        forceCloudinary: true,
        fallbackDisabled: true
      }
    };
    
    res.json(config);
  } catch (error) {
    console.error('获取存储配置失败:', error);
    res.status(500).json({ error: '获取存储配置失败' });
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
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
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
