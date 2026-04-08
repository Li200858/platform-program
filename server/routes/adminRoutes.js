// 管理员审核相关路由
const express = require('express');
const router = express.Router();
const ClubApplication = require('../models/ClubApplication');
const Club = require('../models/Club');
const ClubMember = require('../models/ClubMember');
const ActivityApplication = require('../models/ActivityApplication');
const ActivityRegistration = require('../models/ActivityRegistration');
const User = require('../models/User');

// 检查管理员权限的中间件
const checkAdmin = async (req, res, next) => {
  try {
    const userName = req.query.userName || req.body.userName;
    if (!userName) {
      return res.status(400).json({ error: '缺少用户名参数' });
    }
    
    const user = await User.findOne({ name: userName });
    if (
      user &&
      (user.role === 'admin' || user.role === 'super_admin')
    ) {
      return next();
    }

    return res.status(403).json({ error: '无管理员权限' });
  } catch (error) {
    console.error('检查管理员权限失败:', error);
    res.status(500).json({ error: '检查管理员权限失败' });
  }
};

// 获取社团创建申请列表
router.get('/api/admin/club-applications', checkAdmin, async (req, res) => {
  try {
    const applications = await ClubApplication.find()
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    console.error('获取社团申请列表失败:', error);
    res.status(500).json({ error: '获取社团申请列表失败' });
  }
});

// 审核社团创建申请
router.post('/api/admin/club-applications/:id/review', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    const userName = req.query.userName || req.body.userName;
    
    if (!action || (action !== 'approve' && action !== 'reject')) {
      return res.status(400).json({ error: '无效的操作' });
    }
    
    const application = await ClubApplication.findById(id);
    if (!application) {
      return res.status(404).json({ error: '申请不存在' });
    }
    
    if (application.status !== 'pending') {
      return res.status(400).json({ error: '该申请已被审核' });
    }
    
    if (action === 'approve') {
      // 检查社团名称是否已存在
      const existingClub = await Club.findOne({ name: application.clubName });
      if (existingClub) {
        return res.status(400).json({ error: '社团名称已存在' });
      }
      
      // 创建社团
      const club = await Club.create({
        name: application.clubName,
        description: application.description,
        activityContent: application.activityContent,
        location: application.location,
        activityTime: application.activityTime,
        duration: application.duration,
        maxMembers: application.maxMembers,
        files: application.files,
        founder: application.applicant,
        status: 'approved',
        approvedAt: new Date()
      });
      
      // 将创始人添加为成员
      await ClubMember.create({
        userID: application.applicant.userID,
        name: application.applicant.name,
        class: application.applicant.class,
        clubId: club._id,
        clubName: club.name,
        status: 'approved',
        approvedAt: new Date()
      });
      
      // 更新申请状态
      application.status = 'approved';
      application.reviewedBy = userName;
      application.reviewedAt = new Date();
      await application.save();
      
      res.json({ message: '社团创建申请已通过', club });
    } else {
      // 拒绝申请
      application.status = 'rejected';
      application.reviewedBy = userName;
      application.reviewedAt = new Date();
      application.rejectedReason = reason || '未说明原因';
      await application.save();
      
      res.json({ message: '社团创建申请已拒绝' });
    }
  } catch (error) {
    console.error('审核社团申请失败:', error);
    res.status(500).json({ error: '审核社团申请失败' });
  }
});

// 获取活动创建申请列表
router.get('/api/admin/activity-applications', checkAdmin, async (req, res) => {
  try {
    const applications = await ActivityApplication.find()
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    console.error('获取活动申请列表失败:', error);
    res.status(500).json({ error: '获取活动申请列表失败' });
  }
});

// 审核活动创建申请
router.post('/api/admin/activity-applications/:id/review', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    const userName = req.query.userName || req.body.userName;
    
    if (!action || (action !== 'approve' && action !== 'reject')) {
      return res.status(400).json({ error: '无效的操作' });
    }
    
    const application = await ActivityApplication.findById(id);
    if (!application) {
      return res.status(404).json({ error: '申请不存在' });
    }
    
    if (application.status !== 'pending') {
      return res.status(400).json({ error: '该申请已被审核' });
    }
    
    if (action === 'approve') {
      application.status = 'approved';
      application.reviewedBy = userName;
      application.reviewedAt = new Date();
      await application.save();
      
      res.json({ message: '活动创建申请已通过', application });
    } else {
      application.status = 'rejected';
      application.reviewedBy = userName;
      application.reviewedAt = new Date();
      application.rejectedReason = reason || '未说明原因';
      await application.save();
      
      res.json({ message: '活动创建申请已拒绝' });
    }
  } catch (error) {
    console.error('审核活动申请失败:', error);
    res.status(500).json({ error: '审核活动申请失败' });
  }
});

