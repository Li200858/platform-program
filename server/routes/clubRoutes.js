// 社团相关路由
const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const ClubApplication = require('../models/ClubApplication');
const ClubMember = require('../models/ClubMember');

// 获取所有已审核通过的社团
router.get('/api/clubs', async (req, res) => {
  try {
    const clubs = await Club.find({ status: 'approved' }).sort({ createdAt: -1 });
    res.json(clubs);
  } catch (error) {
    console.error('获取社团列表失败:', error);
    res.status(500).json({ error: '获取社团列表失败' });
  }
});

// 获取单个社团详情
router.get('/api/clubs/:id', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ error: '社团不存在' });
    }
    res.json(club);
  } catch (error) {
    console.error('获取社团详情失败:', error);
    res.status(500).json({ error: '获取社团详情失败' });
  }
});

// 获取用户的社团信息
router.get('/api/clubs/user/:userID', async (req, res) => {
  try {
    const member = await ClubMember.findOne({ 
      userID: req.params.userID, 
      status: 'approved' 
    }).populate('clubId');
    
    if (!member) {
      return res.json(null);
    }
    
    res.json({
      clubId: member.clubId._id,
      clubName: member.clubName,
      status: member.status,
      appliedAt: member.appliedAt,
      approvedAt: member.approvedAt
    });
  } catch (error) {
    console.error('获取用户社团信息失败:', error);
    res.status(500).json({ error: '获取用户社团信息失败' });
  }
});

// 社团报名
router.post('/api/clubs/register', async (req, res) => {
  try {
    const { clubId, reason, userID, name, class: userClass } = req.body;
    
    if (!clubId || !userID || !name) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 检查社团是否存在且已审核通过
    const club = await Club.findById(clubId);
    if (!club || club.status !== 'approved') {
      return res.status(400).json({ error: '社团不存在或未审核通过' });
    }
    
    // 检查是否已经报名
    const existingMember = await ClubMember.findOne({ userID, clubId });
    if (existingMember) {
      return res.status(400).json({ error: '您已经报名过该社团' });
    }
    
    // 检查人数限制
    const currentMembers = await ClubMember.countDocuments({ 
      clubId, 
      status: 'approved' 
    });
    if (currentMembers >= club.maxMembers) {
      return res.status(400).json({ error: '社团人数已满' });
    }
    
    // 创建报名记录
    const member = await ClubMember.create({
      userID,
      name,
      class: userClass || '',
      clubId,
      clubName: club.name,
      status: 'pending'
    });
    
    res.json({ message: '报名成功，等待审核', member });
  } catch (error) {
    console.error('社团报名失败:', error);
    res.status(500).json({ error: '社团报名失败' });
  }
});

// 社团轮换
router.post('/api/clubs/switch', async (req, res) => {
  try {
    const { targetClubId, userID } = req.body;
    
    if (!targetClubId || !userID) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 检查是否在轮换时间窗口内（周日17:00 - 周四21:50）
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    const isSundayAfter5PM = day === 0 && (hour > 17 || (hour === 17 && minute >= 0));
    const isMondayToThursday = day >= 1 && day <= 4;
    const isThursdayBefore950PM = day === 4 && (hour < 21 || (hour === 21 && minute <= 50));
    
    if (!isSundayAfter5PM && !isMondayToThursday && !isThursdayBefore950PM) {
      return res.status(400).json({ error: '当前不在社团轮换时间窗口内（周日17:00 - 周四21:50）' });
    }
    
    // 检查用户是否已经报名过社团
    const currentMember = await ClubMember.findOne({ userID, status: 'approved' });
    if (!currentMember) {
      return res.status(400).json({ error: '请先进行社团报名' });
    }
    
    // 检查目标社团是否存在
    const targetClub = await Club.findById(targetClubId);
    if (!targetClub || targetClub.status !== 'approved') {
      return res.status(400).json({ error: '目标社团不存在或未审核通过' });
    }
    
    // 检查人数限制
    const currentMembers = await ClubMember.countDocuments({ 
      clubId: targetClubId, 
      status: 'approved' 
    });
    if (currentMembers >= targetClub.maxMembers) {
      return res.status(400).json({ error: '目标社团人数已满' });
    }
    
    // 计算轮换时间窗口
    const switchStartTime = new Date(now);
    if (day === 0) {
      // 周日，设置为17:00
      switchStartTime.setHours(17, 0, 0, 0);
    } else {
      // 周一到周四，设置为当前周的周日17:00
      const daysUntilSunday = (7 - day) % 7;
      switchStartTime.setDate(switchStartTime.getDate() - day);
      switchStartTime.setHours(17, 0, 0, 0);
    }
    
    const switchEndTime = new Date(switchStartTime);
    switchEndTime.setDate(switchEndTime.getDate() + 4);
    switchEndTime.setHours(21, 50, 0, 0);
    
    // 更新轮换请求
    currentMember.switchRequest = {
      requestedClubId: targetClubId,
      requestedClubName: targetClub.name,
      requestedAt: now,
      status: 'pending',
      switchStartTime,
      switchEndTime
    };
    
    await currentMember.save();
    
    res.json({ message: '轮换申请已提交，等待审核' });
  } catch (error) {
    console.error('社团轮换失败:', error);
    res.status(500).json({ error: '社团轮换失败' });
  }
});

// 创建社团申请
router.post('/api/clubs/create', async (req, res) => {
  try {
    const { 
      name, description, activityContent, location, activityTime, 
      duration, maxMembers, files, userID, name: applicantName, class: applicantClass 
    } = req.body;
    
    if (!name || !location || !maxMembers || !userID || !applicantName) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 检查社团名称是否已存在
    const existingClub = await Club.findOne({ name });
    if (existingClub) {
      return res.status(400).json({ error: '社团名称已存在' });
    }
    
    // 检查是否已有待审核的申请
    const existingApplication = await ClubApplication.findOne({ 
      clubName: name, 
      status: 'pending' 
    });
    if (existingApplication) {
      return res.status(400).json({ error: '该社团名称已有待审核的申请' });
    }
    
    // 创建社团申请
    const application = await ClubApplication.create({
      clubName: name,
      description: description || '',
      activityContent: activityContent || '',
      location,
      activityTime: activityTime || '',
      duration: duration || 1,
      maxMembers,
      files: files || [],
      applicant: {
        userID,
        name: applicantName,
        class: applicantClass || ''
      },
      status: 'pending'
    });
    
    res.json({ message: '社团创建申请已提交，等待管理员审核', application });
  } catch (error) {
    console.error('创建社团申请失败:', error);
    res.status(500).json({ error: '创建社团申请失败' });
  }
});

module.exports = router;









