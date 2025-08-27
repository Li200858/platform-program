exports.handler = async (event, context) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // 处理OPTIONS预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: '方法不允许' })
    };
  }

  try {
    // 检查环境变量
    const envStatus = {
      MONGODB_URI: {
        exists: !!process.env.MONGODB_URI,
        value: process.env.MONGODB_URI ? '已设置' : '未设置',
        valid: process.env.MONGODB_URI && process.env.MONGODB_URI.includes('mongodb')
      },
      JWT_SECRET: {
        exists: !!process.env.JWT_SECRET,
        value: process.env.JWT_SECRET ? '已设置' : '未设置',
        valid: process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32
      }
    };

    // 尝试连接MongoDB
    let mongoStatus = '未测试';
    if (process.env.MONGODB_URI) {
      try {
        const mongoose = require('mongoose');
        await mongoose.connect(process.env.MONGODB_URI);
        mongoStatus = '连接成功';
        await mongoose.disconnect();
      } catch (err) {
        mongoStatus = `连接失败: ${err.message}`;
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: '环境变量检查完成',
        environment: process.env.NODE_ENV || 'production',
        timestamp: new Date().toISOString(),
        envStatus,
        mongoStatus,
        recommendations: [
          !envStatus.MONGODB_URI.exists && '请设置MONGODB_URI环境变量',
          !envStatus.JWT_SECRET.exists && '请设置JWT_SECRET环境变量',
          envStatus.MONGODB_URI.exists && !envStatus.MONGODB_URI.valid && 'MONGODB_URI格式不正确',
          envStatus.JWT_SECRET.exists && !envStatus.JWT_SECRET.valid && 'JWT_SECRET长度不足32位',
          mongoStatus.includes('连接失败') && 'MongoDB连接失败，请检查连接字符串'
        ].filter(Boolean)
      })
    };
  } catch (error) {
    console.error('Env check error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: '环境检查失败',
        details: error.message 
      })
    };
  }
};
