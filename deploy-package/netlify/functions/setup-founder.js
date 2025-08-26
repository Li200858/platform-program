const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

exports.handler = async (event, context) => {
  // 设置CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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
    await connectDB();
    
    // 检查是否已经有创始人
    const existingFounder = await User.findOne({ role: 'founder' });
    if (existingFounder) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: '创始人已存在，无法重复设置' }) 
      };
    }

    // 获取请求数据
    const { email, password, name } = JSON.parse(event.body);

    if (!email || !password) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: '邮箱和密码不能为空' }) 
      };
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: '用户已存在' }) 
      };
    }

    // 加密密码
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 创建创始人用户
    const founder = new User({
      email,
      password: hashedPassword,
      role: 'founder',
      name: name || '创始人',
      createdAt: new Date()
    });

    await founder.save();

    return { 
      statusCode: 201, 
      headers, 
      body: JSON.stringify({ 
        message: '创始人账户创建成功',
        email: founder.email,
        role: founder.role,
        name: founder.name
      }) 
    };
  } catch (error) {
    console.error('Setup founder error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: '服务器错误' }) };
  }
};
