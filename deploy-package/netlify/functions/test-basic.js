exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Basic test function working',
        timestamp: new Date().toISOString(),
        method: event.httpMethod,
        path: event.path,
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
        error: 'Test function failed',
        message: error.message
      })
    };
  }
};
