// 配置文件
const config = {
  // 开发环境使用本地服务器，生产环境使用部署的服务器地址
  API_BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://platform-program-backend.onrender.com'  // 生产环境使用后端服务URL
    : 'http://localhost:5000',
};

export default config; 