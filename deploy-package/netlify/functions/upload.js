const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = '/tmp/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件类型过滤
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/ogg',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  }
});

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
    // 注意：Netlify Functions中处理文件上传需要特殊处理
    // 这里我们返回一个模拟的上传成功响应
    // 在实际部署中，你可能需要使用云存储服务（如AWS S3、Cloudinary等）
    
    const mockFileUrl = `https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=Uploaded+File`;
    
    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ 
        url: mockFileUrl,
        message: '文件上传成功（演示模式）',
        filename: 'uploaded-file.jpg',
        size: '1.2MB'
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
