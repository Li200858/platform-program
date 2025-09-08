exports.handler = async (event, context) => {
  // 设置CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // 处理OPTIONS请求
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    // 获取路径信息
    const path = event.path;
    const contentId = path.split('/').pop();
    
    // 获取请求体
    const body = event.body ? JSON.parse(event.body) : {};
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Test review function working',
        path: path,
        contentId: contentId,
        method: event.httpMethod,
        body: body,
        headers: event.headers,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Test function failed',
        message: error.message,
        path: event.path
      })
    };
  }
};