// 获取活动报名列表（管理员查看所有）
router.get('/api/admin/activity-registrations', checkAdmin, async (req, res) => {
  try {
    const registrations = await ActivityRegistration.find()
      .sort({ createdAt: -1 });
    res.json(registrations);
  } catch (error) {
    console.error('获取活动报名列表失败:', error);
    res.status(500).json({ error: '获取活动报名列表失败' });
  }
});

// 审核活动报名（活动组织者审核）
router.post('/api/admin/activity-registrations/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason, reviewerName } = req.body;
    
    if (!action || (action !== 'approve' && action !== 'reject')) {
      return res.status(400).json({ error: '无效的操作' });
    }
    
    const registration = await ActivityRegistration.findById(id);
    if (!registration) {
      return res.status(404).json({ error: '报名记录不存在' });
    }
    
    // 获取活动信息
    const activity = await ActivityApplication.findById(registration.activityId);
    if (!activity) {
      return res.status(404).json({ error: '活动不存在' });
    }
    
    // 检查审核权限：只有活动组织者可以审核
    if (activity.organizer.name !== reviewerName) {
      // 如果不是组织者，检查是否是管理员
      const user = await User.findOne({ name: reviewerName });
      if (
        !user ||
        (user.role !== 'admin' && user.role !== 'super_admin')
      ) {
        return res.status(403).json({ error: '只有活动组织者可以审核报名' });
      }
    }
    
    if (registration.status !== 'pending') {
      return res.status(400).json({ error: '该报名已被审核' });
    }
    
    if (action === 'approve') {
      // 检查人数限制
      const currentRegistrations = await ActivityRegistration.countDocuments({ 
        activityId: registration.activityId, 
        status: 'approved' 
      });
      if (currentRegistrations >= activity.participantCount) {
        return res.status(400).json({ error: '活动人数已满' });
      }
      
      registration.status = 'approved';
      registration.reviewedBy = reviewerName;
      registration.reviewedAt = new Date();
      await registration.save();
      
      res.json({ message: '活动报名已通过', registration });
    } else {
      registration.status = 'rejected';
      registration.reviewedBy = reviewerName;
      registration.reviewedAt = new Date();
      registration.rejectedReason = reason || '未说明原因';
      await registration.save();
      
      res.json({ message: '活动报名已拒绝' });
    }
  } catch (error) {
    console.error('审核活动报名失败:', error);
    res.status(500).json({ error: '审核活动报名失败' });
  }
});

// 导出社团文档（CSV格式）
router.get('/api/admin/export-club-document', checkAdmin, async (req, res) => {
  try {
    const clubs = await Club.find({ status: 'approved' }).sort({ name: 1 });
    const members = await ClubMember.find({ status: 'approved' }).sort({ clubName: 1, name: 1 });
    
    // 生成CSV内容
    let csvContent = '社团名称,成员姓名,班级,加入时间\n';
    
    // 按社团分组
    const clubMap = new Map();
    clubs.forEach(club => {
      clubMap.set(club._id.toString(), {
        name: club.name,
        members: []
      });
    });
    
    members.forEach(member => {
      const club = clubMap.get(member.clubId.toString());
      if (club) {
        club.members.push({
          name: member.name,
          class: member.class,
          joinedAt: member.approvedAt || member.appliedAt
        });
      }
    });
    
    // 生成CSV
    clubMap.forEach((clubData, clubId) => {
      if (clubData.members.length === 0) {
        csvContent += `${clubData.name},,,,\n`;
      } else {
        clubData.members.forEach((member, index) => {
          if (index === 0) {
            csvContent += `${clubData.name},${member.name},${member.class},${member.joinedAt ? new Date(member.joinedAt).toLocaleString() : ''}\n`;
          } else {
            csvContent += `,${member.name},${member.class},${member.joinedAt ? new Date(member.joinedAt).toLocaleString() : ''}\n`;
          }
        });
      }
    });
    
    // 设置响应头
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=clubs-document.csv');
    res.send('\ufeff' + csvContent); // 添加BOM以支持Excel正确显示中文
  } catch (error) {
    console.error('导出社团文档失败:', error);
    res.status(500).json({ error: '导出社团文档失败' });
  }
});

module.exports = router;









