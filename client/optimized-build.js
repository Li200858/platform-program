// 前端构建优化配置
const path = require('path');

module.exports = {
  // 生产环境优化
  mode: 'production',
  
  // 代码分割
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  
  // 压缩配置
  compression: {
    algorithm: 'gzip',
    threshold: 10240,
    minRatio: 0.8,
  },
  
  // 缓存配置
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
  },
};
