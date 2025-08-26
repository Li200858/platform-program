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
  role: { type: String, default: 'user' }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    await connectDB();
    
    const { email, password } = JSON.parse(event.body);
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { statusCode: 400, body: JSON.stringify({ error: '用户已存在' }) };
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
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        message: '注册成功',
        email: newUser.email
      })
    };
  } catch (error) {
    console.error('Register error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '服务器错误' })
    };
  }
};
