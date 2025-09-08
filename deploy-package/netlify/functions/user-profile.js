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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS'
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

    // 获取用户信息
    if (event.httpMethod === 'GET') {
      // 检查是否是个人信息完善检查请求
      if (event.path === '/api/user-profile-complete') {
        const userData = await User.findById(user.userId, { password: 0 });
        if (!userData) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: '用户不存在' }) };
        }
        
        // 检查个人信息是否完善（头像不是必填项）
        const requiredFields = ['name', 'class'];
        const missingFields = requiredFields.filter(field => !userData[field] || userData[field].trim() === '');
        
        const isComplete = missingFields.length === 0;
        const message = isComplete 
          ? '个人信息已完善' 
          : `请完善以下信息：${missingFields.join('、')}`;
        
        return { 
          statusCode: 200, 
          headers, 
          body: JSON.stringify({ 
            isComplete, 
            message,
            missingFields,
            user: userData
          }) 
        };
      }
      
      // 普通获取用户信息
      const userData = await User.findById(user.userId, { password: 0 });
      if (!userData) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: '用户不存在' }) };
      }
      
      return { statusCode: 200, headers, body: JSON.stringify(userData) };
    }

    // 更新用户信息
    if (event.httpMethod === 'PUT' || event.httpMethod === 'POST') {
      const updateData = JSON.parse(event.body);
      
      // 移除敏感字段
      delete updateData.password;
      delete updateData.role;
      delete updateData.email;
      
      updateData.updatedAt = new Date();
      
      const updatedUser = await User.findByIdAndUpdate(
        user.userId, 
        updateData, 
        { new: true, runValidators: true }
      ).select('-password');
      
      return { statusCode: 200, headers, body: JSON.stringify(updatedUser) };
    }

    // 检查个人信息是否完善
    if (event.httpMethod === 'POST' && event.path.includes('profile-complete')) {
      const userData = await User.findById(user.userId);
      if (!userData) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: '用户不存在' }) };
      }
      
      // 检查必要字段
      const requiredFields = ['name', 'class'];
      const missingFields = requiredFields.filter(field => !userData[field]);
      
      if (missingFields.length > 0) {
        return { 
          statusCode: 200, 
          headers, 
          body: JSON.stringify({ 
            isComplete: false, 
            message: `请完善以下信息：${missingFields.join('、')}`,
            missingFields 
          }) 
        };
      }
      
      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ 
          isComplete: true, 
          message: '个人信息已完善' 
        }) 
      };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  } catch (error) {
    console.error('User profile error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: '服务器错误' }) };
  }
};
