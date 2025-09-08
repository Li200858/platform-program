exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

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
        message: 'Simple review test function working',
        path: path,
        contentId: contentId,
        method: event.httpMethod,
        body: body,
        timestamp: new Date().toISOString(),
        env: {
          MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not Set',
          JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not Set'
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Simple test function failed',
        message: error.message,
        path: event.path
      })
    };
  }
};
