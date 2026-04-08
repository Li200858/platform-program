import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';
import { useUserID } from './UserIDManager';
import api from './api';

export default function UserProfile({ onBack, onUserInfoUpdate }) {
  const { userID, setSessionFromServerUser } = useUserID();
  const [userInfo, setUserInfo] = useState({
    name: '',
    class: ''
  });
  const [message, setMessage] = useState('');
  const [userRole, setUserRole] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [nameEdited, setNameEdited] = useState(false);
  const [nameChecking, setNameChecking] = useState(false);
  const [nameStatus, setNameStatus] = useState(null); // null, 'checking', 'available', 'taken'

  const [regName, setRegName] = useState('');
  const [regClass, setRegClass] = useState('');
  const [regPin, setRegPin] = useState('');
  const [loginMode, setLoginMode] = useState('pin');
  const [loginName, setLoginName] = useState('');
  const [loginClass, setLoginClass] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginId, setLoginId] = useState('');
  const [superAdminPassword, setSuperAdminPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPin2, setNewPin2] = useState('');

  useEffect(() => {
    const loadUserInfo = () => {
      const saved = localStorage.getItem('user_profile');
      const nameEditedFlag = localStorage.getItem('name_edited');
      if (saved) {
        setUserInfo(JSON.parse(saved));
      }
      if (nameEditedFlag === 'true') {
        setNameEdited(true);
      }
    };
    
    loadUserInfo();
    
    // 监听localStorage变化，当用户信息被更新时自动刷新
    const handleStorageChange = (e) => {
      if (e.key === 'user_profile') {
        loadUserInfo();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // 定期检查localStorage变化（用于同一窗口内的更新）
    const interval = setInterval(loadUserInfo, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // 检查用户身份
  useEffect(() => {
    const checkUserRole = async () => {
      if (userInfo.name) {
        try {
          const data = await api.admin.check(userInfo.name);
          setIsAdmin(data.isAdmin || false);
          setUserRole(data.isInitial ? '超级管理员' : (data.isAdmin ? '管理员' : '普通用户'));
        } catch (error) {
          console.error('检查用户身份失败:', error);
          setUserRole('普通用户');
          setIsAdmin(false);
        }
      }
    };

    checkUserRole();
  }, [userInfo.name]);

  // 检查姓名是否可用
  const checkNameAvailability = async (name) => {
    if (!name || name.trim() === '') {
      setNameStatus(null);
      return;
    }

    setNameChecking(true);
    setNameStatus('checking');

    try {
      const result = await api.user.checkName({
        name: name.trim(),
        userID: userID
      });

      if (result.available) {
        setNameStatus('available');
      } else {
        setNameStatus('taken');
      }
    } catch (error) {
      console.error('检查姓名失败:', error);
      setNameStatus('taken');
    } finally {
      setNameChecking(false);
    }
  };

  const handleSave = async () => {
    if (!userInfo.name || !userInfo.class) {
      setMessage('请填写姓名和班级');
      return;
    }

    // 如果姓名状态是taken，不允许保存
    if (nameStatus === 'taken') {
      setMessage('该姓名已被注册，请使用其他姓名');
      return;
    }

    try {
      // 如果名字被修改了，标记为已编辑
      if (userInfo.name && !nameEdited) {
        setNameEdited(true);
        localStorage.setItem('name_edited', 'true');
      }

      // 保存到本地存储
      localStorage.setItem('user_profile', JSON.stringify(userInfo));
      
      // 同步到后端（建立用户名和ID的绑定关系）
      try {
        const syncResult = await api.user.sync({
          userID: userID,
          name: userInfo.name,
          class: userInfo.class
        });
        
        if (syncResult.success) {
          setMessage('个人信息保存并同步成功！用户名和ID已绑定。');
          console.log('用户信息已同步到服务器:', syncResult.user);
        } else {
          setMessage('本地保存成功，但同步到服务器失败，请检查网络连接');
        }
      } catch (error) {
        console.error('同步到后端失败:', error);
        if (error.message && error.message.includes('该姓名已被注册')) {
          setMessage('该姓名已被其他用户注册，请使用其他姓名');
        } else {
          setMessage('本地保存成功，但同步到服务器失败，请检查网络连接');
        }
      }
      
      // 通知父组件更新用户信息
      if (onUserInfoUpdate) {
        onUserInfoUpdate(userInfo);
      }
    } catch (error) {
      setMessage('保存失败，请重试');
      console.error('保存失败:', error);
    }
  };

  const handleRegister = async () => {
    const n = regName.trim();
    const c = regClass.trim();
    if (!n || !c) {
      setMessage('注册请填写姓名和班级');
      return;
    }
    try {
      const u = await api.user.register({
        name: n,
        class: c,
        pin: regPin.trim() || undefined,
      });
      setSessionFromServerUser(u);
      setUserInfo({ name: u.name, class: u.class });
      setNameEdited(true);
      setRegName('');
      setRegClass('');
      setRegPin('');
      setMessage('注册成功，已使用服务端分配的账号（可与活动报名站相同流程）。');
      if (onUserInfoUpdate) onUserInfoUpdate({ name: u.name, class: u.class });
    } catch (e) {
      setMessage(e.message || '注册失败');
    }
  };

  const handleLogin = async () => {
    const n = loginName.trim();
    const c = loginClass.trim();
    try {
      const body = { name: n, class: c, loginMode };
      if (loginMode === 'pin') {
        body.pin = loginPin.trim();
      } else {
        body.userID = loginId.trim();
      }
      if (superAdminPassword) body.password = superAdminPassword;
      const u = await api.user.login(body);
      setSessionFromServerUser(u);
      setUserInfo({ name: u.name, class: u.class });
      setNameEdited(true);
      setSuperAdminPassword('');
      setMessage('登录成功');
      if (onUserInfoUpdate) onUserInfoUpdate({ name: u.name, class: u.class });
    } catch (e) {
      if (e.requirePassword) {
        setMessage('当前账号需要输入超级管理员密码（Render 上配置 SUPER_ADMIN_PASSWORD）。');
        return;
      }
      if (e.requirePinLogin) {
        setLoginMode('pin');
        setMessage('该账号已设置 PIN，请使用 PIN 方式登录。');
        return;
      }
      setMessage(e.message || '登录失败');
    }
  };

  const handleSetPin = async () => {
    if (!userID) return;
    if (newPin !== newPin2) {
      setMessage('两次输入的 PIN 不一致');
      return;
    }
    try {
      const pinVal = newPin.trim();
      await api.user.setPin({
        userID,
        operatorID: userID,
        pin: pinVal || null,
      });
      localStorage.setItem('user_has_pin', pinVal ? '1' : '0');
      setNewPin('');
      setNewPin2('');
      setMessage(pinVal ? 'PIN 已保存' : '已清除 PIN');
    } catch (e) {
      setMessage(e.message || '设置 PIN 失败');
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
        <h2 style={{ margin: 0, color: '#2c3e50' }}>个人信息设置</h2>
      </div>

      <details
        style={{
          marginBottom: 24,
          padding: 16,
          background: '#f8fafc',
          borderRadius: 10,
          border: '1px solid #e2e8f0',
        }}
      >
        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#1e293b' }}>
          账号注册 / 登录（与活动报名站一致：8 位 ID、PIN）
        </summary>
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 12px' }}>
            新用户建议先「注册」获取服务端 ID；已有账号可用 PIN 或「姓名+班级+ID」登录。旧版本地长数字 ID 仍可在下方资料区同步。
          </p>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#334155' }}>注册</div>
            <input
              placeholder="姓名"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: '1px solid #cbd5e1' }}
            />
            <input
              placeholder="班级"
              value={regClass}
              onChange={(e) => setRegClass(e.target.value)}
              style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: '1px solid #cbd5e1' }}
            />
            <input
              placeholder="PIN（可选，4-6 位数字）"
              value={regPin}
              onChange={(e) => setRegPin(e.target.value)}
              style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: '1px solid #cbd5e1' }}
            />
            <button
              type="button"
              onClick={handleRegister}
              style={{
                padding: '10px 18px',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              注册
            </button>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#334155' }}>登录</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button
                type="button"
                onClick={() => setLoginMode('pin')}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  background: loginMode === 'pin' ? '#dbeafe' : '#fff',
                  cursor: 'pointer',
                }}
              >
                PIN 登录
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('id')}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  background: loginMode === 'id' ? '#dbeafe' : '#fff',
                  cursor: 'pointer',
                }}
              >
                ID 登录
              </button>
            </div>
            <input
              placeholder="姓名"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: '1px solid #cbd5e1' }}
            />
            <input
              placeholder="班级"
              value={loginClass}
              onChange={(e) => setLoginClass(e.target.value)}
              style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: '1px solid #cbd5e1' }}
            />
            {loginMode === 'pin' ? (
              <input
                placeholder="PIN（4-6 位）"
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value)}
                style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
            ) : (
              <input
                placeholder="用户 ID（8 位）"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
            )}
            <input
              placeholder="超级管理员密码（仅该角色需要）"
              type="password"
              value={superAdminPassword}
              onChange={(e) => setSuperAdminPassword(e.target.value)}
              style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: '1px solid #cbd5e1' }}
            />
            <button
              type="button"
              onClick={handleLogin}
              style={{
                padding: '10px 18px',
                background: '#0d9488',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              登录
            </button>
          </div>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#334155' }}>设置 / 修改 PIN（当前设备已登录时）</div>
            <input
              placeholder="新 PIN（4-6 位，留空并两次留空可清除）"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: '1px solid #cbd5e1' }}
            />
            <input
              placeholder="确认 PIN"
              value={newPin2}
              onChange={(e) => setNewPin2(e.target.value)}
              style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: '1px solid #cbd5e1' }}
            />
            <button
              type="button"
              onClick={handleSetPin}
              style={{
                padding: '10px 18px',
                background: '#64748b',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              保存 PIN
            </button>
          </div>
        </div>
      </details>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 30 }}>
        <Avatar 
          name={userInfo.name} 
          size={100}
          style={{ marginBottom: '20px' }}
        />
        <button
          onClick={() => {
            if (window.confirm('确定要清除所有本地数据吗？这将删除您的个人信息和设置。')) {
              localStorage.clear();
              setUserInfo({ name: '', class: '' });
              setNameEdited(false);
              setMessage('本地数据已清除，请重新设置个人信息');
            }
          }}
          style={{
            marginTop: '10px',
            padding: '6px 12px',
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          清除本地数据
        </button>
        
        {/* 用户身份显示 */}
        {userInfo.name && (
          <div style={{ 
            marginTop: '15px', 
            padding: '10px 20px', 
            borderRadius: '20px',
            background: isAdmin ? 
              (userRole === '超级管理员' ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)' : 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)') : 
              'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
            {userRole === '超级管理员' && ''}
            {userRole === '管理员' && ''}
            {userRole === '普通用户' && ''}
            {userRole}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
          姓名 * {nameEdited && <span style={{ color: '#e74c3c', fontSize: '12px' }}>(已设置，不可修改)</span>}
        </label>
        <input
          type="text"
          value={userInfo.name}
          onChange={(e) => {
            if (!nameEdited) {
              setUserInfo(prev => ({ ...prev, name: e.target.value }));
              // 延迟检查姓名可用性
              clearTimeout(window.nameCheckTimeout);
              window.nameCheckTimeout = setTimeout(() => {
                checkNameAvailability(e.target.value);
              }, 500);
            }
          }}
          placeholder="请输入您的姓名"
          disabled={nameEdited}
          style={{ 
            width: '100%', 
            padding: '12px', 
            borderRadius: 8, 
            border: `2px solid ${
              nameStatus === 'taken' ? '#e74c3c' : 
              nameStatus === 'available' ? '#27ae60' : 
              '#ecf0f1'
            }`,
            fontSize: '16px',
            backgroundColor: nameEdited ? '#f8f9fa' : 'white',
            color: nameEdited ? '#6c757d' : '#2c3e50'
          }}
        />
        {!nameEdited && (
          <div style={{ fontSize: '12px', marginTop: '5px' }}>
            {nameChecking && (
              <span style={{ color: '#3498db' }}>检查姓名中...</span>
            )}
            {nameStatus === 'available' && (
              <span style={{ color: '#27ae60' }}>✓ 该姓名可用</span>
            )}
            {nameStatus === 'taken' && (
              <span style={{ color: '#e74c3c' }}>✗ 该姓名已被注册，请使用其他姓名</span>
            )}
            {!nameChecking && !nameStatus && userInfo.name && (
              <span style={{ color: '#e74c3c' }}>注意：姓名只能设置一次，请谨慎填写</span>
            )}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 30 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
          班级 *
        </label>
        <input
          type="text"
          value={userInfo.class}
          onChange={(e) => setUserInfo(prev => ({ ...prev, class: e.target.value }))}
          placeholder="请输入您的班级"
          style={{ 
            width: '100%', 
            padding: '12px', 
            borderRadius: 8, 
            border: '2px solid #ecf0f1',
            fontSize: '16px'
          }}
        />
      </div>

      {/* 用户ID显示 */}
      {userID && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: 8,
          border: '1px solid #bbdefb',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '14px', color: '#1976d2', fontWeight: 'bold', marginBottom: '5px' }}>
            🆔 用户唯一ID
          </div>
          <div style={{ 
            fontFamily: 'monospace', 
            fontSize: '12px', 
            color: '#424242',
            wordBreak: 'break-all',
            background: '#fff',
            padding: '8px',
            borderRadius: 4,
            border: '1px solid #e0e0e0'
          }}>
            {userID}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            此ID用于跨设备同步您的数据，可在"数据同步"页面管理
          </div>
        </div>
      )}

      <div style={{ 
        padding: '15px', 
        backgroundColor: '#e8f5e8', 
        borderRadius: 8,
        border: '1px solid #c3e6c3',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '14px', color: '#27ae60', fontWeight: 'bold', marginBottom: '5px' }}>
          提示
        </div>
        <div style={{ fontSize: '13px', color: '#2c3e50', lineHeight: '1.5' }}>
          设置个人信息后，您就可以发布作品、参与评论和互动了。姓名和班级信息将显示在您发布的内容中。
        </div>
      </div>

      {/* 消息显示 */}
      {message && (
        <div style={{ 
          padding: '15px', 
          background: message.includes('成功') ? '#d4edda' : '#f8d7da',
          color: message.includes('成功') ? '#155724' : '#721c24',
          borderRadius: 8,
          border: `1px solid ${message.includes('成功') ? '#c3e6cb' : '#f5c6cb'}`,
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: 15, justifyContent: 'flex-end' }}>
        <button
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
          onClick={handleSave}
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
          保存信息
        </button>
      </div>
    </div>
  );
}