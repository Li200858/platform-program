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
  type: { type: String, required: true }, // study, art, activity, crosscampus
  category: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  media: [String], // 媒体文件URL数组
  author: { type: String, required: true }, // 作者邮箱
  authorName: String, // 作者姓名
  authorAvatar: String, // 作者头像
  status: { type: String, default: 'pending' }, // pending, approved, rejected
  reviewNote: String, // 审核备注
  reviewedBy: String, // 审核人
  reviewedAt: Date, // 审核时间
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

// 验证管理员权限
const verifyAdmin = async (user) => {
  if (!user || !user.userId) return false;
  
  try {
    const userData = await User.findById(user.userId);
    return userData && (userData.role === 'founder' || userData.role === 'admin');
  } catch (error) {
    console.error('Error verifying admin:', error);
    return false;
  }
};

exports.handler = async (event, context) => {
  // 设置CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // 处理OPTIONS请求
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    await connectDB();
    
    // 提交新内容
    if (event.httpMethod === 'POST') {
      const user = verifyAuth(event);
      if (!user) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: '未授权访问' }) };
      }

      const contentData = JSON.parse(event.body);
      const newContent = new PendingContent({
        ...contentData,
        author: user.email
      });

      await newContent.save();
      
      return { 
        statusCode: 201, 
        headers, 
        body: JSON.stringify({ 
          message: '内容提交成功，等待审核',
          contentId: newContent._id
        }) 
      };
    }

    // 获取待审核内容列表（管理员）
    if (event.httpMethod === 'GET') {
      const user = verifyAuth(event);
      if (!user) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: '未授权访问' }) };
      }

      if (!(await verifyAdmin(user))) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: '权限不足' }) };
      }

      const pendingContent = await PendingContent.find().sort({ createdAt: -1 });
      return { statusCode: 200, headers, body: JSON.stringify(pendingContent) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  } catch (error) {
    console.error('Pending content error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: '服务器错误' }) };
  }
};
