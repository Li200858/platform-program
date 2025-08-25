// 标准Vercel API路由
export default function handler(req, res) {
  res.status(200).json({ 
    message: 'API服务正常',
    timestamp: new Date().toISOString(),
    status: 'success'
  });
}
