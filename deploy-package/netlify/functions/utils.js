// 通用工具函数

// 标准CORS头
exports.corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// 处理OPTIONS预检请求
exports.handleOptions = () => {
  return {
    statusCode: 200,
    headers: exports.corsHeaders,
    body: ''
  };
};

// 统一错误处理
exports.handleError = (error, context = '') => {
  console.error(`${context} error:`, error);
  
  // 根据错误类型返回不同的错误信息
  if (error.name === 'ValidationError') {
    return {
      statusCode: 400,
      headers: exports.corsHeaders,
      body: JSON.stringify({ error: '数据验证失败' })
    };
  }
  
  if (error.name === 'MongoError' && error.code === 11000) {
    return {
      statusCode: 400,
      headers: exports.corsHeaders,
      body: JSON.stringify({ error: '数据已存在' })
    };
  }
  
  if (error.name === 'CastError') {
    return {
      statusCode: 400,
      headers: exports.corsHeaders,
      body: JSON.stringify({ error: '无效的数据格式' })
    };
  }
  
  return {
    statusCode: 500,
    headers: exports.corsHeaders,
    body: JSON.stringify({ error: '服务器内部错误，请稍后重试' })
  };
};

// 验证请求体
exports.validateRequestBody = (event) => {
  if (!event.body) {
    return {
      statusCode: 400,
      headers: exports.corsHeaders,
      body: JSON.stringify({ error: '请求体不能为空' })
    };
  }
  
  try {
    return { data: JSON.parse(event.body) };
  } catch (error) {
    return {
      statusCode: 400,
      headers: exports.corsHeaders,
      body: JSON.stringify({ error: '请求体格式错误' })
    };
  }
};

// 验证邮箱格式
exports.validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 验证密码强度
exports.validatePassword = (password) => {
  return password && password.length >= 6;
};

// 验证必填字段
exports.validateRequiredFields = (data, requiredFields) => {
  const missing = requiredFields.filter(field => !data[field] || !data[field].toString().trim());
  if (missing.length > 0) {
    return {
      statusCode: 400,
      headers: exports.corsHeaders,
      body: JSON.stringify({ error: `缺少必填字段: ${missing.join(', ')}` })
    };
  }
  return null;
};
