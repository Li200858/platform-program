// 艺术作品路由
const express = require('express');
const router = express.Router();
const Art = require('../models/Art');

// 获取艺术作品列表
router.get('/', async (req, res) => {
  try {
    const { tab, sort } = req.query;
    const filter = tab ? { tab } : {};
    let query = Art.find(filter);
    
    if (sort === 'hot') {
      query = query.sort({ likes: -1, createdAt: -1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }
    
    const posts = await query;
    res.json(posts);
  } catch (error) {
    console.error('获取艺术作品失败:', error);
    res.status(500).json({ error: '获取作品失败' });
  }
});

// 发布艺术作品
router.post('/', async (req, res) => {
  try {
    const { tab, title, content, media, authorName, authorClass } = req.body;
    
    // 验证必填字段
    if (!tab || !title || !content) {
      return res.status(400).json({ error: '请填写完整信息：分类、标题、内容' });
    }

    if (!authorName || !authorClass) {
      return res.status(400).json({ error: '请先在个人信息页面填写姓名和班级信息' });
    }
    
    const post = await Art.create({
      tab,
      title,
      content,
      author: authorName,
      authorName,
      authorClass,
      media: media || [],
      likes: 0,
      likedUsers: []
    });
    
    res.json(post);
  } catch (error) {
    console.error('发布失败:', error);
    res.status(500).json({ error: '发布失败' });
  }
});

// 点赞/取消点赞
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const art = await Art.findById(id);
    if (!art) return res.status(404).json({ error: '作品不存在' });
    
    if (!art.likedUsers) art.likedUsers = [];
    const idx = art.likedUsers.indexOf(userId);
    
    if (idx !== -1) {
      art.likedUsers.splice(idx, 1);
      art.likes = Math.max((art.likes || 1) - 1, 0);
    } else {
      art.likedUsers.push(userId);
      art.likes = (art.likes || 0) + 1;
    }
    
    await art.save();
    res.json(art);
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

// 收藏/取消收藏
router.post('/:id/favorite', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const art = await Art.findById(id);
    if (!art) return res.status(404).json({ error: '作品不存在' });
    
    if (!art.favorites) art.favorites = [];
    const idx = art.favorites.indexOf(userId);
    
    if (idx !== -1) {
      art.favorites.splice(idx, 1);
    } else {
      art.favorites.push(userId);
    }
    
    await art.save();
    res.json(art);
  } catch (error) {
    console.error('收藏操作失败:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

// 添加评论
router.post('/:id/comment', async (req, res) => {
  try {
    const { id } = req.params;
    const { author, authorClass, content } = req.body;
    
    if (!author || !authorClass || !content) {
      return res.status(400).json({ error: '请填写完整信息' });
    }
    
    const art = await Art.findById(id);
    if (!art) return res.status(404).json({ error: '作品不存在' });
    
    const comment = {
      id: Date.now().toString(),
      author,
      authorClass,
      content,
      createdAt: new Date()
    };
    
    art.comments.push(comment);
    await art.save();
    
    res.json(art);
  } catch (error) {
    console.error('添加评论失败:', error);
    res.status(500).json({ error: '添加评论失败' });
  }
});

// 删除作品
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { authorName, isAdmin } = req.query;
    
    const art = await Art.findById(id);
    if (!art) return res.status(404).json({ error: '作品不存在' });
    
    // 检查权限：只有作者或管理员可以删除
    if (art.authorName !== authorName && isAdmin !== 'true') {
      return res.status(403).json({ error: '无权限删除此作品' });
    }
    
    await Art.findByIdAndDelete(id);
    res.json({ message: '作品删除成功' });
  } catch (error) {
    console.error('删除作品失败:', error);
    res.status(500).json({ error: '删除作品失败' });
  }
});

// 获取我的作品
router.get('/my-works', async (req, res) => {
  try {
    const { authorName } = req.query;
    
    if (!authorName) {
      return res.status(400).json({ error: '缺少作者姓名参数' });
    }

    const works = await Art.find({ author: authorName }).sort({ createdAt: -1 });
    res.json(works);
  } catch (error) {
    console.error('获取我的作品失败:', error);
    res.status(500).json({ error: '获取作品失败' });
  }
});

// 获取收藏的艺术作品
router.get('/favorites', async (req, res) => {
  try {
    const { authorName } = req.query;
    
    if (!authorName) {
      return res.status(400).json({ error: '缺少作者姓名参数' });
    }

    const works = await Art.find({ 
      favorites: { $in: [authorName] } 
    }).sort({ createdAt: -1 });
    res.json(works);
  } catch (error) {
    console.error('获取收藏作品失败:', error);
    res.status(500).json({ error: '获取收藏作品失败' });
  }
});

// 获取喜欢的艺术作品
router.get('/likes', async (req, res) => {
  try {
    const { authorName } = req.query;
    
    if (!authorName) {
      return res.status(400).json({ error: '缺少作者姓名参数' });
    }

    const works = await Art.find({ 
      likedUsers: { $in: [authorName] } 
    }).sort({ createdAt: -1 });
    res.json(works);
  } catch (error) {
    console.error('获取喜欢作品失败:', error);
    res.status(500).json({ error: '获取喜欢作品失败' });
  }
});

module.exports = router;
