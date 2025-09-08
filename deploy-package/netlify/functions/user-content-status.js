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
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // 处理OPTIONS请求
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    await connectDB();
    
    // 验证用户身份
    const user = verifyAuth(event);
    if (!user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: '未授权访问' }) };
    }

    // 获取用户的所有内容状态
    const userContent = await PendingContent.find({ 
      author: user.email 
    }).sort({ createdAt: -1 });

    // 按状态分组内容
    const pending = userContent.filter(c => c.status === 'pending');
    const approved = userContent.filter(c => c.status === 'approved');
    const rejected = userContent.filter(c => c.status === 'rejected');

    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ 
        pending,
        approved,
        rejected
      }) 
    };
  } catch (error) {
    console.error('User content status error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: '获取内容状态失败' }) };
  }
};
