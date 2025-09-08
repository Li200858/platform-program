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

// 用户模型
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  name: String,
  class: String,
  createdAt: { type: Date, default: Date.now }
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
    
    // 验证用户身份
    const user = verifyAuth(event);
    if (!user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: '未授权访问' }) };
    }

    // 获取用户数据并验证管理员权限
    const userData = await User.findById(user.userId);
    if (!userData || !(userData.role === 'founder' || userData.role === 'admin')) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: '权限不足' }) };
    }

    // 获取用户列表
    if (event.httpMethod === 'GET' && !event.queryStringParameters) {
      const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
      return { statusCode: 200, headers, body: JSON.stringify(users) };
    }

    // 搜索用户
    if (event.httpMethod === 'GET' && event.queryStringParameters?.email) {
      const { email } = event.queryStringParameters;
      const foundUser = await User.findOne({ email }, { password: 0 });
      
      if (!foundUser) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: '用户不存在' }) };
      }
      
      return { statusCode: 200, headers, body: JSON.stringify(foundUser) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  } catch (error) {
    console.error('Users API error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: '服务器错误' }) };
  }
};
