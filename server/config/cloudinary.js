const cloudinary = require('cloudinary').v2;

// 配置Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// 验证配置
const verifyCloudinaryConfig = () => {
  const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn('⚠️  Cloudinary配置不完整，缺少环境变量:', missing.join(', '));
    console.log('💡 请设置以下环境变量:');
    missing.forEach(key => console.log(`   - ${key}`));
    return false;
  }
  
  console.log('✅ Cloudinary配置完整');
  return true;
};

// 测试连接
const testCloudinaryConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary连接成功:', result);
    return true;
  } catch (error) {
    console.error('❌ Cloudinary连接失败:', error.message);
    return false;
  }
};

module.exports = {
  cloudinary,
  verifyCloudinaryConfig,
  testCloudinaryConnection
};
