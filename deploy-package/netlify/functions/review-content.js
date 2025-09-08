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

// 已审核内容模型（用于存储通过的内容）
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
  originalContentId: String // 关联原始待审核内容
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

// 用户模型
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  name: String,
  class: String,
  avatar: String,
  bio: String,
  phone: String,
  studentId: String,
  major: String,
  grade: String,
  interests: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);


exports.handler = async (event, context) => {
  // 设置CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // 处理OPTIONS请求
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    await connectDB();
    
    // 验证用户身份和权限
    const user = verifyAuth(event);
    if (!user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: '未授权访问' }) };
    }

    // 获取用户数据并验证管理员权限
    const userData = await User.findById(user.userId);
    if (!userData || !(userData.role === 'founder' || userData.role === 'admin')) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: '权限不足' }) };
    }

    // 获取内容ID和审核操作
    const contentId = event.path.split('/').pop();
    const { action, note } = JSON.parse(event.body);

    if (!['approve', 'reject'].includes(action)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: '无效的审核操作' }) };
    }

    // 查找待审核内容
    const pendingContent = await PendingContent.findById(contentId);
    if (!pendingContent) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: '内容不存在' }) };
    }

    // 更新审核状态
    pendingContent.status = action === 'approve' ? 'approved' : 'rejected';
    pendingContent.reviewNote = note || '';
    pendingContent.reviewedBy = userData.email;
    pendingContent.reviewedAt = new Date();

    await pendingContent.save();

    // 如果审核通过，将内容移动到已审核内容表
    if (action === 'approve') {
      const approvedContent = new ApprovedContent({
        type: pendingContent.type,
        category: pendingContent.category,
        title: pendingContent.title,
        content: pendingContent.content,
        media: pendingContent.media,
        author: pendingContent.author,
        authorName: pendingContent.authorName,
        authorAvatar: pendingContent.authorAvatar,
        approvedAt: new Date(),
        approvedBy: userData.email,
        originalContentId: pendingContent._id
      });

      await approvedContent.save();
    }

    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ 
        message: action === 'approve' ? '内容审核通过' : '内容已驳回',
        contentId: pendingContent._id,
        status: pendingContent.status
      }) 
    };
  } catch (error) {
    console.error('Review content error:', error);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ 
        error: '服务器错误',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }) 
    };
  }
};
