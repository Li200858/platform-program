const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查端点 - 不依赖MongoDB
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    message: '艺术平台API服务运行正常',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    file: 'index-health.js'
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({ 
    message: '艺术平台API服务运行中',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// 测试端点
app.get('/api/test', (req, res) => {
  res.json({
    message: '测试端点工作正常',
    timestamp: new Date().toISOString(),
    file: 'index-health.js'
  });
});

// 环境变量检查端点
app.get('/api/env-check', (req, res) => {
  res.json({
    message: '环境变量检查',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      MONGODB_URI: process.env.MONGODB_URI ? '已设置' : '未设置',
      MONGODB_URI_LENGTH: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0
    }
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('艺术平台服务器运行在端口', PORT);
  console.log('健康检查端点: /api/health');
  console.log('测试端点: /api/test');
});
