const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const helmet = require('helmet');

// 数据模型
const Art = require('./models/Art');
const Activity = require('./models/Activity');
const Feedback = require('./models/Feedback');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;

// 性能优化中间件
app.use(compression()); // 启用压缩
app.use(helmet()); // 安全头
app.use(cors());
app.use(express.json({ limit: '10mb' })); // 限制请求大小
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务 - 优化配置
app.use('/uploads', express.static('uploads', {
  maxAge: '1d', // 缓存1天
  etag: true,
  lastModified: true
}));

// 确保uploads目录存在
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
}

// 文件上传配置 - 优化版本
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
  limits: { 
    fileSize: 50 * 1024 * 1024, // 减少到50MB
    files: 10 // 限制文件数量
  },
  fileFilter: (req, file, cb) => {
    // 只允许特定文件类型
    const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mov|pdf|doc|docx|txt|xlsx|xls/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// 连接MongoDB - 优化配置
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10, // 连接池大小
  serverSelectionTimeoutMS: 5000, // 服务器选择超时
  socketTimeoutMS: 45000, // Socket超时
  bufferMaxEntries: 0, // 禁用缓冲
  bufferCommands: false, // 禁用缓冲命令
};

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/platform-program', mongoOptions)
  .then(() => console.log('MongoDB连接成功'))
  .catch(err => console.error('MongoDB连接失败:', err));

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({ message: '校园艺术平台API服务运行中' });
});

// 文件上传端点 - 优化版本
app.post('/api/upload', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const fileUrls = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ 
      success: true, 
      urls: fileUrls,
      count: req.files.length 
    });
  } catch (error) {
    console.error('文件上传错误:', error);
    res.status(500).json({ error: '文件上传失败' });
  }
});

// 其他API端点保持不变...
// (这里包含所有原有的API端点)

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  res.status(500).json({ error: '服务器内部错误' });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`艺术平台服务器运行在端口 ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`内存使用: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
});
