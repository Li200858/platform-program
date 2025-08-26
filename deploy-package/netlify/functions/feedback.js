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

// 反馈模型
const feedbackSchema = new mongoose.Schema({
  content: { type: String, required: true },
  type: { type: String, default: 'general' }, // general, bug, feature, other
  author: { type: String, required: true }, // 用户邮箱
  authorName: String,
  status: { type: String, default: 'pending' }, // pending, processing, resolved
  response: String, // 管理员回复
  respondedBy: String, // 回复人
  respondedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);

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

// 验证管理员权限
const verifyAdmin = (user) => {
  return user && (user.role === 'founder' || user.role === 'admin');
};

exports.handler = async (event, context) => {
  // 设置CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS'
  };

  // 处理OPTIONS请求
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    await connectDB();
    
    // 提交反馈
    if (event.httpMethod === 'POST') {
      const user = verifyAuth(event);
      if (!user) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: '未授权访问' }) };
      }

      const feedbackData = JSON.parse(event.body);
      const newFeedback = new Feedback({
        ...feedbackData,
        author: user.email
      });

      await newFeedback.save();
      
      return { 
        statusCode: 201, 
        headers, 
        body: JSON.stringify({ 
          message: '反馈提交成功',
          feedbackId: newFeedback._id
        }) 
      };
    }

    // 获取反馈列表
    if (event.httpMethod === 'GET') {
      const user = verifyAuth(event);
      if (!user) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: '未授权访问' }) };
      }

      // 普通用户只能看到自己的反馈
      // 管理员可以看到所有反馈
      let query = {};
      if (!verifyAdmin(user)) {
        query.author = user.email;
      }

      const feedbacks = await Feedback.find(query).sort({ createdAt: -1 });
      return { statusCode: 200, headers, body: JSON.stringify(feedbacks) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  } catch (error) {
    console.error('Feedback error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: '服务器错误' }) };
  }
};
