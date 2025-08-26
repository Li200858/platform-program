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
    
    const { q } = event.queryStringParameters || {};
    
    if (!q || !q.trim()) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: '搜索关键词不能为空' }) };
    }

    const searchQuery = q.trim();
    
    // 创建搜索条件
    const searchConditions = {
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { content: { $regex: searchQuery, $options: 'i' } },
        { category: { $regex: searchQuery, $options: 'i' } },
        { authorName: { $regex: searchQuery, $options: 'i' } }
      ]
    };

    const results = await ApprovedContent.find(searchConditions)
      .sort({ approvedAt: -1 })
      .limit(50);

    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ 
        results,
        total: results.length,
        query: searchQuery
      }) 
    };
  } catch (error) {
    console.error('Search error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: '搜索失败' }) };
  }
};
