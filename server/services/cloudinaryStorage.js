const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

class CloudinaryStorage {
  constructor() {
    this.cloudinary = cloudinary;
  }

  // 上传单个文件
  async uploadFile(file, options = {}) {
    try {
      console.log('📤 开始上传文件到Cloudinary:', {
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });

      // 构建上传选项
      const uploadOptions = {
        folder: 'platform-program',
        resource_type: 'auto', // 自动检测文件类型
        quality: 'auto', // 自动优化质量
        fetch_format: 'auto', // 自动选择最佳格式
        ...options
      };

      // 如果是图片，添加图片优化选项
      if (file.mimetype.startsWith('image/')) {
        uploadOptions.quality = 'auto:good';
        uploadOptions.fetch_format = 'auto';
      }

      // 创建可读流
      const stream = new Readable();
      stream.push(file.buffer);
      stream.push(null);

      // 上传到Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = this.cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary上传失败:', error);
              reject(error);
            } else {
              console.log('✅ Cloudinary上传成功:', {
                public_id: result.public_id,
                secure_url: result.secure_url,
                format: result.format,
                bytes: result.bytes
              });
              resolve(result);
            }
          }
        );
        
        stream.pipe(uploadStream);
      });

      return {
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height
      };

    } catch (error) {
      console.error('❌ 文件上传失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 批量上传文件
  async uploadFiles(files, options = {}) {
    const results = [];
    
    for (const file of files) {
      const result = await this.uploadFile(file, options);
      results.push(result);
    }
    
    return results;
  }

  // 删除文件
  async deleteFile(publicId) {
    try {
      console.log('🗑️  删除Cloudinary文件:', publicId);
      
      const result = await this.cloudinary.uploader.destroy(publicId);
      
      if (result.result === 'ok') {
        console.log('✅ 文件删除成功');
        return { success: true };
      } else {
        console.log('⚠️  文件删除失败:', result.result);
        return { success: false, error: result.result };
      }
    } catch (error) {
      console.error('❌ 删除文件失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取文件信息
  async getFileInfo(publicId) {
    try {
      const result = await this.cloudinary.api.resource(publicId);
      return {
        success: true,
        info: result
      };
    } catch (error) {
      console.error('❌ 获取文件信息失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 生成优化后的图片URL
  generateOptimizedUrl(publicId, options = {}) {
    const defaultOptions = {
      quality: 'auto:good',
      fetch_format: 'auto',
      ...options
    };

    return this.cloudinary.url(publicId, defaultOptions);
  }

  // 生成缩略图URL
  generateThumbnailUrl(publicId, width = 300, height = 300) {
    return this.cloudinary.url(publicId, {
      width,
      height,
      crop: 'fill',
      quality: 'auto:good',
      fetch_format: 'auto'
    });
  }
}

module.exports = CloudinaryStorage;
