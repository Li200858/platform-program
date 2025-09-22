const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(express.json());

// 确保端口正确
console.log(`环境变量 PORT: ${process.env.PORT}`);
console.log(`使用端口: ${PORT}`);

// 健康检查
app.get('/health', (req, res) => {
  console.log('健康检查请求');
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT,
    nodeEnv: process.env.NODE_ENV,
    message: '服务运行正常，但数据库连接失败'
  });
});

// 根路径
app.get('/', (req, res) => {
  console.log('根路径请求');
  res.json({ 
    message: '校园艺术平台API服务运行中',
    timestamp: new Date().toISOString(),
    port: PORT,
    nodeEnv: process.env.NODE_ENV,
    status: '数据库连接失败，请检查MONGODB_URI环境变量'
  });
});

// 测试API端点
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API测试成功',
    timestamp: new Date().toISOString(),
    status: 'OK'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('测试服务器运行在端口', PORT);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
  console.log(`根路径: http://localhost:${PORT}/`);
  console.log('注意：此版本不连接数据库，仅用于测试服务器配置');
});
