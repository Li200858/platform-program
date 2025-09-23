import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';
import FilePreview from './FilePreview';
import api from './api';

export default function Teams({ userInfo, onBack }) {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [newProject, setNewProject] = useState({
    title: '',
    type: 'art',
    description: '',
    content: ''
  });
  const [showUploadVersion, setShowUploadVersion] = useState(false);
  const [newVersion, setNewVersion] = useState({
    changes: '',
    content: '',
    files: []
  });

  useEffect(() => {
    if (userInfo && userInfo.name) {
      loadTeams();
    }
  }, [userInfo]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const data = await api.teams.getUserTeams(userInfo.name);
      setTeams(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载团队失败:', error);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamDetail = async (teamId) => {
    try {
      const data = await api.teams.getTeam(teamId);
      setSelectedTeam(data);
    } catch (error) {
      console.error('加载团队详情失败:', error);
      setMessage('加载团队详情失败');
    }
  };

  const handleCreateTeam = async (teamData) => {
    try {
      await api.teams.create({
        ...teamData,
        creator: userInfo.name
      });
      setMessage('团队创建成功！');
      setShowCreate(false);
      loadTeams();
    } catch (error) {
      console.error('创建团队失败:', error);
      setMessage('创建团队失败，请重试');
    }
  };

  const handleSearchTeams = async () => {
    if (!searchQuery.trim()) {
      setMessage('请输入搜索关键词');
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setMessage('');
    try {
      const data = await api.search.global(searchQuery.trim(), 'team');
      setSearchResults(data.teams || []);
      if (data.teams && data.teams.length === 0) {
        setMessage('未找到相关团队');
      }
    } catch (error) {
      console.error('搜索团队失败:', error);
      setMessage('搜索失败，请重试');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleJoinTeam = async (teamId) => {
    try {
      await api.teams.joinTeam(teamId, {
        username: userInfo.name,
        requestedBy: userInfo.name
      });
      setMessage('加入申请已发送，等待团队创建者审核');
      setShowJoin(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('加入团队失败:', error);
      setMessage('加入团队失败：' + (error.message || '请重试'));
    }
  };

  const handleInviteUser = async (teamId, username) => {
    try {
      await api.teams.inviteUser(teamId, {
        inviter: userInfo.name,
        invitee: username
      });
      setMessage(`已邀请 ${username} 加入团队`);
      if (selectedTeam && selectedTeam._id === teamId) {
        loadTeamDetail(teamId);
      }
    } catch (error) {
      console.error('邀请用户失败:', error);
      setMessage('邀请用户失败，请重试');
    }
  };

  const handleCreateProject = async (teamId, projectData) => {
    try {
      await api.teams.createProject(teamId, {
        ...projectData,
        creator: userInfo.name
      });
      setMessage('项目创建成功！');
      if (selectedTeam && selectedTeam._id === teamId) {
        loadTeamDetail(teamId);
      }
    } catch (error) {
      console.error('创建项目失败:', error);
      setMessage('创建项目失败，请重试');
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1000, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              marginRight: '15px',
              color: '#7f8c8d'
            }}
          >
            ←
          </button>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>团队协作</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
          加载中...
        </div>
      </div>
    );
  }

  if (!userInfo || !userInfo.name) {
    return (
      <div style={{ maxWidth: 1000, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              marginRight: '15px',
              color: '#7f8c8d'
            }}
          >
            ←
          </button>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>团队协作</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
          请先完善个人信息
        </div>
      </div>
    );
  }

  if (showCreate) {
    return (
      <CreateTeamForm 
        onBack={() => setShowCreate(false)}
        onSubmit={handleCreateTeam}
        userInfo={userInfo}
      />
    );
  }

  if (showJoin) {
    return (
      <JoinTeamForm 
        onBack={() => setShowJoin(false)}
        onSearch={handleSearchTeams}
        onJoin={handleJoinTeam}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        searchLoading={searchLoading}
        message={message}
        userInfo={userInfo}
      />
    );
  }

  if (selectedTeam) {
    return (
      <TeamDetail 
        team={selectedTeam}
        onBack={() => setSelectedTeam(null)}
        onInviteUser={handleInviteUser}
        onCreateProject={handleCreateProject}
        userInfo={userInfo}
        setSelectedProject={setSelectedProject}
      />
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      {/* 头部 */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            marginRight: '15px',
            color: '#7f8c8d'
          }}
        >
          ←
        </button>
        <h2 style={{ margin: 0, color: '#2c3e50', flex: 1 }}>团队协作</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowJoin(true)}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#3498db', 
              color: 'white', 
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            + 加入团队
          </button>
          <button 
            onClick={() => setShowCreate(true)}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#27ae60', 
              color: 'white', 
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            + 创建团队
          </button>
        </div>
      </div>

      {/* 消息显示 */}
      {message && (
        <div style={{ 
          marginBottom: 20, 
          padding: '15px', 
          background: message.includes('成功') || message.includes('已邀请') ? '#d4edda' : '#f8d7da',
          color: message.includes('成功') || message.includes('已邀请') ? '#155724' : '#721c24',
          borderRadius: 8,
          border: `1px solid ${message.includes('成功') || message.includes('已邀请') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}

      {/* 团队列表 */}
      {teams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>👤</div>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>还没有加入任何团队</div>
          <div style={{ fontSize: '14px' }}>创建团队开始协作吧！</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {teams.map(team => {
            const userRole = team.members.find(m => m.username === userInfo.name)?.role || 'member';
            return (
              <div key={team._id} style={{ 
                border: '1px solid #ecf0f1', 
                borderRadius: 12, 
                padding: 20, 
                background: '#f8f9fa',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => loadTeamDetail(team._id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                  <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '18px' }}>
                    {team.name}
                  </h3>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: 12,
                    fontSize: '11px',
                    fontWeight: 'bold',
                    background: userRole === 'owner' ? '#e74c3c' : userRole === 'admin' ? '#f39c12' : '#3498db',
                    color: 'white'
                  }}>
                    {userRole === 'owner' ? '所有者' : userRole === 'admin' ? '管理员' : '成员'}
                  </span>
                </div>
                
                <p style={{ margin: '0 0 15px 0', color: '#34495e', fontSize: '14px', lineHeight: 1.4 }}>
                  {team.description || '暂无描述'}
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                    {team.members.length} 成员
                  </div>
                  <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                    {team.projects.length} 项目
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 创建团队表单
function CreateTeamForm({ onBack, onSubmit, userInfo }) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('请填写团队名称！');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            marginRight: '15px',
            color: '#7f8c8d'
          }}
        >
          ←
        </button>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>创建团队</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
            团队名称 *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="请输入团队名称"
            style={{ width: '100%', padding: '12px', borderRadius: 8, border: '2px solid #ecf0f1' }}
          />
        </div>

        <div style={{ marginBottom: 30 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
            团队描述
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="请描述团队目标和方向..."
            rows={4}
            style={{ width: '100%', padding: '12px', borderRadius: 8, border: '2px solid #ecf0f1', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 15, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              padding: '12px 24px',
              background: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            取消
          </button>
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            创建团队
          </button>
        </div>
      </form>
    </div>
  );
}

// 团队详情组件
function TeamDetail({ team, onBack, onInviteUser, onCreateProject, userInfo, setSelectedProject }) {
  const [showInvite, setShowInvite] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    type: 'art',
    content: '',
    media: []
  });
  const [message, setMessage] = useState('');

  const userRole = team.members.find(m => m.username === userInfo.name)?.role || 'member';
  const canInvite = ['owner', 'admin'].includes(userRole);
  const canCreateProject = ['owner', 'admin', 'member'].includes(userRole);
  const canManageRequests = ['owner', 'admin'].includes(userRole);

  const handleProcessJoinRequest = async (requestId, action) => {
    try {
      await api.teams.processJoinRequest(team._id, requestId, {
        action: action,
        processedBy: userInfo.name
      });
      setMessage(`申请已${action === 'approve' ? '批准' : '拒绝'}`);
      // 重新加载团队详情
      window.location.reload();
    } catch (error) {
      console.error('处理申请失败:', error);
      setMessage('处理申请失败：' + (error.message || '请重试'));
    }
  };

  const handleDisbandTeam = async () => {
    if (!window.confirm('确定要解散团队吗？此操作不可恢复，所有团队成员将被移除。')) {
      return;
    }

    try {
      await api.teams.disbandTeam(team._id, {
        deletedBy: userInfo.name
      });
      setMessage('团队已解散');
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      console.error('解散团队失败:', error);
      setMessage('解散团队失败：' + (error.message || '请重试'));
    }
  };

  const handleInvite = async () => {
    if (!inviteUsername.trim()) {
      alert('请输入用户名');
      return;
    }

    await onInviteUser(team._id, inviteUsername.trim());
    setInviteUsername('');
    setShowInvite(false);
  };

  const handleCreateProject = async () => {
    if (!projectForm.title.trim()) {
      alert('请输入项目标题');
      return;
    }

    await onCreateProject(team._id, projectForm);
    setProjectForm({
      title: '',
      description: '',
      type: 'art',
      content: '',
      media: []
    });
    setShowCreateProject(false);
  };

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      {/* 头部 */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            marginRight: '15px',
            color: '#7f8c8d'
          }}
        >
          ←
        </button>
        <h2 style={{ margin: 0, color: '#2c3e50', flex: 1 }}>{team.name}</h2>
        {canInvite && (
          <button 
            onClick={() => setShowInvite(true)}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#3498db', 
              color: 'white', 
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              marginRight: 10
            }}
          >
            + 邀请成员
          </button>
        )}
        {canManageRequests && team.joinRequests && team.joinRequests.length > 0 && (
          <button 
            onClick={() => setShowJoinRequests(true)}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#f39c12', 
              color: 'white', 
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            管理申请 ({team.joinRequests.filter(req => req.status === 'pending').length})
          </button>
        )}
        {canCreateProject && (
          <button 
            onClick={() => setShowCreateProject(true)}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#27ae60', 
              color: 'white', 
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            + 创建项目
          </button>
        )}
        {userRole === 'owner' && (
          <button 
            onClick={handleDisbandTeam}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#e74c3c', 
              color: 'white', 
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            解散团队
          </button>
        )}
      </div>

      {/* 团队信息 */}
      <div style={{ marginBottom: 30 }}>
        <h3 style={{ marginBottom: 15, color: '#2c3e50' }}>团队信息</h3>
        <p style={{ color: '#34495e', lineHeight: 1.6, marginBottom: 20 }}>
          {team.description || '暂无描述'}
        </p>
        
        <div style={{ display: 'flex', gap: 30, marginBottom: 20 }}>
          <div>
            <strong>创建者：</strong> {team.creator}
          </div>
          <div>
            <strong>成员数量：</strong> {team.members.length}
          </div>
          <div>
            <strong>项目数量：</strong> {team.projects.length}
          </div>
        </div>
      </div>

      {/* 邀请用户弹窗 */}
      {showInvite && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 15,
            padding: 30,
            maxWidth: '400px',
            width: '100%'
          }}>
            <h3 style={{ marginBottom: 20, color: '#2c3e50' }}>邀请用户加入团队</h3>
            <input
              type="text"
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
              placeholder="请输入用户名"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 8,
                border: '2px solid #ecf0f1',
                marginBottom: 20
              }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowInvite(false)}
                style={{
                  padding: '10px 20px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={handleInvite}
                style={{
                  padding: '10px 20px',
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                邀请
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 创建项目弹窗 */}
      {showCreateProject && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 15,
            padding: 30,
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: 20, color: '#2c3e50' }}>创建团队项目</h3>
            
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>项目标题 *</label>
              <input
                type="text"
                value={projectForm.title}
                onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="请输入项目标题"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 6,
                  border: '1px solid #ddd'
                }}
              />
            </div>

            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>项目类型</label>
              <select
                value={projectForm.type}
                onChange={(e) => setProjectForm(prev => ({ ...prev, type: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 6,
                  border: '1px solid #ddd'
                }}
              >
                <option value="art">艺术作品</option>
                <option value="activity">活动设计</option>
              </select>
            </div>

            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>项目描述</label>
              <textarea
                value={projectForm.description}
                onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请描述项目内容..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>项目内容</label>
              <textarea
                value={projectForm.content}
                onChange={(e) => setProjectForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="请输入项目详细内容..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateProject(false)}
                style={{
                  padding: '10px 20px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={async () => {
                  if (!projectForm.title.trim()) {
                    setMessage('请输入项目标题');
                    return;
                  }
                  
                  try {
                    await onCreateProject(team._id, projectForm);
                    setProjectForm({
                      title: '',
                      description: '',
                      type: 'art',
                      content: '',
                      media: []
                    });
                    setShowCreateProject(false);
                    setMessage('项目创建成功！');
                  } catch (error) {
                    console.error('创建项目失败:', error);
                    setMessage('创建项目失败，请重试');
                  }
                }}
                style={{
                  padding: '10px 20px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 成员列表 */}
      <div style={{ marginBottom: 30 }}>
        <h3 style={{ marginBottom: 15, color: '#2c3e50' }}>团队成员</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 15 }}>
          {team.members.map(member => (
            <div key={member.username} style={{
              border: '1px solid #ecf0f1',
              borderRadius: 8,
              padding: 15,
              background: '#f8f9fa',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <Avatar name={member.username} size={35} />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#2c3e50' }}>
                  {member.username}
                </div>
                <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                  {member.role === 'owner' ? '所有者' : member.role === 'admin' ? '管理员' : '成员'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 项目列表 */}
      <div>
        <h3 style={{ marginBottom: 15, color: '#2c3e50' }}>团队项目</h3>
        {team.projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📄</div>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>还没有项目</div>
            <div style={{ fontSize: '14px' }}>创建第一个项目开始协作吧！</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {team.projects.map(project => (
              <div 
                key={project._id} 
                onClick={() => setSelectedProject(project)}
                style={{
                  border: '1px solid #ecf0f1',
                  borderRadius: 12,
                  padding: 20,
                  background: '#f8f9fa',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  ':hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                  <h4 style={{ margin: 0, color: '#2c3e50', fontSize: '16px' }}>
                    {project.title}
                  </h4>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: 12,
                    fontSize: '11px',
                    fontWeight: 'bold',
                    background: project.status === 'completed' ? '#27ae60' : 
                               project.status === 'in_progress' ? '#3498db' : '#f39c12',
                    color: 'white'
                  }}>
                    {project.status === 'completed' ? '已完成' : 
                     project.status === 'in_progress' ? '进行中' : '草稿'}
                  </span>
                </div>
                
                <p style={{ margin: '0 0 15px 0', color: '#34495e', fontSize: '14px', lineHeight: 1.4 }}>
                  {project.description || '暂无描述'}
                </p>
                
                <div style={{ marginBottom: 15 }}>
                  <strong>类型：</strong> {project.type === 'art' ? '艺术作品' : '活动设计'}
                </div>
                
                <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: 10 }}>
                  贡献者: {project.contributors.join(', ')}
                </div>
                
                <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                  版本: {project.versions.length} • 最后更新: {new Date(project.updatedAt).toLocaleString()}
                </div>
                
                <div style={{ marginTop: 10, fontSize: '12px', color: '#3498db' }}>
                  点击查看详情 →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 消息显示 */}
      {message && (
        <div style={{ 
          marginBottom: 20, 
          padding: '10px 15px', 
          backgroundColor: message.includes('成功') ? '#d4edda' : '#f8d7da',
          color: message.includes('成功') ? '#155724' : '#721c24',
          borderRadius: 6,
          border: `1px solid ${message.includes('成功') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}

      {/* 加入申请管理弹窗 */}
      {showJoinRequests && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 15,
            padding: 30,
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#2c3e50' }}>管理加入申请</h3>
              <button
                onClick={() => setShowJoinRequests(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#7f8c8d'
                }}
              >
                ×
              </button>
            </div>

            {team.joinRequests && team.joinRequests.length > 0 ? (
              <div>
                {team.joinRequests.map(request => (
                  <div key={request._id} style={{
                    border: '1px solid #ecf0f1',
                    borderRadius: 8,
                    padding: 15,
                    marginBottom: 15,
                    background: request.status === 'pending' ? '#fff3cd' : '#f8f9fa'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', color: '#2c3e50', marginBottom: 5 }}>
                          {request.username}
                        </div>
                        <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: 5 }}>
                          申请时间: {new Date(request.requestedAt).toLocaleString()}
                        </div>
                        {request.message && (
                          <div style={{ color: '#34495e', fontSize: '14px', marginBottom: 10 }}>
                            申请说明: {request.message}
                          </div>
                        )}
                        <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                          状态: {
                            request.status === 'pending' ? '待审核' :
                            request.status === 'approved' ? '已批准' : '已拒绝'
                          }
                          {request.processedAt && ` • 处理时间: ${new Date(request.processedAt).toLocaleString()}`}
                          {request.processedBy && ` • 处理人: ${request.processedBy}`}
                        </div>
                      </div>
                      {request.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => handleProcessJoinRequest(request._id, 'approve')}
                            style={{
                              padding: '6px 12px',
                              background: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                          >
                            批准
                          </button>
                          <button
                            onClick={() => handleProcessJoinRequest(request._id, 'reject')}
                            style={{
                              padding: '6px 12px',
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                          >
                            拒绝
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
                <div style={{ fontSize: '18px', marginBottom: '10px' }}>暂无加入申请</div>
                <div style={{ fontSize: '14px' }}>当有用户申请加入团队时会显示在这里</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 加入团队表单组件
function JoinTeamForm({ onBack, onSearch, onJoin, searchQuery, setSearchQuery, searchResults, searchLoading, message, userInfo }) {
  const [joinMessage, setJoinMessage] = useState('');

  const handleJoin = (teamId) => {
    onJoin(teamId);
  };

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      {/* 头部 */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            marginRight: '15px',
            color: '#7f8c8d'
          }}
        >
          ←
        </button>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>加入团队</h2>
      </div>

      {/* 消息显示 */}
      {message && (
        <div style={{ 
          marginBottom: 20, 
          padding: '10px 15px', 
          backgroundColor: message.includes('成功') ? '#d4edda' : '#f8d7da',
          color: message.includes('成功') ? '#155724' : '#721c24',
          borderRadius: 6,
          border: `1px solid ${message.includes('成功') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}

      {/* 搜索区域 */}
      <div style={{ marginBottom: 30 }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: 20 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter') onSearch(); }}
            placeholder="搜索团队名称或创建者..."
            style={{ 
              flex: 1, 
              padding: '10px', 
              border: '1px solid #ddd', 
              borderRadius: 6, 
              fontSize: '14px' 
            }}
          />
          <button
            onClick={onSearch}
            disabled={searchLoading}
            style={{
              padding: '10px 20px',
              background: searchLoading ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: searchLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {searchLoading ? '搜索中...' : '搜索'}
          </button>
        </div>

        {/* 搜索结果 */}
        {searchResults.length > 0 && (
          <div>
            <h3 style={{ marginBottom: 15, color: '#2c3e50' }}>搜索结果</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {searchResults.map(team => (
                <div key={team._id} style={{
                  border: '1px solid #ecf0f1',
                  borderRadius: 8,
                  padding: 15,
                  background: '#f8f9fa'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', color: '#2c3e50', marginBottom: 5 }}>
                        {team.name}
                      </div>
                      <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: 10 }}>
                        {team.description || '暂无描述'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                        创建者: {team.creator} • {team.members.length} 成员 • {team.projects.length} 项目
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoin(team._id)}
                      style={{
                        padding: '8px 16px',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      申请加入
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {searchQuery && searchResults.length === 0 && !searchLoading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>未找到相关团队</div>
            <div style={{ fontSize: '14px' }}>请尝试其他关键词</div>
          </div>
        )}
      </div>

      {/* 项目详情弹窗 */}
      {selectedProject && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 15,
            padding: 30,
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#2c3e50' }}>{selectedProject.title}</h3>
              <button
                onClick={() => setSelectedProject(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#7f8c8d'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 20, marginBottom: 15 }}>
                <div>
                  <strong>状态：</strong>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: 12,
                    fontSize: '12px',
                    fontWeight: 'bold',
                    background: selectedProject.status === 'completed' ? '#27ae60' : 
                               selectedProject.status === 'in_progress' ? '#3498db' : '#f39c12',
                    color: 'white',
                    marginLeft: 8
                  }}>
                    {selectedProject.status === 'completed' ? '已完成' : 
                     selectedProject.status === 'in_progress' ? '进行中' : '草稿'}
                  </span>
                </div>
                <div>
                  <strong>类型：</strong> {selectedProject.type === 'art' ? '艺术作品' : '活动设计'}
                </div>
                <div>
                  <strong>版本：</strong> {selectedProject.versions.length}
                </div>
              </div>

              {selectedProject.description && (
                <div style={{ marginBottom: 15 }}>
                  <strong>描述：</strong>
                  <p style={{ margin: '5px 0 0 0', color: '#34495e', lineHeight: 1.5 }}>
                    {selectedProject.description}
                  </p>
                </div>
              )}

              <div style={{ marginBottom: 15 }}>
                <strong>贡献者：</strong>
                <div style={{ marginTop: 5 }}>
                  {selectedProject.contributors.map((contributor, index) => (
                    <span key={index} style={{
                      display: 'inline-block',
                      background: '#ecf0f1',
                      padding: '4px 8px',
                      borderRadius: 12,
                      fontSize: '12px',
                      margin: '2px 4px 2px 0'
                    }}>
                      {contributor}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <strong>项目内容：</strong>
                <div style={{
                  marginTop: 10,
                  padding: 15,
                  background: '#f8f9fa',
                  borderRadius: 8,
                  border: '1px solid #ecf0f1',
                  minHeight: 100,
                  whiteSpace: 'pre-wrap',
                  color: '#2c3e50'
                }}>
                  {selectedProject.content || '暂无内容'}
                </div>
              </div>

              {/* 版本历史 */}
              {selectedProject.versions && selectedProject.versions.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <strong>版本历史：</strong>
                  <div style={{ marginTop: 10, maxHeight: 200, overflow: 'auto' }}>
                    {selectedProject.versions.map((version, index) => (
                      <div key={index} style={{
                        padding: 10,
                        marginBottom: 8,
                        background: '#f8f9fa',
                        borderRadius: 6,
                        border: '1px solid #ecf0f1'
                      }}>
                        <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: 5 }}>
                          版本 {version.version} • {new Date(version.createdAt).toLocaleString()} • {version.author}
                        </div>
                        <div style={{ fontSize: '14px', color: '#2c3e50' }}>
                          {version.changes}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  onClick={() => {
                    // 这里可以添加编辑项目的功能
                    setMessage('编辑功能开发中...');
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer'
                  }}
                >
                  编辑项目
                </button>
                <button
                  onClick={() => {
                    setShowUploadVersion(true);
                    setNewVersion({
                      changes: '',
                      content: '',
                      files: []
                    });
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer'
                  }}
                >
                  上传新版本
                </button>
                <button
                  onClick={() => setSelectedProject(null)}
                  style={{
                    padding: '10px 20px',
                    background: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer'
                  }}
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 上传新版本弹窗 */}
      {showUploadVersion && selectedProject && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 15,
            padding: 30,
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#2c3e50' }}>上传新版本 - {selectedProject.title}</h3>
              <button
                onClick={() => setShowUploadVersion(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#7f8c8d'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>版本说明 *</label>
              <textarea
                value={newVersion.changes}
                onChange={(e) => setNewVersion(prev => ({ ...prev, changes: e.target.value }))}
                placeholder="请描述此版本的更新内容..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 8,
                  border: '2px solid #ecf0f1',
                  fontSize: '14px',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>版本内容</label>
              <textarea
                value={newVersion.content}
                onChange={(e) => setNewVersion(prev => ({ ...prev, content: e.target.value }))}
                placeholder="请输入版本详细内容..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 8,
                  border: '2px solid #ecf0f1',
                  fontSize: '14px',
                  minHeight: '120px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>上传文件</label>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  setNewVersion(prev => ({ ...prev, files }));
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 8,
                  border: '2px solid #ecf0f1',
                  fontSize: '14px'
                }}
              />
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: 5 }}>
                支持图片、文档等多种格式，可同时选择多个文件
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowUploadVersion(false)}
                style={{
                  padding: '10px 20px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={async () => {
                  if (!newVersion.changes.trim()) {
                    setMessage('请输入版本说明');
                    return;
                  }

                  try {
                    // 这里需要调用后端API上传新版本
                    // await api.teams.uploadVersion(selectedProject._id, newVersion);
                    setMessage('版本上传功能开发中...');
                    setShowUploadVersion(false);
                    setNewVersion({ changes: '', content: '', files: [] });
                  } catch (error) {
                    console.error('上传版本失败:', error);
                    setMessage('上传版本失败，请重试');
                  }
                }}
                style={{
                  padding: '10px 20px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                上传版本
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
