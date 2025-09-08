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

// 待审核内容模型
const pendingContentSchema = new mongoose.Schema({
  type: { type: String, required: true },
  category: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  media: [String],
  author: { type: String, required: true },
  authorName: String,
  authorAvatar: String,
  status: { type: String, default: 'pending' },
  reviewNote: String,
  reviewedBy: String,
  reviewedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const PendingContent = mongoose.models.PendingContent || mongoose.model('PendingContent', pendingContentSchema);

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
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS'
  };

  // 处理OPTIONS请求
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    await connectDB();
    
    // 验证用户身份
    const user = verifyAuth(event);
    if (!user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: '未授权访问' }) };
    }

    const contentId = event.path.split('/').pop();
    
    // 获取内容详情
    if (event.httpMethod === 'GET') {
      const content = await PendingContent.findById(contentId);
      
      if (!content) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: '内容不存在' }) };
      }
      
      // 只能查看自己的内容
      if (content.author !== user.email) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: '权限不足' }) };
      }
      
      return { statusCode: 200, headers, body: JSON.stringify(content) };
    }

    // 删除内容
    if (event.httpMethod === 'DELETE') {
      const content = await PendingContent.findById(contentId);
      
      if (!content) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: '内容不存在' }) };
      }
      
      // 只能删除自己的内容
      if (content.author !== user.email) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: '权限不足' }) };
      }
      
      // 只能删除待审核或被驳回的内容
      if (content.status === 'approved') {
        return { statusCode: 400, headers, body: JSON.stringify({ error: '已审核通过的内容不能删除' }) };
      }
      
      await PendingContent.findByIdAndDelete(contentId);
      
      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ message: '内容删除成功' }) 
      };
    }

    // 更新内容
    if (event.httpMethod === 'PUT') {
      const content = await PendingContent.findById(contentId);
      
      if (!content) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: '内容不存在' }) };
      }
      
      // 只能编辑自己的内容
      if (content.author !== user.email) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: '权限不足' }) };
      }
      
      // 只能编辑待审核或被驳回的内容
      if (content.status === 'approved') {
        return { statusCode: 400, headers, body: JSON.stringify({ error: '已审核通过的内容不能修改' }) };
      }
      
      const updateData = JSON.parse(event.body);
      
      // 更新内容并重置审核状态
      const updatedContent = await PendingContent.findByIdAndUpdate(
        contentId,
        {
          ...updateData,
          status: 'pending', // 重新提交审核
          reviewNote: '', // 清除之前的审核备注
          reviewedBy: undefined,
          reviewedAt: undefined
        },
        { new: true, runValidators: true }
      );
      
      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ 
          message: '内容更新成功，已重新提交审核',
          content: updatedContent
        }) 
      };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  } catch (error) {
    console.error('Update content error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: '服务器错误' }) };
  }
};
