const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

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
  originalContentId: String,
  likes: { type: Number, default: 0 },
  likedBy: [String] // 点赞用户邮箱数组
});

const ApprovedContent = mongoose.models.ApprovedContent || mongoose.model('ApprovedContent', approvedContentSchema);

// 验证权限中间件
const verifyAuth = (event) => {
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

exports.handler = async (event, context) => {
  // 设置CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // 处理OPTIONS请求
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    await connectDB();
    
    // 获取艺术板块内容
    if (event.httpMethod === 'GET') {
      const { tab, sort } = event.queryStringParameters || {};
      
      let query = { type: 'art' };
      if (tab && tab !== 'all') {
        query.category = tab;
      }
      
      let sortOption = { approvedAt: -1 };
      if (sort === 'hot') {
        sortOption = { likes: -1, approvedAt: -1 };
      }

      const artContent = await ApprovedContent.find(query).sort(sortOption);

      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ 
          content: artContent,
          total: artContent.length
        }) 
      };
    }

    // 点赞功能
    if (event.httpMethod === 'POST' && event.path.includes('/like')) {
      const user = verifyAuth(event);
      if (!user) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: '未授权访问' }) };
      }

      const contentId = event.path.split('/').pop();
      const content = await ApprovedContent.findById(contentId);
      
      if (!content) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: '内容不存在' }) };
      }

      // 检查用户是否已经点赞
      const hasLiked = content.likedBy.includes(user.email);
      
      if (hasLiked) {
        // 取消点赞
        content.likes = Math.max(0, content.likes - 1);
        content.likedBy = content.likedBy.filter(email => email !== user.email);
      } else {
        // 添加点赞
        content.likes += 1;
        content.likedBy.push(user.email);
      }

      await content.save();

      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ 
          message: hasLiked ? '取消点赞成功' : '点赞成功',
          likes: content.likes,
          hasLiked: !hasLiked
        }) 
      };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  } catch (error) {
    console.error('Art error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: '服务器错误' }) };
  }
};
