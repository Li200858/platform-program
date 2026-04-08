import React, { useState, useEffect } from 'react';
import api from './api';
import './App.css';

export default function ClubManagement({ userInfo, onBack }) {
  const [activeTab, setActiveTab] = useState('register'); // register, switch, create
  const [clubs, setClubs] = useState([]);
  const [userClub, setUserClub] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // 社团报名表单
  const [registerForm, setRegisterForm] = useState({
    clubId: '',
    reason: ''
  });
  
  // 社团轮换表单
  const [switchForm, setSwitchForm] = useState({
    targetClubId: ''
  });
  
  // 社团创建表单
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    activityContent: '',
    location: '',
    activityTime: '',
    duration: 1,
    maxMembers: 10,
    files: []
  });
  
  const [canSwitch, setCanSwitch] = useState(false); // 是否在轮换时间窗口内

  useEffect(() => {
    loadClubs();
    loadUserClub();
    checkSwitchWindow();
  }, []);

  // 检查是否在轮换时间窗口内（周日17:00 - 周四21:50）
  const checkSwitchWindow = () => {
    const now = new Date();
    const day = now.getDay(); // 0=周日, 1=周一, ..., 6=周六
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // 周日17:00之后 或 周一到周四任意时间 或 周四21:50之前
    const isSundayAfter5PM = day === 0 && (hour > 17 || (hour === 17 && minute >= 0));
    const isMondayToThursday = day >= 1 && day <= 4;
    const isThursdayBefore950PM = day === 4 && (hour < 21 || (hour === 21 && minute <= 50));
    
    setCanSwitch(isSundayAfter5PM || isMondayToThursday || isThursdayBefore950PM);
  };

  const loadClubs = async () => {
    try {
      const data = await api.club.getAll();
      setClubs(data);
    } catch (error) {
      console.error('加载社团列表失败:', error);
      setMessage('加载社团列表失败');
    }
  };

  const loadUserClub = async () => {
    if (!userInfo?.userID) return;
    try {
      const data = await api.club.getUserClub(userInfo.userID);
      setUserClub(data);
    } catch (error) {
      console.error('加载用户社团信息失败:', error);
    }
  };

  const handleRegister = async () => {
    if (!registerForm.clubId) {
      setMessage('请选择要报名的社团');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      await api.club.register({
        clubId: registerForm.clubId,
        reason: registerForm.reason,
        userID: userInfo.userID,
        name: userInfo.name,
        class: userInfo.class
      });
      setMessage('报名成功，等待审核');
      setRegisterForm({ clubId: '', reason: '' });
      loadUserClub();
    } catch (error) {
      setMessage(error.message || '报名失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = async () => {
    if (!canSwitch) {
      setMessage('当前不在社团轮换时间窗口内（周日17:00 - 周四21:50）');
      return;
    }
    
    if (!switchForm.targetClubId) {
      setMessage('请选择要轮换到的社团');
      return;
    }
    
    if (!userClub) {
      setMessage('请先报名一个社团');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      await api.club.switch({
        targetClubId: switchForm.targetClubId,
        userID: userInfo.userID
      });
      setMessage('轮换申请已提交，等待审核');
      setSwitchForm({ targetClubId: '' });
      loadUserClub();
    } catch (error) {
      setMessage(error.message || '轮换失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setLoading(true);
    try {
      const uploadedFiles = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.upload.file(formData);
        uploadedFiles.push(response.filePath);
      }
      setCreateForm({ ...createForm, files: [...createForm.files, ...uploadedFiles] });
      setMessage('文件上传成功');
    } catch (error) {
      setMessage('文件上传失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.location || !createForm.maxMembers) {
      setMessage('请填写必填项：社团名称、活动地点、人数限制');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      await api.club.create({
        ...createForm,
        userID: userInfo.userID,
        name: userInfo.name,
        class: userInfo.class
      });
      setMessage('社团创建申请已提交，等待管理员审核');
      setCreateForm({
        name: '',
        description: '',
        activityContent: '',
        location: '',
        activityTime: '',
        duration: 1,
        maxMembers: 10,
        files: []
      });
    } catch (error) {
      setMessage(error.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="club-management">
      <div className="header">
        <button onClick={onBack} className="back-button">← 返回</button>
        <h2>社团事宜</h2>
      </div>

      <div className="tabs">
        <button 
          className={activeTab === 'register' ? 'active' : ''}
          onClick={() => setActiveTab('register')}
        >
          社团报名
        </button>
        <button 
          className={activeTab === 'switch' ? 'active' : ''}
          onClick={() => setActiveTab('switch')}
        >
          社团轮换
        </button>
        <button 
          className={activeTab === 'create' ? 'active' : ''}
          onClick={() => setActiveTab('create')}
        >
          社团创建
        </button>
      </div>

      {activeTab === 'register' && (
        <div className="club-register">
          <h3>社团报名</h3>
          {userClub && (
            <div className="current-club">
              <p>当前社团：{userClub.clubName}</p>
              <p>状态：{userClub.status === 'approved' ? '已通过' : '待审核'}</p>
            </div>
          )}
          <div className="form-group">
            <label>选择社团：</label>
            <select 
              value={registerForm.clubId}
              onChange={(e) => setRegisterForm({ ...registerForm, clubId: e.target.value })}
            >
              <option value="">请选择</option>
              {clubs.filter(c => c.status === 'approved').map(club => (
                <option key={club._id} value={club._id}>
                  {club.name} ({club.members.length}/{club.maxMembers})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>申请原因：</label>
            <textarea
              value={registerForm.reason}
              onChange={(e) => setRegisterForm({ ...registerForm, reason: e.target.value })}
              placeholder="请说明申请原因"
            />
          </div>
          <button onClick={handleRegister} disabled={loading}>
            {loading ? '提交中...' : '提交报名'}
          </button>
        </div>
      )}

      {activeTab === 'switch' && (
        <div className="club-switch">
          <h3>社团轮换</h3>
          {!userClub && (
            <p className="warning">请先进行社团报名</p>
          )}
          {userClub && (
            <div className="current-club">
              <p>当前社团：{userClub.clubName}</p>
            </div>
          )}
          {!canSwitch && (
            <p className="warning">当前不在轮换时间窗口内（周日17:00 - 周四21:50）</p>
          )}
          <div className="form-group">
            <label>选择目标社团：</label>
            <select 
              value={switchForm.targetClubId}
              onChange={(e) => setSwitchForm({ ...switchForm, targetClubId: e.target.value })}
              disabled={!canSwitch || !userClub}
            >
              <option value="">请选择</option>
              {clubs
                .filter(c => c.status === 'approved' && c._id !== userClub?.clubId)
                .map(club => (
                  <option key={club._id} value={club._id}>
                    {club.name} ({club.members.length}/{club.maxMembers})
                  </option>
                ))}
            </select>
          </div>
          <button 
            onClick={handleSwitch} 
            disabled={loading || !canSwitch || !userClub}
          >
            {loading ? '提交中...' : '提交轮换申请'}
          </button>
        </div>
      )}

      {activeTab === 'create' && (
        <div className="club-create">
          <h3>社团创建</h3>
          <div className="form-group">
            <label>社团名称 *：</label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="请输入社团名称"
            />
          </div>
          <div className="form-group">
            <label>社团介绍：</label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="请输入社团介绍"
            />
          </div>
          <div className="form-group">
            <label>活动内容：</label>
            <textarea
              value={createForm.activityContent}
              onChange={(e) => setCreateForm({ ...createForm, activityContent: e.target.value })}
              placeholder="请输入活动内容"
            />
          </div>
          <div className="form-group">
            <label>活动地点 *：</label>
            <input
              type="text"
              value={createForm.location}
              onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
              placeholder="请输入活动地点"
            />
          </div>
          <div className="form-group">
            <label>活动时间&时长：</label>
            <input
              type="text"
              value={createForm.activityTime}
              onChange={(e) => setCreateForm({ ...createForm, activityTime: e.target.value })}
              placeholder="如：每周三下午3点，时长2小时"
            />
          </div>
          <div className="form-group">
            <label>持续时间（周数）：</label>
            <input
              type="number"
              value={createForm.duration}
              onChange={(e) => setCreateForm({ ...createForm, duration: parseInt(e.target.value) || 1 })}
              min="1"
            />
          </div>
          <div className="form-group">
            <label>人数限制 *：</label>
            <input
              type="number"
              value={createForm.maxMembers}
              onChange={(e) => setCreateForm({ ...createForm, maxMembers: parseInt(e.target.value) || 10 })}
              min="1"
            />
          </div>
          <div className="form-group">
            <label>上传文件（可选）：</label>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
            />
            {createForm.files.length > 0 && (
              <div className="uploaded-files">
                {createForm.files.map((file, index) => (
                  <span key={index} className="file-tag">{file}</span>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleCreate} disabled={loading}>
            {loading ? '提交中...' : '创建社团'}
          </button>
        </div>
      )}

      {message && (
        <div className={`message ${message.includes('成功') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
}









