// 简化的启动测试脚本
console.log('开始测试启动...');

try {
  console.log('1. 加载基础模块...');
  const express = require('express');
  const cors = require('cors');
  const mongoose = require('mongoose');
  console.log('✓ 基础模块加载成功');

  console.log('2. 加载环境变量...');
  require('dotenv').config();
  console.log('✓ 环境变量加载成功');

  console.log('3. 测试Cloudinary服务...');
  const cloudinaryService = require('./services/cloudinaryService');
  console.log('✓ Cloudinary服务加载成功');

  console.log('4. 创建Express应用...');
  const app = express();
  app.use(cors());
  app.use(express.json());
  console.log('✓ Express应用创建成功');

  console.log('5. 添加健康检查端点...');
  app.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: 'OK',
      message: '测试服务器运行正常',
      timestamp: new Date().toISOString()
    });
  });
  console.log('✓ 健康检查端点添加成功');

  console.log('6. 启动服务器...');
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✓ 测试服务器运行在端口 ${PORT}`);
    console.log('✓ 所有测试通过！');
  });

} catch (error) {
  console.error('❌ 启动失败:', error);
  process.exit(1);
}
