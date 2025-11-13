import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Avatar from './Avatar';
import FilePreview from './FilePreview';
import api from './api';

const SYSTEM_STAGE_KEYS = ['preparation', 'kickoff', 'closing'];
const SYSTEM_STAGE_NAMES = {
  preparation: '活动准备',
  kickoff: '活动开始',
  closing: '活动结束'
};

const formatDateTimeLocal = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const timezoneOffset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - timezoneOffset * 60000);
  return localDate.toISOString().slice(0, 16);
};

const toISOFromLocal = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const generateLocalStageKey = () => `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const createDefaultStageDrafts = () => {
  const baseTime = Date.now();
  const toLocal = (offsetHours) => formatDateTimeLocal(new Date(baseTime + offsetHours * 60 * 60 * 1000));
  return [
    { key: 'preparation', name: SYSTEM_STAGE_NAMES.preparation, startAt: toLocal(0), description: '', isSystemDefault: true, allowEdit: false },
    { key: 'kickoff', name: SYSTEM_STAGE_NAMES.kickoff, startAt: toLocal(1), description: '', isSystemDefault: true, allowEdit: false },
    {
      key: generateLocalStageKey(),
      name: '执行阶段',
      startAt: toLocal(2),
      description: '',
      isSystemDefault: false,
      allowEdit: true
    },
    { key: 'closing', name: SYSTEM_STAGE_NAMES.closing, startAt: toLocal(3), description: '', isSystemDefault: true, allowEdit: false }
  ];
};

const convertStageDraftsToPayload = (drafts) => drafts.map((stage, index) => ({
  key: stage.key || generateLocalStageKey(),
  name: stage.name?.trim() || `阶段${index + 1}`,
  description: stage.description || '',
  startAt: toISOFromLocal(stage.startAt),
  isSystemDefault: !!(stage.isSystemDefault || SYSTEM_STAGE_KEYS.includes(stage.key)),
  allowEdit: stage.allowEdit === false ? false : !SYSTEM_STAGE_KEYS.includes(stage.key)
}));

const validateStagesPayload = (payload) => {
  if (!Array.isArray(payload) || payload.length === 0) {
    return { valid: false, message: '请至少设置一个阶段', sorted: [] };
  }

  const missing = payload.find(stage => !stage.startAt);
  if (missing) {
    return { valid: false, message: `请为阶段「${missing.name}」设置时间`, sorted: [] };
  }

  const sorted = payload.slice().sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = new Date(sorted[i - 1].startAt).getTime();
    const current = new Date(sorted[i].startAt).getTime();
    if (current < prev) {
      return { valid: false, message: '阶段时间需要从早到晚排列，请重新调整时间顺序', sorted: [] };
    }
  }

  const kickoff = sorted.find(stage => stage.key === 'kickoff');
  const closing = sorted.find(stage => stage.key === 'closing');
  if (kickoff && closing) {
    if (new Date(kickoff.startAt).getTime() > new Date(closing.startAt).getTime()) {
      return { valid: false, message: '「活动结束」时间必须晚于「活动开始」时间', sorted: [] };
    }
  }

  return { valid: true, message: '', sorted };
};

const computeCurrentStageLocal = (stages, now) => {
  if (!Array.isArray(stages) || stages.length === 0) return null;
  const sorted = stages
    .map(stage => ({
      ...stage,
      startAt: stage.startAt ? new Date(stage.startAt) : null
    }))
    .filter(stage => stage.startAt && !Number.isNaN(stage.startAt.getTime()))
    .sort((a, b) => a.startAt - b.startAt);
  if (!sorted.length) return null;

  const reference = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(reference.getTime())) return sorted[0];

  let current = sorted[0];
  for (const stage of sorted) {
    if (stage.startAt.getTime() <= reference.getTime()) {
      current = stage;
    } else {
      break;
    }
  }
  return current;
};

const resolveStageStatus = (stage, now, nextStageStart) => {
  if (!stage) return 'upcoming';
  const start = stage.startAt ? new Date(stage.startAt) : null;
  const reference = now instanceof Date ? now : new Date(now);
  if (!start || Number.isNaN(start.getTime()) || Number.isNaN(reference.getTime())) {
    return 'upcoming';
  }

  if (reference.getTime() < start.getTime()) {
    return 'upcoming';
  }

  if (nextStageStart) {
    const next = new Date(nextStageStart);
    if (!Number.isNaN(next.getTime()) && reference.getTime() >= next.getTime()) {
      return 'completed';
    }
  }

  return 'active';
};

const formatStageRange = (stage, index, stages) => {
  if (!stage || !stage.startAt) return '未设置';
  const start = new Date(stage.startAt);
  const next = index < stages.length - 1 ? new Date(stages[index + 1].startAt) : null;
  const timeOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  };
  const startLabel = start.toLocaleString(undefined, timeOptions);
  if (!next || Number.isNaN(next.getTime())) {
    return `${startLabel} 起`;
  }
  const nextLabel = next.toLocaleString(undefined, timeOptions);
  return `${startLabel} → ${nextLabel}`;
};

const formatStageTimeLabel = (value) => {
  if (!value) return '未设置';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '未设置';
  return date.toLocaleString(undefined, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function Activity({ userInfo, isAdmin, onBack, maintenanceStatus }) {
  const [activities, setActivities] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [message, setMessage] = useState('');
  const [likedIds, setLikedIds] = useState(() => {
    const saved = localStorage.getItem('liked_activity_ids');
    return saved ? JSON.parse(saved) : [];
  });
  const [favoriteIds, setFavoriteIds] = useState(() => {
    const saved = localStorage.getItem('favorite_activity_ids');
    return saved ? JSON.parse(saved) : [];
  });
  const [latestServerTime, setLatestServerTime] = useState(null);
  const [serverOffset, setServerOffset] = useState(0);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [stageEditor, setStageEditor] = useState(null);
  const [stageEditorDrafts, setStageEditorDrafts] = useState([]);
  const [stageEditorMessage, setStageEditorMessage] = useState('');
  const [stageEditorSubmitting, setStageEditorSubmitting] = useState(false);

  const serverNow = useMemo(() => new Date(nowTick - serverOffset), [nowTick, serverOffset]);
  const stageEditorOverlay = stageEditor ? (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        maxWidth: '720px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        padding: '24px 28px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, color: '#2c3e50' }}>编辑阶段：{stageEditor.title}</h3>
            <div style={{ fontSize: 12, color: '#7f8c8d', marginTop: 6 }}>实时服务器时间：{serverNow.toLocaleString()}</div>
          </div>
          <button
            onClick={handleCloseStageEditor}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#95a5a6'
            }}
          >
            ×
          </button>
        </div>

        {stageEditorMessage && (
          <div style={{
            background: '#fdecea',
            border: '1px solid #f5c2c7',
            color: '#b02a37',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 16,
            fontSize: 13
          }}>
            {stageEditorMessage}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {stageEditorDrafts.map((stage, index) => {
            const isSystemStage = stage.isSystemDefault || SYSTEM_STAGE_KEYS.includes(stage.key);
            return (
              <div
                key={stage.key}
                style={{
                  border: '1px solid #e0e6ed',
                  borderRadius: 10,
                  padding: '16px 18px',
                  background: isSystemStage ? '#f7fbff' : '#ffffff'
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                  <input
                    type="text"
                    value={stage.name}
                    onChange={e => handleStageEditorStageChange(stage.key, { name: e.target.value })}
                    disabled={isSystemStage}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #ccd6dd',
                      background: isSystemStage ? '#eef3f8' : '#fff',
                      fontWeight: 'bold',
                      color: '#2c3e50'
                    }}
                  />
                  {!isSystemStage && (
                    <button
                      onClick={() => handleStageEditorRemoveStage(stage.key)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: 'none',
                        background: '#e74c3c',
                        color: '#fff',
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      删除
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#7f8c8d', marginBottom: 6 }}>阶段开始时间 *</label>
                    <input
                      type="datetime-local"
                      value={stage.startAt || ''}
                      onChange={e => handleStageEditorStageChange(stage.key, { startAt: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: 8,
                        border: '1px solid #ccd6dd'
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#7f8c8d', marginBottom: 6 }}>阶段说明 (选填)</label>
                  <textarea
                    value={stage.description || ''}
                    onChange={e => handleStageEditorStageChange(stage.key, { description: e.target.value })}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: 8,
                      border: '1px solid #ccd6dd',
                      resize: 'vertical',
                      minHeight: 70
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={handleStageEditorAddStage}
            style={{
              padding: '10px 16px',
              background: '#1abc9c',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            + 添加阶段
          </button>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleCloseStageEditor}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid #ccd6dd',
                background: '#fff',
                color: '#2c3e50',
                cursor: 'pointer'
              }}
            >
              取消
            </button>
            <button
              onClick={handleStageEditorSubmit}
              disabled={stageEditorSubmitting}
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                border: 'none',
                background: stageEditorSubmitting ? '#95a5a6' : '#27ae60',
                color: '#fff',
                fontWeight: 'bold',
                cursor: stageEditorSubmitting ? 'not-allowed' : 'pointer',
                minWidth: 120
              }}
            >
              {stageEditorSubmitting ? '保存中...' : '保存阶段'}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!latestServerTime) return;
    const serverTimeMs = new Date(latestServerTime).getTime();
    if (Number.isNaN(serverTimeMs)) return;
    setServerOffset(Date.now() - serverTimeMs);
    setNowTick(Date.now());
  }, [latestServerTime]);

  const loadActivities = async () => {
    try {
      const data = await api.activity.getAll();
      const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
      setActivities(items);
      if (data?.serverTime) {
        setLatestServerTime(data.serverTime);
      }
    } catch (error) {
      console.error('加载活动失败:', error);
      setActivities([]);
    }
  };

  const handleLike = async (id) => {
    if (!userInfo || !userInfo.name) {
      alert('请先完善个人信息');
      return;
    }
    
    try {
      const data = await api.activity.like(id, userInfo.name);
      setActivities(prev => prev.map(item => item._id === id ? data : item));
      if (data?.serverTime) {
        setLatestServerTime(data.serverTime);
      }
      
      const isLiked = data.likedUsers && data.likedUsers.includes(userInfo.name);
      let newLiked;
      if (isLiked) {
        newLiked = likedIds.includes(id) ? likedIds : [...likedIds, id];
      } else {
        newLiked = likedIds.filter(_id => _id !== id);
      }
      setLikedIds(newLiked);
      localStorage.setItem('liked_activity_ids', JSON.stringify(newLiked));
    } catch (error) {
      console.error('点赞失败:', error);
      alert('操作失败，请重试');
    }
  };

  const handleFavorite = async (id) => {
    if (!userInfo || !userInfo.name) {
      alert('请先完善个人信息');
      return;
    }
    
    try {
      const data = await api.activity.favorite(id, userInfo.name);
      setActivities(prev => prev.map(item => item._id === id ? data : item));
      if (data?.serverTime) {
        setLatestServerTime(data.serverTime);
      }
      
      const isFavorited = data.favorites && data.favorites.includes(userInfo.name);
      let newFavorites;
      if (isFavorited) {
        newFavorites = favoriteIds.includes(id) ? favoriteIds : [...favoriteIds, id];
      } else {
        newFavorites = favoriteIds.filter(_id => _id !== id);
      }
      setFavoriteIds(newFavorites);
      localStorage.setItem('favorite_activity_ids', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('收藏失败:', error);
      alert('操作失败，请重试');
    }
  };

  const handleDelete = async (id) => {
    if (!userInfo || !userInfo.name) {
      setMessage('请先完善个人信息');
      return;
    }

    if (!window.confirm('确定要删除这个活动吗？此操作不可恢复。')) {
      return;
    }

    try {
      await api.activity.delete(id, userInfo.name, isAdmin || false);
      setActivities(prev => prev.filter(item => item._id !== id));
      setMessage('活动已删除');
    } catch (error) {
      console.error('删除失败:', error);
      setMessage('删除失败，请重试');
    }
  };

  const handleOpenStageEditor = useCallback((activity) => {
    if (!activity) return;
    const drafts = (activity.stages || []).map(stage => ({
      key: stage.key || generateLocalStageKey(),
      name: stage.name || SYSTEM_STAGE_NAMES[stage.key] || `阶段`,
      startAt: formatDateTimeLocal(stage.startAt),
      description: stage.description || '',
      isSystemDefault: stage.isSystemDefault || SYSTEM_STAGE_KEYS.includes(stage.key),
      allowEdit: stage.allowEdit === false ? false : !SYSTEM_STAGE_KEYS.includes(stage.key)
    }));
    setStageEditor({
      activityId: activity._id,
      title: activity.title
    });
    setStageEditorDrafts(drafts.length ? drafts : createDefaultStageDrafts());
    setStageEditorMessage('');
  }, []);

  const handleCloseStageEditor = useCallback(() => {
    setStageEditor(null);
    setStageEditorDrafts([]);
    setStageEditorSubmitting(false);
    setStageEditorMessage('');
  }, []);

  const handleStageEditorStageChange = useCallback((stageKey, updates) => {
    setStageEditorDrafts(prev => prev.map(stage => stage.key === stageKey ? { ...stage, ...updates } : stage));
  }, []);

  const handleStageEditorAddStage = useCallback(() => {
    setStageEditorDrafts(prev => {
      const next = [...prev];
      const newStage = {
        key: generateLocalStageKey(),
        name: `新增阶段${prev.filter(stage => !stage.isSystemDefault).length + 1}`,
        startAt: prev.find(stage => stage.key === 'closing')?.startAt || prev.find(stage => stage.key === 'kickoff')?.startAt || '',
        description: '',
        isSystemDefault: false,
        allowEdit: true
      };
      const closingIndex = next.findIndex(stage => stage.key === 'closing');
      if (closingIndex === -1) {
        next.push(newStage);
      } else {
        next.splice(closingIndex, 0, newStage);
      }
      return next;
    });
  }, []);

  const handleStageEditorRemoveStage = useCallback((stageKey) => {
    setStageEditorDrafts(prev => prev.filter(stage => stage.key !== stageKey));
  }, []);

  const handleStageEditorSubmit = useCallback(async () => {
    if (!stageEditor) return;
    const payload = convertStageDraftsToPayload(stageEditorDrafts);
    const validation = validateStagesPayload(payload);
    if (!validation.valid) {
      setStageEditorMessage(validation.message);
      return;
    }

    const kickoffStage = validation.sorted.find(stage => stage.key === 'kickoff');
    const closingStage = validation.sorted.find(stage => stage.key === 'closing');

    setStageEditorSubmitting(true);
    try {
      const updated = await api.activity.update(stageEditor.activityId, {
        stages: validation.sorted,
        startDate: kickoffStage ? kickoffStage.startAt : undefined,
        endDate: closingStage ? closingStage.startAt : undefined,
        authorName: userInfo?.name,
        isAdmin: !!isAdmin
      });
      setActivities(prev => prev.map(item => item._id === updated._id ? updated : item));
      if (updated?.serverTime) {
        setLatestServerTime(updated.serverTime);
      }
      handleCloseStageEditor();
    } catch (error) {
      setStageEditorMessage(error.message || '更新阶段失败，请稍后重试');
    } finally {
      setStageEditorSubmitting(false);
    }
  }, [handleCloseStageEditor, isAdmin, stageEditor, stageEditorDrafts, userInfo?.name]);


  if (showCreate) {
    return (
      <>
        {stageEditorOverlay}
        <CreateActivityForm
          onBack={() => setShowCreate(false)}
          userInfo={userInfo}
          onSuccess={loadActivities}
          maintenanceStatus={maintenanceStatus}
        />
      </>
    );
  }

  return (
    <>
      {stageEditorOverlay}
      <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
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
        <h2 style={{ margin: 0, color: '#2c3e50', flex: 1 }}>活动展示</h2>
        <button 
          onClick={() => {
            if (maintenanceStatus.isEnabled && !userInfo?.isAdmin) {
              alert(maintenanceStatus.message || '网站正在维护中，暂时无法创建活动');
              return;
            }
            setShowCreate(true);
          }}
          disabled={maintenanceStatus.isEnabled && !userInfo?.isAdmin}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: (maintenanceStatus.isEnabled && !userInfo?.isAdmin) ? '#95a5a6' : '#27ae60', 
            color: 'white', 
            border: 'none', 
            borderRadius: 8,
            cursor: (maintenanceStatus.isEnabled && !userInfo?.isAdmin) ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            opacity: (maintenanceStatus.isEnabled && !userInfo?.isAdmin) ? 0.6 : 1
          }}
        >
          {maintenanceStatus.isEnabled && !userInfo?.isAdmin ? '+ 维护中' : '+ 创建活动'}
        </button>
      </div>

      {/* 消息显示 */}
      {message && (
        <div style={{ 
          marginBottom: 20, 
          padding: '15px', 
          background: message.includes('成功') || message.includes('已') ? '#d4edda' : '#f8d7da',
          color: message.includes('成功') || message.includes('已') ? '#155724' : '#721c24',
          borderRadius: 8,
          border: `1px solid ${message.includes('成功') || message.includes('已') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {activities.map(activity => {
          const stages = Array.isArray(activity.stages)
            ? activity.stages.slice().sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
            : [];
          const currentStageLocal = computeCurrentStageLocal(stages, serverNow) || activity.currentStage;
          const userCanManageStages = !!(userInfo && (activity.authorName === userInfo.name || isAdmin));
          const currentStageName = currentStageLocal ? currentStageLocal.name : '未开始';
          return (
          <div key={activity._id} data-activity-id={activity._id} style={{ 
            border: '1px solid #ecf0f1', 
            borderRadius: 12,
            padding: 20,
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 15 }}>
              <Avatar 
                name={activity.authorName || activity.author || '用户'} 
                size={45}
                style={{ marginRight: 15 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: 4, color: '#2c3e50' }}>
                  {activity.authorName || activity.author}
                </div>
                <div style={{ fontSize: '14px', color: '#7f8c8d', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>{activity.authorClass} • {new Date(activity.createdAt).toLocaleString()}</span>
                </div>
              </div>
              {/* 删除按钮 - 只有作者本人或管理员可以删除 */}
              {(userInfo && (activity.authorName === userInfo.name || isAdmin)) && (
                <button
                  onClick={() => handleDelete(activity._id)}
                  style={{
                    padding: '6px 12px',
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  删除
                </button>
              )}
            </div>

            <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#2c3e50' }}>
              {activity.title}
            </h3>
            
            <p style={{ margin: '0 0 15px 0', lineHeight: 1.6, color: '#34495e' }}>
              {activity.description}
            </p>

            {activity.media && activity.media.length > 0 && (
              <div style={{ marginBottom: 15 }}>
                <FilePreview 
                  urls={activity.media} 
                  apiBaseUrl={process.env.NODE_ENV === 'production' ? 'https://platform-program.onrender.com' : 'http://localhost:5000'} 
                />
              </div>
            )}

            {stages.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#2c3e50' }}>
                    阶段进度 · 当前阶段：{currentStageName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                    参考时间：{serverNow.toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }}>
                  {stages.map((stage, index) => {
                    const nextStage = stages[index + 1];
                    const status = resolveStageStatus(stage, serverNow, nextStage?.startAt);
                    const isCurrent = currentStageLocal && stage.key === currentStageLocal.key;
                    const background = status === 'active'
                      ? 'linear-gradient(120deg, #27ae60, #2ecc71)'
                      : status === 'completed'
                        ? '#ecf0f1'
                        : '#eef5ff';
                    const color = status === 'active' ? '#fff' : '#2c3e50';
                    const borderColor = status === 'active'
                      ? '#27ae60'
                      : status === 'completed'
                        ? '#bdc3c7'
                        : '#a0c4ff';
                    return (
                      <div
                        key={stage.key || index}
                        style={{
                          minWidth: 180,
                          flex: '0 0 auto',
                          borderRadius: 10,
                          border: `2px solid ${borderColor}`,
                          background,
                          color,
                          padding: '12px 14px',
                          boxShadow: isCurrent ? '0 6px 18px rgba(46, 204, 113, 0.35)' : '0 2px 8px rgba(0,0,0,0.08)',
                          transition: 'transform 0.2s ease',
                          transform: isCurrent ? 'translateY(-3px)' : 'translateY(0)'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{stage.name}</span>
                          <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: 6, background: status === 'active' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)', color }}>
                            {status === 'active' ? '进行中' : status === 'completed' ? '已完成' : '即将开始'}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.9, lineHeight: 1.5 }}>
                          {formatStageRange(stage, index, stages)}
                        </div>
                        {stage.description && (
                          <div style={{ marginTop: 8, fontSize: '12px', opacity: 0.9, lineHeight: 1.5 }}>
                            {stage.description}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {userCanManageStages && (
                  <div style={{ marginTop: 12, textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenStageEditor(activity)}
                      style={{
                        padding: '8px 16px',
                        background: '#3498db',
                        border: 'none',
                        borderRadius: 8,
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(52, 152, 219, 0.3)'
                      }}
                    >
                      编辑阶段
                    </button>
                  </div>
                )}
              </div>
            )}

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '15px',
              padding: '10px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '14px', color: '#2c3e50' }}>
                <strong>活动时间：</strong>
                {new Date(activity.startDate).toLocaleDateString()} - {new Date(activity.endDate).toLocaleDateString()}
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '15px',
              padding: '10px 0',
              borderTop: '1px solid #ecf0f1'
            }}>
              <button
                onClick={() => handleLike(activity._id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: likedIds.includes(activity._id) ? '2px solid #e74c3c' : '2px solid #bdc3c7',
                  background: likedIds.includes(activity._id) ? '#fff5f5' : '#fff',
                  color: likedIds.includes(activity._id) ? '#e74c3c' : '#7f8c8d',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                <span>点赞</span>
                <span>{activity.likes || 0}</span>
              </button>

              <button
                onClick={() => handleFavorite(activity._id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: favoriteIds.includes(activity._id) ? '2px solid #f39c12' : '2px solid #bdc3c7',
                  background: favoriteIds.includes(activity._id) ? '#fff8e1' : '#fff',
                  color: favoriteIds.includes(activity._id) ? '#f39c12' : '#7f8c8d',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                <span>收藏</span>
                <span>{activity.favorites?.length || 0}</span>
              </button>
            </div>
          </div>);
        })}

        {activities.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
            暂无活动，快来创建第一个活动吧！
          </div>
        )}
      </div>
    </>
  );
}

// 创建活动表单
function CreateActivityForm({ onBack, userInfo, onSuccess, maintenanceStatus }) {
  const initialStageDrafts = useMemo(() => createDefaultStageDrafts(), []);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    image: '',
    media: []
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]); // 保存选择的文件
  const [stageDrafts, setStageDrafts] = useState(() => initialStageDrafts.map(stage => ({ ...stage })));
  const [customStageCount, setCustomStageCount] = useState(() => Math.max(initialStageDrafts.length - SYSTEM_STAGE_KEYS.length, 0));
  const [stageMessage, setStageMessage] = useState('');

  const adjustCustomStageCount = useCallback((targetCustom) => {
    setStageDrafts(prev => {
      const defaults = createDefaultStageDrafts();
      const cloneStage = (stage) => ({ ...stage });
      const findStage = (key) => {
        const existing = prev.find(stage => stage.key === key);
        if (existing) return cloneStage(existing);
        const fallback = defaults.find(stage => stage.key === key);
        return fallback ? cloneStage(fallback) : null;
      };

      const preparation = findStage('preparation');
      const kickoff = findStage('kickoff');
      const closing = findStage('closing');
      const existingCustom = prev
        .filter(stage => !SYSTEM_STAGE_KEYS.includes(stage.key))
        .map(cloneStage);

      let updatedCustom = existingCustom.slice(0, targetCustom);
      while (updatedCustom.length < targetCustom) {
        const lastStage = updatedCustom[updatedCustom.length - 1] || kickoff || preparation;
        updatedCustom.push({
          key: generateLocalStageKey(),
          name: `阶段${updatedCustom.length + 1}`,
          startAt: lastStage?.startAt || formatDateTimeLocal(new Date()),
          description: '',
          isSystemDefault: false,
          allowEdit: true
        });
      }

      const result = [preparation, kickoff, ...updatedCustom, closing].filter(Boolean);
      return result;
    });
    setCustomStageCount(targetCustom);
    setStageMessage('');
  }, []);

  const handleStageDraftChange = useCallback((stageKey, updates) => {
    setStageDrafts(prev => prev.map(stage => stage.key === stageKey ? { ...stage, ...updates } : stage));
    setStageMessage('');
  }, []);

  const handleRemoveCustomStage = useCallback((stageKey) => {
    if (SYSTEM_STAGE_KEYS.includes(stageKey)) {
      return;
    }
    setStageDrafts(prev => {
      const filtered = prev.filter(stage => stage.key !== stageKey);
      const nextCustom = filtered.filter(stage => !SYSTEM_STAGE_KEYS.includes(stage.key)).length;
      setCustomStageCount(nextCustom);
      return filtered;
    });
    setStageMessage('');
  }, []);

  const handleResetStages = useCallback(() => {
    const defaults = createDefaultStageDrafts();
    setStageDrafts(defaults);
    setCustomStageCount(Math.max(defaults.length - SYSTEM_STAGE_KEYS.length, 0));
    setStageMessage('');
  }, []);

  const handleStageCountSelect = useCallback((totalStages) => {
    const targetCustom = Math.max(totalStages - SYSTEM_STAGE_KEYS.length, 0);
    adjustCustomStageCount(targetCustom);
  }, [adjustCustomStageCount]);

  useEffect(() => {
    const kickoffStage = stageDrafts.find(stage => stage.key === 'kickoff');
    const closingStage = stageDrafts.find(stage => stage.key === 'closing');
    setFormData(prev => {
      const nextStart = kickoffStage?.startAt || '';
      const nextEnd = closingStage?.startAt || '';
      const updated = { ...prev };
      let changed = false;
      if (nextStart && prev.startDate !== nextStart) {
        updated.startDate = nextStart;
        changed = true;
      }
      if (nextEnd && prev.endDate !== nextEnd) {
        updated.endDate = nextEnd;
        changed = true;
      }
      return changed ? updated : prev;
    });
  }, [stageDrafts]);

  // 保存草稿到localStorage
  const saveDraft = () => {
    const draft = {
      title: formData.title,
      description: formData.description,
      startDate: formData.startDate,
      endDate: formData.endDate,
      image: formData.image,
      media: formData.media,
    selectedFiles: selectedFiles,
    stageDrafts,
    customStageCount
    };
    localStorage.setItem('activity_draft', JSON.stringify(draft));
  };

  // 从localStorage恢复草稿
  const loadDraft = () => {
    const savedDraft = localStorage.getItem('activity_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(prev => ({
          ...prev,
          title: draft.title || '',
          description: draft.description || '',
          startDate: draft.startDate || '',
          endDate: draft.endDate || '',
          image: draft.image || '',
          media: draft.media || []
        }));
        setSelectedFiles(draft.selectedFiles || []);
        if (Array.isArray(draft.stageDrafts) && draft.stageDrafts.length > 0) {
          setStageDrafts(draft.stageDrafts);
          setCustomStageCount(Math.max(draft.customStageCount ?? (draft.stageDrafts.length - SYSTEM_STAGE_KEYS.length), 0));
        }
      } catch (error) {
        console.error('恢复草稿失败:', error);
      }
    }
  };

  // 清除草稿
  const clearDraft = () => {
    localStorage.removeItem('activity_draft');
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      image: '',
      media: []
    });
    setSelectedFiles([]);
  const defaults = createDefaultStageDrafts();
  setStageDrafts(defaults);
  setCustomStageCount(Math.max(defaults.length - SYSTEM_STAGE_KEYS.length, 0));
  setStageMessage('');
  };

  // 组件加载时恢复草稿
  useEffect(() => {
    loadDraft();
  }, []);

  // 当表单数据变化时自动保存草稿
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft();
    }, 1000); // 1秒后保存，避免频繁保存

    return () => clearTimeout(timer);
  }, [formData, selectedFiles, stageDrafts, customStageCount]);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    // 保存选择的文件
    setSelectedFiles(Array.from(files));

    setUploading(true);
    setUploadProgress(0);
    
    const uploadFormData = new FormData();
    let totalSize = 0;
    Array.from(files).forEach(file => {
      uploadFormData.append('files', file);
      totalSize += file.size;
    });

    const startTime = Date.now();

    try {
      // 使用XMLHttpRequest来获取上传进度
      const xhr = new XMLHttpRequest();
      
      // 监听上传进度
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
          
          // 计算上传速度
          const elapsedTime = (Date.now() - startTime) / 1000;
          const speed = e.loaded / elapsedTime;
          setUploadSpeed(speed);
          
          console.log(`📊 活动文件上传进度: ${percentComplete.toFixed(1)}% (${(speed / 1024 / 1024).toFixed(2)} MB/s)`);
        }
      });

      // 处理响应
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error('网络错误'));
        xhr.ontimeout = () => reject(new Error('上传超时'));
      });

      const baseUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://platform-program.onrender.com' : 'http://localhost:5000');
      
      xhr.open('POST', `${baseUrl}/api/upload`, true);
      xhr.timeout = 1800000; // 30分钟超时
      xhr.send(uploadFormData);

      const data = await uploadPromise;
      
      if (data && data.urls && data.urls.length > 0) {
        setFormData(prev => ({ ...prev, media: [...prev.media, ...data.urls] }));
        setUploadProgress(100);
        alert(` 成功上传 ${data.urls.length} 个文件 (${(totalSize / 1024 / 1024).toFixed(2)}MB)`);
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      alert(' 文件上传失败：' + (error.message || '请检查文件大小和格式'));
      setUploadProgress(0);
    } finally {
      setUploading(false);
      // 3秒后清除进度条
      setTimeout(() => setUploadProgress(0), 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.startDate || !formData.endDate) {
      alert('请填写所有必要信息！');
      return;
    }

    if (!userInfo || !userInfo.name || !userInfo.class) {
      alert('请先在个人信息页面填写姓名和班级信息！');
      return;
    }

    const stagePayload = convertStageDraftsToPayload(stageDrafts);
    const validation = validateStagesPayload(stagePayload);
    if (!validation.valid) {
      setStageMessage(validation.message);
      alert('阶段配置有误：' + validation.message);
      return;
    }

    const kickoffStage = validation.sorted.find(stage => stage.key === 'kickoff');
    const closingStage = validation.sorted.find(stage => stage.key === 'closing');
    setStageMessage('');

    try {
      await api.activity.create({
        ...formData,
        authorName: userInfo.name,
        authorClass: userInfo.class,
        stages: validation.sorted,
        startDate: kickoffStage ? kickoffStage.startAt : formData.startDate,
        endDate: closingStage ? closingStage.startAt : formData.endDate
      });
      
      alert('活动创建成功！');
      // 创建成功后清除草稿
      clearDraft();
      onSuccess();
      onBack();
    } catch (error) {
      alert('创建失败：' + (error.message || '请重试'));
    }
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
        <h2 style={{ margin: 0, color: '#2c3e50' }}>创建活动</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
            活动标题 *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="请输入活动标题"
            style={{ width: '100%', padding: '12px', borderRadius: 8, border: '2px solid #ecf0f1' }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
            活动描述 *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="请描述活动内容..."
            rows={4}
            style={{ width: '100%', padding: '12px', borderRadius: 8, border: '2px solid #ecf0f1', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 15, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
              开始时间 *
            </label>
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => {
                const value = e.target.value;
                setFormData(prev => ({ ...prev, startDate: value }));
                handleStageDraftChange('kickoff', { startAt: value });
              }}
              style={{ width: '100%', padding: '12px', borderRadius: 8, border: '2px solid #ecf0f1' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
              结束时间 *
            </label>
            <input
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => {
                const value = e.target.value;
                setFormData(prev => ({ ...prev, endDate: value }));
                handleStageDraftChange('closing', { startAt: value });
              }}
              style={{ width: '100%', padding: '12px', borderRadius: 8, border: '2px solid #ecf0f1' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 24, border: '1px solid #e0ecff', borderRadius: 12, padding: 18, background: '#f8fbff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', color: '#2c3e50', marginBottom: 4 }}>
                阶段配置 *
              </label>
              <div style={{ fontSize: 12, color: '#7f8c8d' }}>
                默认包含「活动准备」「活动开始」「活动结束」，你可以在两者之间添加自定义阶段。
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: '#34495e' }}>阶段数量</span>
              <select
                value={customStageCount + SYSTEM_STAGE_KEYS.length}
                onChange={e => handleStageCountSelect(Number(e.target.value))}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #ccd6dd',
                  fontSize: '13px'
                }}
              >
                {Array.from({ length: 6 }).map((_, index) => {
                  const total = index + SYSTEM_STAGE_KEYS.length; // start from 3
                  const minTotal = SYSTEM_STAGE_KEYS.length; // 3
                  const actualTotal = Math.max(total, minTotal);
                  return (
                    <option key={actualTotal} value={actualTotal}>
                      {actualTotal} 个阶段
                    </option>
                  );
                })}
              </select>
              <button
                type="button"
                onClick={handleResetStages}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  borderRadius: 6,
                  border: '1px solid #ccd6dd',
                  background: '#fff',
                  cursor: 'pointer',
                  color: '#2c3e50'
                }}
              >
                恢复默认
              </button>
            </div>
          </div>

          {stageMessage && (
            <div style={{ marginBottom: 12, padding: '10px 12px', background: '#fdecea', borderRadius: 8, color: '#b02a37', fontSize: 13 }}>
              {stageMessage}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {stageDrafts.map((stage, index) => {
              const isSystemStage = SYSTEM_STAGE_KEYS.includes(stage.key);
              return (
                <div key={stage.key} style={{ border: '1px solid #d6e4ff', borderRadius: 10, padding: 14, background: isSystemStage ? '#f0f6ff' : '#fff' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                    <input
                      type="text"
                      value={stage.name}
                      onChange={e => handleStageDraftChange(stage.key, { name: e.target.value })}
                      disabled={isSystemStage}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid #ccd6dd',
                        background: isSystemStage ? '#eef3f8' : '#fff',
                        fontWeight: 'bold',
                        color: '#2c3e50'
                      }}
                    />
                    {!isSystemStage && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomStage(stage.key)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: 'none',
                          background: '#e74c3c',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: 12
                        }}
                      >
                        删除
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 12, color: '#7f8c8d', marginBottom: 6 }}>阶段开始时间 *</label>
                      <input
                        type="datetime-local"
                        value={stage.startAt || ''}
                        onChange={e => handleStageDraftChange(stage.key, { startAt: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: 8,
                          border: '1px solid #ccd6dd'
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#7f8c8d', marginBottom: 6 }}>阶段说明 (选填)</label>
                    <textarea
                      value={stage.description || ''}
                      onChange={e => handleStageDraftChange(stage.key, { description: e.target.value })}
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: 8,
                        border: '1px solid #ccd6dd',
                        resize: 'vertical',
                        minHeight: 60
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
            上传文件（可选，最大2GB）
          </label>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ width: '100%', padding: '10px', borderRadius: 8, border: '2px solid #ecf0f1' }}
          />
          
          {/* 实时上传进度条 */}
          {uploading && uploadProgress > 0 && (
            <div style={{ marginTop: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px',
                fontSize: '13px',
                color: '#2c3e50'
              }}>
                <span style={{ fontWeight: 'bold' }}>
                  📊 上传进度: {uploadProgress.toFixed(1)}%
                </span>
                <span style={{ color: '#3498db', fontWeight: '600' }}>
                  {uploadSpeed > 0 ? `⚡ ${(uploadSpeed / 1024 / 1024).toFixed(2)} MB/s` : '计算速度...'}
                </span>
              </div>
              
              <div style={{
                width: '100%',
                height: '28px',
                backgroundColor: '#ecf0f1',
                borderRadius: '14px',
                overflow: 'hidden',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  transition: 'width 0.3s ease, background-color 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: uploadProgress === 100 
                    ? 'linear-gradient(90deg, #27ae60, #2ecc71)' 
                    : 'linear-gradient(90deg, #3498db, #5dade2)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  <span style={{ 
                    color: 'white', 
                    fontWeight: 'bold', 
                    fontSize: '13px',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }}>
                    {uploadProgress === 100 ? ' 完成' : `${uploadProgress.toFixed(0)}%`}
                  </span>
                </div>
              </div>
              
              {uploadProgress === 100 && (
                <div style={{ 
                  marginTop: '10px', 
                  color: '#27ae60', 
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  ✨ 上传完成！
                </div>
              )}
            </div>
          )}
        </div>

        {formData.media.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
              已上传文件预览
            </label>
            <div style={{ 
              border: '1px solid #ecf0f1', 
              borderRadius: 8, 
              padding: 15, 
              background: '#f8f9fa',
              position: 'relative'
            }}>
              <FilePreview 
                urls={formData.media} 
                apiBaseUrl={process.env.NODE_ENV === 'production' ? 'https://platform-program.onrender.com' : 'http://localhost:5000'} 
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 15, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={saveDraft}
              style={{
                padding: '8px 16px',
                background: '#f39c12',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold'
              }}
            >
              保存草稿
            </button>
            <button
              type="button"
              onClick={clearDraft}
              style={{
                padding: '8px 16px',
                background: '#e67e22',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold'
              }}
            >
              清除草稿
            </button>
          </div>
          <div style={{ display: 'flex', gap: 15 }}>
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
                fontSize: '16px'
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
            创建活动
          </button>
        </div>
        </div>
      </form>
    </div>
  );
}