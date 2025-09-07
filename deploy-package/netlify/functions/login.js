const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
    // 验证JWT_SECRET环境变量
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET环境变量未设置');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: '服务器配置错误' })
      };
    }

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
    
    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      return { 
        statusCode: 400, 
        headers: corsHeaders,
        body: JSON.stringify({ error: '用户不存在' }) 
      };
    }
    
    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { 
        statusCode: 400, 
        headers: corsHeaders,
        body: JSON.stringify({ error: '密码错误' }) 
      };
    }
    
    // 检查是否为创始人邮箱，如果是则更新用户角色
    const founderEmails = process.env.FOUNDER_EMAILS ? process.env.FOUNDER_EMAILS.split(',').map(e => e.trim()) : [];
    const isFounderEmail = founderEmails.includes(email);
    
    if (isFounderEmail && user.role !== 'founder') {
      user.role = 'founder';
      await user.save();
      console.log(`创始人邮箱登录，已更新角色: ${email}`);
    }
    
    // 生成JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        token,
        email: user.email,
        role: user.role
      })
    };
  } catch (error) {
    console.error('Login error:', error);
    
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
