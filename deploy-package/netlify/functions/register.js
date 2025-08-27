const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 设置CORS头
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// 连接MongoDB
const connectDB = async () => {
  try {
    // 验证环境变量
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI环境变量未设置');
    }
    
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
  role: { type: String, default: 'user' }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

exports.handler = async (event, context) => {
  // 处理OPTIONS预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers: corsHeaders,
      body: JSON.stringify({ error: '方法不允许' }) 
    };
  }

  try {
    await connectDB();
    
    // 验证请求体
    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: '请求体不能为空' })
      };
    }

    const { email, password } = JSON.parse(event.body);
    
    // 验证输入
    if (!email || !password) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: '邮箱和密码不能为空' })
      };
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: '邮箱格式不正确' })
      };
    }
    
    // 验证密码长度
    if (password.length < 6) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: '密码长度至少6位' })
      };
    }
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { 
        statusCode: 400, 
        headers: corsHeaders,
        body: JSON.stringify({ error: '用户已存在' }) 
      };
    }
    
    // 加密密码
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // 创建新用户
    const newUser = new User({
      email,
      password: hashedPassword,
      role: 'user'
    });
    
    await newUser.save();
    
    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        message: '注册成功',
        email: newUser.email
      })
    };
  } catch (error) {
    console.error('Register error:', error);
    
    // 根据错误类型返回不同的错误信息
    if (error.name === 'ValidationError') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: '数据验证失败' })
      };
    }
    
    if (error.name === 'MongoError' && error.code === 11000) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: '用户已存在' })
      };
    }
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: '服务器内部错误，请稍后重试' })
    };
  }
};
