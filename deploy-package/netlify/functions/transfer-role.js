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

// 验证创始人权限
const verifyFounder = async (user) => {
  if (!user || !user.userId) return false;
  
  try {
    const userData = await User.findById(user.userId);
    return userData && userData.role === 'founder';
  } catch (error) {
    console.error('Error verifying founder:', error);
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

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    await connectDB();
    
    // 验证用户身份
    const user = verifyAuth(event);
    if (!user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: '未授权访问' }) };
    }

    // 获取用户数据并验证创始人权限
    const userData = await User.findById(user.userId);
    if (!userData || userData.role !== 'founder') {
      return { statusCode: 403, headers, body: JSON.stringify({ error: '只有创始人可以转让权限' }) };
    }

    // 获取用户ID和新的角色
    const userId = event.path.split('/').pop();
    const { newRole } = JSON.parse(event.body);

    // 验证新角色是否有效
    if (!['founder', 'admin', 'user'].includes(newRole)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: '无效的角色' }) };
    }

    // 查找目标用户
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: '用户不存在' }) };
    }

    // 如果转让创始人权限，需要特殊处理
    if (newRole === 'founder') {
      // 当前创始人降级为管理员
      await User.findByIdAndUpdate(user.userId, { role: 'admin' });
      // 目标用户升级为创始人
      await User.findByIdAndUpdate(userId, { role: 'founder' });
      
      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ 
          message: '创始人权限转让成功',
          newFounder: targetUser.email,
          oldFounder: user.email
        }) 
      };
    } else {
      // 普通权限转让
      await User.findByIdAndUpdate(userId, { role: newRole });
      
      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ 
          message: '权限转让成功',
          user: targetUser.email,
          newRole: newRole
        }) 
      };
    }
  } catch (error) {
    console.error('Transfer role error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: '服务器错误' }) };
  }
};
