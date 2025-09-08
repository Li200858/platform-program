const mongoose = require('mongoose');

// 连接MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

// 已审核内容模型
const approvedContentSchema = new mongoose.Schema({
  type: { type: String, required: true },
  category: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  media: [String],
  author: { type: String, required: true },
  authorName: String,
  authorAvatar: String,
  approvedAt: { type: Date, default: Date.now },
  approvedBy: String,
  originalContentId: String
});

const ApprovedContent = mongoose.models.ApprovedContent || mongoose.model('ApprovedContent', approvedContentSchema);

exports.handler = async (event, context) => {
  // 设置CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // 处理OPTIONS请求
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    await connectDB();
    
    const { tab } = event.queryStringParameters || {};
    
    let query = { type: 'study' };
    if (tab && tab !== 'all') {
      query.category = tab;
    }

    // 获取学习板块的已审核内容
    const studyContent = await ApprovedContent.find(query).sort({ approvedAt: -1 });

    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify(studyContent) 
    };
  } catch (error) {
    console.error('Study error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: '获取内容失败' }) };
  }
};
