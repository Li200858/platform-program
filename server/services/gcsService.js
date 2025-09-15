const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// 配置multer用于临时存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'temp-uploads';
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

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    cb(null, true); // 允许所有文件类型
  }
});

// 上传文件到Google Cloud Storage
const uploadToGCS = async (filePath, fileName) => {
  try {
    const bucketName = process.env.GCS_BUCKET_NAME;
    const accessToken = process.env.GCS_ACCESS_TOKEN;
    
    if (!bucketName || !accessToken) {
      throw new Error('GCS配置缺失');
    }

    const fileStream = fs.createReadStream(filePath);
    const formData = new FormData();
    formData.append('file', fileStream, {
      filename: fileName,
      contentType: getContentType(fileName)
    });

    const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=uploads/${fileName}`;
    
    const response = await axios.post(uploadUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    // 清理临时文件
    fs.unlinkSync(filePath);
    
    return {
      success: true,
      fileName: `uploads/${fileName}`,
      url: `https://storage.googleapis.com/${bucketName}/uploads/${fileName}`
    };
  } catch (error) {
    console.error('GCS上传失败:', error);
    // 清理临时文件
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return {
      success: false,
      error: error.message
    };
  }
};

// 获取文件URL
const getFileUrl = (fileName) => {
  if (fileName.startsWith('http')) {
    return fileName; // 已经是完整URL
  }
  const bucketName = process.env.GCS_BUCKET_NAME;
  return `https://storage.googleapis.com/${bucketName}/${fileName}`;
};

// 删除文件
const deleteFile = async (fileName) => {
  try {
    const bucketName = process.env.GCS_BUCKET_NAME;
    const accessToken = process.env.GCS_ACCESS_TOKEN;
    
    const deleteUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(fileName)}`;
    
    await axios.delete(deleteUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    return true;
  } catch (error) {
    console.error('GCS删除失败:', error);
    return false;
  }
};

// 检查文件是否存在
const fileExists = async (fileName) => {
  try {
    const bucketName = process.env.GCS_BUCKET_NAME;
    const accessToken = process.env.GCS_ACCESS_TOKEN;
    
    const checkUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(fileName)}`;
    
    await axios.get(checkUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    return true;
  } catch (error) {
    return false;
  }
};

// 获取文件内容类型
const getContentType = (fileName) => {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain'
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

module.exports = {
  upload,
  uploadToGCS,
  getFileUrl,
  deleteFile,
  fileExists
};
