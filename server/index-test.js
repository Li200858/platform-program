const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

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

// 测试艺术作品端点
app.get('/api/art', (req, res) => {
  res.json([
    {
      _id: 'test1',
      title: '测试作品1',
      content: '这是一个测试作品',
      author: '测试用户',
      tab: '绘画',
      likes: 0,
      createdAt: new Date()
    },
    {
      _id: 'test2', 
      title: '测试作品2',
      content: '这是另一个测试作品',
      author: '测试用户',
      tab: '摄影',
      likes: 5,
      createdAt: new Date()
    }
  ]);
});

// 测试发布作品端点
app.post('/api/art', (req, res) => {
  const { tab, title, content, authorName, authorClass } = req.body;
  
  if (!tab || !title || !content) {
    return res.status(400).json({ error: '请填写完整信息：分类、标题、内容' });
  }

  const newArt = {
    _id: 'test_' + Date.now(),
    tab,
    title,
    content,
    author: authorName || '匿名用户',
    authorName: authorName || '匿名用户',
    authorClass: authorClass || '未知班级',
    likes: 0,
    likedUsers: [],
    createdAt: new Date()
  };
  
  res.json(newArt);
});

// 测试点赞端点
app.post('/api/art/:id/like', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  
  res.json({
    _id: id,
    likes: Math.floor(Math.random() * 10),
    likedUsers: [userId || 'test_user']
  });
});

// 测试文件上传端点
app.post('/api/upload', (req, res) => {
  res.json({
    urls: ['/uploads/test-file.jpg'],
    storage: 'test'
  });
});

// 存储配置检查API
app.get('/api/storage-config', (req, res) => {
  res.json({
    storageType: 'test',
    cloudinary: {
      configured: false
    },
    local: {
      configured: true
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('测试服务器运行在端口', PORT);
});
