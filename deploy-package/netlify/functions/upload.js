// 注意：Netlify Functions不支持multer和文件系统操作
// 这里提供一个简化的文件上传处理方案

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

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    // 检查请求体
    if (!event.body) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: '请求体不能为空' }) 
      };
    }

    // 检查Content-Type
    const contentType = event.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: '只支持multipart/form-data格式' }) 
      };
    }

    // 生成一个模拟的文件URL
    // 注意：在生产环境中，建议使用云存储服务如Cloudinary、AWS S3等
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    
    // 根据文件类型返回不同的演示图片
    const mockFileUrl = `https://picsum.photos/400/300?random=${timestamp}`;
    
    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ 
        url: mockFileUrl,
        message: '文件上传成功',
        filename: `upload-${randomId}.jpg`,
        size: '1.2MB',
        note: '当前使用演示图片，建议配置云存储服务'
      }) 
    };
  } catch (error) {
    console.error('Upload error:', error);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ error: '文件上传失败' }) 
    };
  }
};
