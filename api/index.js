// Vercel API路由文件
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const CrossCampus = require('../server/models/CrossCampus');
const Study = require('../server/models/Study');
const Art = require('../server/models/Art');
const Activity = require('../server/models/Activity');
const PendingContent = require('../server/models/PendingContent');
const User = require('../server/models/User');
const Feedback = require('../server/models/Feedback');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 连接MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('MONGODB_URI 环境变量未设置');
      return;
    }
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000
    });
    
    console.log('MongoDB连接成功');
  } catch (err) {
    console.error('MongoDB连接失败:', err.message);
  }
};

// 启动数据库连接
connectDB();

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

// 测试接口
app.get('/', (req, res) => {
  res.json({ message: 'API服务已启动' });
});

// 注册接口
app.post('/register', async (req, res) => {
  const { email, password, name, age, class: userClass, avatar } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码必填' });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: '邮箱已被注册' });
    }
    
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
    console.error('注册错误:', e);
    res.status(500).json({ error: `注册失败: ${e.message}` });
  }
});

// 登录接口
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: '用户不存在' });
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: '密码错误' });
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '7d' });
  res.json({ token, email: user.email, role: user.role });
});

// 获取用户信息
app.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.userId).select('-password');
  res.json(user);
});

// 其他API接口...
app.get('/study', async (req, res) => {
  try {
    const { tab } = req.query;
    const filter = tab ? { tab } : {};
    const list = await Study.find(filter).sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: '获取学习内容失败' });
  }
});

app.get('/art', async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: '获取艺术作品失败' });
  }
});

// 导出为Vercel函数
module.exports = app;
