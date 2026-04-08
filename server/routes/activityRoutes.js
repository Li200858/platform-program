// 活动相关路由
const express = require('express');
const router = express.Router();
const ActivityApplication = require('../models/ActivityApplication');
const ActivityRegistration = require('../models/ActivityRegistration');
const ActivityStage = require('../models/ActivityStage');

// 获取所有已审核通过的活动
router.get('/api/activities', async (req, res) => {
  try {
    const activities = await ActivityApplication.find({ status: 'approved' })
      .sort({ activityTime: 1 });
    res.json(activities);
  } catch (error) {
    console.error('获取活动列表失败:', error);
    res.status(500).json({ error: '获取活动列表失败' });
  }
});

// 获取单个活动详情
router.get('/api/activities/:id', async (req, res) => {
  try {
    const activity = await ActivityApplication.findById(req.params.id)
      .populate('stages');
    if (!activity) {
      return res.status(404).json({ error: '活动不存在' });
    }
    
    // 更新当前阶段状态
    const now = new Date();
    const stages = await ActivityStage.find({ activityId: activity._id })
      .sort({ order: 1 });
    
    // 更新阶段状态
    for (const stage of stages) {
      const startTime = new Date(stage.startTime);
      const endTime = new Date(stage.endTime);
      stage.isActive = now >= startTime && now <= endTime;
      await stage.save();
    }
    
    activity.stages = stages;
    res.json(activity);
  } catch (error) {
    console.error('获取活动详情失败:', error);
    res.status(500).json({ error: '获取活动详情失败' });
  }
});

// 创建活动申请
router.post('/api/activities/create', async (req, res) => {
  try {
    const {
      title, participantCount, activityTime, location, description,
      process, requirements, files, stages, userID, name: organizerName, class: organizerClass
    } = req.body;
    
    if (!title || !location || !activityTime || !userID || !organizerName) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 创建活动申请
    const application = await ActivityApplication.create({
      title,
      participantCount: participantCount || 10,
      activityTime: new Date(activityTime),
      location,
      description: description || '',
      process: process || '',
      requirements: requirements || '',
      files: files || [],
      organizer: {
        userID,
        name: organizerName,
        class: organizerClass || ''
      },
      stages: stages || [],
      status: 'pending'
    });
    
    // 创建活动阶段
    if (stages && stages.length > 0) {
      const stageDocs = stages.map((stage, index) => ({
        activityId: application._id,
        name: stage.name,
        description: stage.description || '',
        startTime: new Date(stage.startTime),
        endTime: new Date(stage.endTime),
        type: stage.type || 'custom',
        order: stage.order !== undefined ? stage.order : index,
        isActive: false
      }));
      
      await ActivityStage.insertMany(stageDocs);
    }
    
    res.json({ message: '活动创建申请已提交，等待管理员审核', application });
  } catch (error) {
    console.error('创建活动申请失败:', error);
    res.status(500).json({ error: '创建活动申请失败' });
  }
});

// 活动报名
router.post('/api/activities/register', async (req, res) => {
  try {
    const { activityId, reason, contact, userID, name, class: userClass } = req.body;
    
    if (!activityId || !userID || !name) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 检查活动是否存在且已审核通过
    const activity = await ActivityApplication.findById(activityId);
    if (!activity || activity.status !== 'approved') {
      return res.status(400).json({ error: '活动不存在或未审核通过' });
    }
    
    // 检查是否已经报名
    const existingRegistration = await ActivityRegistration.findOne({ 
      'applicant.userID': userID, 
      activityId 
    });
    if (existingRegistration) {
      return res.status(400).json({ error: '您已经报名过该活动' });
    }
    
    // 检查人数限制
    const currentRegistrations = await ActivityRegistration.countDocuments({ 
      activityId, 
      status: 'approved' 
    });
    if (currentRegistrations >= activity.participantCount) {
      return res.status(400).json({ error: '活动人数已满' });
    }
    
    // 创建报名记录
    const registration = await ActivityRegistration.create({
      activityId,
      activityTitle: activity.title,
      applicant: {
        userID,
        name,
        class: userClass || '',
        contact: contact || ''
      },
      reason: reason || '',
      status: 'pending'
    });
    
    res.json({ message: '报名成功，等待活动组织者审核', registration });
  } catch (error) {
    console.error('活动报名失败:', error);
    res.status(500).json({ error: '活动报名失败' });
  }
});

// 获取用户创建的活动申请
router.get('/api/activities/my-applications', async (req, res) => {
  try {
    const { userID } = req.query;
    if (!userID) {
      return res.status(400).json({ error: '缺少userID参数' });
    }
    
    const applications = await ActivityApplication.find({ 
      'organizer.userID': userID 
    }).sort({ createdAt: -1 });
    
    res.json(applications);
  } catch (error) {
    console.error('获取用户活动申请失败:', error);
    res.status(500).json({ error: '获取用户活动申请失败' });
  }
});

// 获取用户的活动报名记录
router.get('/api/activities/my-registrations', async (req, res) => {
  try {
    const { userID } = req.query;
    if (!userID) {
      return res.status(400).json({ error: '缺少userID参数' });
    }
    
    const registrations = await ActivityRegistration.find({ 
      'applicant.userID': userID 
    }).sort({ createdAt: -1 });
    
    res.json(registrations);
  } catch (error) {
    console.error('获取用户活动报名记录失败:', error);
    res.status(500).json({ error: '获取用户活动报名记录失败' });
  }
});

module.exports = router;









