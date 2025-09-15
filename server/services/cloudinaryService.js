const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// 配置Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// 配置multer用于Cloudinary上传
let storage;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  console.log('配置Cloudinary存储...');
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'platform-program',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'webm', 'ogg', 'mp3', 'wav', 'pdf', 'txt'],
      transformation: [
        { quality: 'auto' }, // 自动优化质量
        { fetch_format: 'auto' } // 自动选择最佳格式
      ]
    }
  });
  console.log('Cloudinary存储配置完成');
} else {
  console.log('使用本地存储...');
  // 回退到本地存储
  const path = require('path');
  const fs = require('fs');
  
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = 'uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `${uniqueSuffix}-${cleanName}`);
    }
  });
}

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    cb(null, true); // 允许所有文件类型
  }
});

// 生成文件URL
const getFileUrl = (publicId) => {
  if (publicId.startsWith('http')) {
    return publicId; // 已经是完整URL
  }
  
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    return cloudinary.url(publicId, {
      secure: true,
      quality: 'auto',
      fetch_format: 'auto'
    });
  } else {
    // 回退到本地URL
    return `/uploads/${publicId}`;
  }
};

// 删除文件
const deleteFile = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('删除Cloudinary文件失败:', error);
    return false;
  }
};

// 检查文件是否存在
const fileExists = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return !!result;
  } catch (error) {
    return false;
  }
};

// 获取文件信息
const getFileInfo = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return {
      exists: true,
      url: result.secure_url,
      format: result.format,
      size: result.bytes,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    return { exists: false };
  }
};

module.exports = {
  upload,
  getFileUrl,
  deleteFile,
  fileExists,
  getFileInfo,
  cloudinary
};
