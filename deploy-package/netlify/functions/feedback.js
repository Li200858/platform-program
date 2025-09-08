const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// 优化的数据库连接
let cachedConnection = null;
const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }
  
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    cachedConnection = mongoose.connection;
    console.log('MongoDB connected successfully');
    return cachedConnection;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

// 优化的模型定义
const feedbackSchema = new mongoose.Schema({
  content: { type: String, required: true, trim: true },
  type: { type: String, default: 'general' },
  category: { type: String, required: true },
  author: { type: String, required: true },
  authorName: String,
  authorAvatar: String,
  media: [String],
  status: { type: String, default: 'pending', enum: ['pending', 'processing', 'resolved'] },
  response: String,
  respondedBy: String,
  respondedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user', enum: ['user', 'admin', 'founder'] },
  name: String,
  class: String,
  avatar: String,
  bio: String,
  phone: String,
  studentId: String,
  major: String,
  grade: String,
  interests: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// 使用缓存模型
const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);

// 优化的认证函数
const verifyAuth = (event) => {
  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Auth verification failed:', error.message);
    return null;
  }
};

// 优化的错误处理
const createErrorResponse = (statusCode, message, details = null) => {
  const response = {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify({ error: message, ...(details && { details }) })
  };
  return response;
};

const createSuccessResponse = (data, statusCode = 200) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify(data)
  };
};

exports.handler = async (event, context) => {
  // 处理OPTIONS请求
  if (event.httpMethod === 'OPTIONS') {
    return createSuccessResponse({}, 200);
  }

  try {
    await connectDB();
    
    // 验证用户身份
    const user = verifyAuth(event);
    if (!user) {
      return createErrorResponse(401, '未授权访问');
    }

    // 获取用户数据
    const userData = await User.findById(user.userId).lean();
    if (!userData) {
      return createErrorResponse(404, '用户不存在');
    }

    // 处理GET请求 - 获取反馈列表
    if (event.httpMethod === 'GET') {
      let query = {};
      
      // 普通用户只能看到自己的反馈，管理员可以看到所有反馈
      if (!(userData.role === 'founder' || userData.role === 'admin')) {
        query.author = userData.email;
      }

      const feedbacks = await Feedback.find(query)
        .sort({ createdAt: -1 })
        .limit(100) // 限制返回数量提高性能
        .lean();
      
      return createSuccessResponse(feedbacks);
    }

    // 处理POST请求 - 创建新反馈
    if (event.httpMethod === 'POST') {
      if (!event.body) {
        return createErrorResponse(400, '请求体不能为空');
      }

      const { content, category, media = [] } = JSON.parse(event.body);
      
      if (!content || !content.trim()) {
        return createErrorResponse(400, '反馈内容不能为空');
      }

      if (!category) {
        return createErrorResponse(400, '分类不能为空');
      }

      const feedback = new Feedback({
        content: content.trim(),
        category,
        author: userData.email,
        authorName: userData.name,
        authorAvatar: userData.avatar,
        media: Array.isArray(media) ? media : []
      });

      await feedback.save();
      
      return createSuccessResponse({
        message: '反馈提交成功',
        feedbackId: feedback._id
      }, 201);
    }

    return createErrorResponse(405, '方法不被允许');

  } catch (error) {
    console.error('Feedback API error:', error);
    
    // 根据错误类型返回不同的错误信息
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return createErrorResponse(400, '数据验证失败', errors);
    }
    
    if (error.name === 'MongoError' && error.code === 11000) {
      return createErrorResponse(400, '数据已存在');
    }
    
    if (error.name === 'JsonWebTokenError') {
      return createErrorResponse(401, '无效的认证令牌');
    }
    
    if (error.name === 'TokenExpiredError') {
      return createErrorResponse(401, '认证令牌已过期');
    }
    
    return createErrorResponse(500, '服务器内部错误');
  }
};