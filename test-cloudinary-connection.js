#!/usr/bin/env node

// 测试Cloudinary连接
const cloudinary = require('cloudinary').v2;

// 设置Cloudinary配置
cloudinary.config({
  cloud_name: 'dpilqeizp',
  api_key: '245415752342533',
  api_secret: 'F1yztt8X_DpVS_iXAnQaYi1zzb4'
});

console.log('☁️  测试Cloudinary连接...');
console.log('云名称:', cloudinary.config().cloud_name);
console.log('API密钥:', cloudinary.config().api_key ? '已设置' : '未设置');
console.log('API密钥长度:', cloudinary.config().api_secret ? cloudinary.config().api_secret.length : 0);

// 测试连接
async function testConnection() {
  try {
    console.log('');
    console.log('🔍 正在测试Cloudinary连接...');
    
    // 测试API连接
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary连接成功!');
    console.log('响应:', result);
    
    // 测试上传一个简单的文本文件
    console.log('');
    console.log('📤 测试文件上传...');
    
    const uploadResult = await cloudinary.uploader.upload('data:text/plain;base64,' + Buffer.from('Hello Cloudinary!').toString('base64'), {
      resource_type: 'raw',
      folder: 'platform-program-test',
      public_id: 'test-connection-' + Date.now()
    });
    
    console.log('✅ 文件上传成功!');
    console.log('文件URL:', uploadResult.secure_url);
    console.log('文件ID:', uploadResult.public_id);
    
    // 清理测试文件
    console.log('');
    console.log('🧹 清理测试文件...');
    const deleteResult = await cloudinary.uploader.destroy(uploadResult.public_id);
    console.log('✅ 测试文件已删除:', deleteResult.result);
    
    console.log('');
    console.log('🎉 Cloudinary连接测试完全成功!');
    console.log('您的Cloudinary配置正确，可以正常使用。');
    
  } catch (error) {
    console.log('❌ Cloudinary连接测试失败:');
    console.log('错误:', error.message);
    
    if (error.message.includes('Invalid API credentials')) {
      console.log('');
      console.log('💡 可能的原因:');
      console.log('1. API密钥或API密钥不正确');
      console.log('2. 云名称不正确');
      console.log('3. 账户权限问题');
    }
  }
}

testConnection();
