const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// 连接MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

// 待审核内容模型
const pendingContentSchema = new mongoose.Schema({
  type: { type: String, required: true },
  category: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  media: [String],
  author: { type: String, required: true },
  authorName: String,
  authorAvatar: String,
  status: { type: String, default: 'pending' },
  reviewNote: String,
  reviewedBy: String,
  reviewedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const PendingContent = mongoose.models.PendingContent || mongoose.model('PendingContent', pendingContentSchema);

// 用户模型
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
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
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// 验证权限中间件
const verifyAuth = (event) => {
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

exports.handler = async (event, context) => {
  // 设置CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // 处理OPTIONS请求
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    console.log('Review content simple function started');
    await connectDB();
    console.log('Database connected successfully');
    
    // 验证用户身份
    const user = verifyAuth(event);
    if (!user) {
      console.log('User authentication failed');
      return { statusCode: 401, headers, body: JSON.stringify({ error: '未授权访问' }) };
    }
    console.log('User authenticated:', user.email);

    // 获取用户数据并验证管理员权限
    const userData = await User.findById(user.userId);
    if (!userData || !(userData.role === 'founder' || userData.role === 'admin')) {
      console.log('User permission denied:', userData?.role);
      return { statusCode: 403, headers, body: JSON.stringify({ error: '权限不足' }) };
    }
    console.log('User permission verified:', userData.role);

    // 获取内容ID和审核操作
    const contentId = event.path.split('/').pop();
    const { action, note } = JSON.parse(event.body);
    console.log('Review action:', { contentId, action, note });

    if (!['approve', 'reject'].includes(action)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: '无效的审核操作' }) };
    }

    // 查找待审核内容
    const pendingContent = await PendingContent.findById(contentId);
    if (!pendingContent) {
      console.log('Content not found:', contentId);
      return { statusCode: 404, headers, body: JSON.stringify({ error: '内容不存在' }) };
    }
    console.log('Content found:', pendingContent._id);

    // 更新审核状态
    pendingContent.status = action === 'approve' ? 'approved' : 'rejected';
    pendingContent.reviewNote = note || '';
    pendingContent.reviewedBy = userData.email;
    pendingContent.reviewedAt = new Date();

    await pendingContent.save();
    console.log('Content status updated successfully');

    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ 
        message: action === 'approve' ? '内容审核通过' : '内容已驳回',
        contentId: pendingContent._id,
        status: pendingContent.status
      }) 
    };
  } catch (error) {
    console.error('Review content error:', error);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ 
        error: '服务器错误',
        message: error.message
      }) 
    };
  }
};
