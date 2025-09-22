// 性能监控脚本
const https = require('https');
const http = require('http');

const checkPerformance = async (url) => {
  const start = Date.now();
  
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      const end = Date.now();
      const responseTime = end - start;
      
      console.log(`✅ ${url} - 响应时间: ${responseTime}ms`);
      console.log(`📊 状态码: ${res.statusCode}`);
      console.log(`📦 内容长度: ${res.headers['content-length'] || '未知'}`);
      
      resolve({
        url,
        responseTime,
        statusCode: res.statusCode,
        contentLength: res.headers['content-length']
      });
    }).on('error', (err) => {
      console.error(`❌ ${url} - 错误: ${err.message}`);
      reject(err);
    });
  });
};

// 监控多个端点
const monitorEndpoints = async () => {
  const endpoints = [
    'https://your-app.onrender.com/health',
    'https://your-app.onrender.com/api/arts',
    'https://your-app.onrender.com/'
  ];
  
  console.log('🚀 开始性能监控...');
  
  for (const endpoint of endpoints) {
    try {
      await checkPerformance(endpoint);
    } catch (error) {
      console.error(`监控失败: ${endpoint}`);
    }
  }
  
  console.log('✅ 性能监控完成');
};

// 运行监控
if (require.main === module) {
  monitorEndpoints();
}

module.exports = { checkPerformance, monitorEndpoints };
