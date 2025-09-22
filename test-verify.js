const fs = require('fs');
const http = require('http');

// 测试文件访问
function testFileAccess(fileUrl) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/uploads${fileUrl}`,
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ 
          status: res.statusCode, 
          content: data,
          headers: res.headers
        });
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function verifyTest() {
  console.log('🔍 验证文件是否在重新部署后仍然存在...\n');
  
  try {
    // 读取测试信息
    if (!fs.existsSync('./test-info.json')) {
      console.log('❌ 未找到测试信息文件，请先运行 node test-simple.js');
      return;
    }
    
    const testInfo = JSON.parse(fs.readFileSync('./test-info.json', 'utf8'));
    console.log('📄 测试文件信息:');
    console.log('   - 上传时间:', testInfo.uploadTime);
    console.log('   - 文件URL:', testInfo.fileUrl);
    console.log('   - 完整URL:', testInfo.fullUrl);
    console.log('   - 原始内容:', testInfo.content);
    
    console.log('\n🧪 测试文件访问...');
    const accessResult = await testFileAccess(testInfo.fileUrl);
    
    if (accessResult.status === 200) {
      console.log('✅ 文件仍然可以访问！');
      console.log('📄 当前文件内容:', accessResult.content);
      
      if (accessResult.content === testInfo.content) {
        console.log('🎉 文件内容完全一致！');
        console.log('✅ 重新部署后文件没有丢失！');
      } else {
        console.log('⚠️  文件内容不一致，可能有问题');
      }
    } else if (accessResult.status === 404) {
      console.log('❌ 文件不存在 (404)');
      console.log('💡 可能的原因:');
      console.log('   1. 持久化存储未正确配置');
      console.log('   2. 文件路径配置错误');
      console.log('   3. 服务器重启时文件被清理');
    } else {
      console.log('❌ 文件访问失败，状态码:', accessResult.status);
      console.log('📄 响应内容:', accessResult.content);
    }
    
    // 检查uploads目录
    console.log('\n📁 检查本地uploads目录...');
    if (fs.existsSync('./uploads')) {
      const files = fs.readdirSync('./uploads');
      console.log('📄 uploads目录文件数量:', files.length);
      if (files.length > 0) {
        console.log('📄 文件列表:', files.slice(0, 5));
      }
    } else {
      console.log('❌ uploads目录不存在');
    }
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  }
}

verifyTest();
