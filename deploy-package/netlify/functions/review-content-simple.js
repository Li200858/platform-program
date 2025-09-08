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
const pendingContentSchema = new mongoose.Schema({
  type: { type: String, required: true },
  category: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  media: [String],
  author: { type: String, required: true },
  authorName: String,
  authorAvatar: String,
  status: { 
    type: String, 
    default: 'pending', 
    enum: ['pending', 'approved', 'rejected'] 
  },
  reviewNote: String,
  reviewedBy: String,
  reviewedAt: Date,
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
const PendingContent = mongoose.models.PendingContent || mongoose.model('PendingContent', pendingContentSchema);
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
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify({ error: message, ...(details && { details }) })
  };
};

const createSuccessResponse = (data, statusCode = 200) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify(data)
  };
};

exports.handler = async (event, context) => {
  // 处理OPTIONS请求
  if (event.httpMethod === 'OPTIONS') {
    return createSuccessResponse({}, 200);
  }

  if (event.httpMethod !== 'POST') {
    return createErrorResponse(405, '方法不被允许');
  }

  try {
    console.log('Review content function started');
    await connectDB();
    console.log('Database connected successfully');
    
    // 验证用户身份
    const user = verifyAuth(event);
    if (!user) {
      console.log('User authentication failed');
      return createErrorResponse(401, '未授权访问');
    }
    console.log('User authenticated:', user.email);

    // 获取用户数据并验证管理员权限
    const userData = await User.findById(user.userId).lean();
    if (!userData || !(userData.role === 'founder' || userData.role === 'admin')) {
      console.log('User permission denied:', userData?.role);
      return createErrorResponse(403, '权限不足');
    }
    console.log('User permission verified:', userData.role);

    // 获取内容ID和审核操作
    const contentId = event.path.split('/').pop();
    if (!contentId || contentId === 'review') {
      return createErrorResponse(400, '无效的内容ID');
    }

    if (!event.body) {
      return createErrorResponse(400, '请求体不能为空');
    }

    const { action, note = '' } = JSON.parse(event.body);
    console.log('Review action:', { contentId, action, note });

    if (!['approve', 'reject'].includes(action)) {
      return createErrorResponse(400, '无效的审核操作');
    }

    // 查找待审核内容
    const pendingContent = await PendingContent.findById(contentId);
    if (!pendingContent) {
      console.log('Content not found:', contentId);
      return createErrorResponse(404, '内容不存在');
    }
    console.log('Content found:', pendingContent._id);

    // 检查内容状态
    if (pendingContent.status !== 'pending') {
      return createErrorResponse(400, '内容已被审核过');
    }

    // 更新审核状态
    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewNote: note.trim(),
      reviewedBy: userData.email,
      reviewedAt: new Date(),
      updatedAt: new Date()
    };

    await PendingContent.findByIdAndUpdate(contentId, updateData);
    console.log('Content status updated successfully');

    return createSuccessResponse({
      message: action === 'approve' ? '内容审核通过' : '内容已驳回',
      contentId: pendingContent._id,
      status: updateData.status,
      reviewedBy: userData.email,
      reviewedAt: updateData.reviewedAt
    });

  } catch (error) {
    console.error('Review content error:', error);
    
    // 根据错误类型返回不同的错误信息
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return createErrorResponse(400, '数据验证失败', errors);
    }
    
    if (error.name === 'CastError') {
      return createErrorResponse(400, '无效的内容ID格式');
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