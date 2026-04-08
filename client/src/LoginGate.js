import React, { useState } from 'react';
import { useUserID } from './UserIDManager';
import api from './api';

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: 8,
  border: '2px solid #e0e4ec',
  fontSize: '15px',
  boxSizing: 'border-box',
};

const cardStyle = {
  maxWidth: 420,
  width: '100%',
  margin: '0 auto',
  background: '#fff',
  borderRadius: 16,
  padding: '32px 28px',
  boxShadow: '0 12px 40px rgba(30, 40, 90, 0.12)',
};

/**
 * 进入网站时的唯一登录/注册界面（无「个人信息」资料编辑页）
 */
export default function LoginGate({ onLoginSuccess }) {
  const { setSessionFromServerUser } = useUserID();
  const [activeTab, setActiveTab] = useState('login');
  const [message, setMessage] = useState('');

  const [regName, setRegName] = useState('');
  const [regClass, setRegClass] = useState('');
  const [regPin, setRegPin] = useState('');
  const [loginMode, setLoginMode] = useState('pin');
  const [logName, setLogName] = useState('');
  const [logClass, setLogClass] = useState('');
  const [logPin, setLogPin] = useState('');
  const [logUserID, setLogUserID] = useState('');

  const applyServerUser = (u, msg) => {
    setSessionFromServerUser(u);
    const profile = {
      name: u.name || '',
      class: u.class || '',
      userID: u.userID,
    };
    setMessage(msg);
    onLoginSuccess(profile);
  };

  const handleRegister = async () => {
    setMessage('');
    const n = regName.trim();
    const c = regClass.trim();
    if (!n || !c) {
      setMessage('请填写姓名和班级');
      return;
    }
    if (regPin && !/^\d{4,6}$/.test(regPin)) {
      setMessage('PIN 须为 4–6 位数字，或留空');
      return;
    }
    try {
      const u = await api.user.register({
        name: n,
        class: c,
        ...(regPin ? { pin: regPin } : {}),
      });
      applyServerUser(
        u,
        `欢迎！您的用户 ID：${u.userID}${u.hasPin ? '（已设置 PIN）' : ''}`
      );
      setRegPin('');
    } catch (e) {
      setMessage(e.message || '注册失败');
    }
  };

  const handleLogin = async () => {
    setMessage('');
    const n = logName.trim();
    const c = logClass.trim();
    try {
      const base =
        loginMode === 'pin'
          ? {
              loginMode: 'pin',
              name: n,
              class: c,
              pin: logPin.trim(),
            }
          : {
              loginMode: 'id',
              userID: logUserID.trim(),
              name: n,
              class: c,
            };
      const u = await api.user.login(base);
      applyServerUser(u, '登录成功');
      setLogPin('');
    } catch (e) {
      if (e.requirePinLogin) setLoginMode('pin');
      setMessage(e.message || '登录失败');
    }
  };

  const tabBtn = (id, label) => (
    <button
      type="button"
      onClick={() => {
        setActiveTab(id);
        setMessage('');
      }}
      style={{
        flex: 1,
        padding: '12px',
        border: 'none',
        borderRadius: 10,
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '15px',
        background: activeTab === id ? '#3949ab' : 'transparent',
        color: activeTab === id ? '#fff' : '#5c6bc0',
        transition: 'background 0.2s',
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box',
        background: 'linear-gradient(160deg, #e8eaf6 0%, #f5f7fb 45%, #eceff8 100%)',
      }}
    >
      <div style={{ marginBottom: 28, textAlign: 'center' }}>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#1a237e', marginBottom: 6 }}>
          海淀外国语国际部艺术平台
        </div>
        <div style={{ fontSize: '13px', color: '#5c6bc0' }}>请先登录或注册后进入</div>
      </div>

      <div style={cardStyle}>
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 22,
            padding: 4,
            background: '#f0f2fa',
            borderRadius: 12,
          }}
        >
          {tabBtn('login', '登录')}
          {tabBtn('register', '注册')}
        </div>

        <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.55, margin: '0 0 18px' }}>
          8 位大写用户 ID，可选 4–6 位 PIN。已设 PIN 的账号须用 PIN 登录。超级管理员在注册时使用姓名「李昌轩」、班级「NEE4」即可，无需额外密码。
        </p>

        {activeTab === 'register' && (
          <div style={{ display: 'grid', gap: 10 }}>
            <input
              style={inputStyle}
              placeholder="姓名"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              autoComplete="name"
            />
            <input
              style={inputStyle}
              placeholder="班级"
              value={regClass}
              onChange={(e) => setRegClass(e.target.value)}
            />
            <input
              style={inputStyle}
              placeholder="可选 PIN（4–6 位数字）"
              value={regPin}
              onChange={(e) => setRegPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            <p style={{ fontSize: '12px', color: '#5c6bc0', margin: 0 }}>
              超级管理员：姓名「李昌轩」+ 班级「NEE4」（须完全一致，含大小写）。
            </p>
            <button
              type="button"
              onClick={handleRegister}
              style={{
                marginTop: 8,
                padding: '14px',
                background: '#3949ab',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
              }}
            >
              注册并进入
            </button>
          </div>
        )}

        {activeTab === 'login' && (
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setLoginMode('pin')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: loginMode === 'pin' ? '#00897b' : '#e0e0e0',
                  color: loginMode === 'pin' ? '#fff' : '#333',
                  fontWeight: 600,
                }}
              >
                PIN 登录
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('id')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: loginMode === 'id' ? '#00897b' : '#e0e0e0',
                  color: loginMode === 'id' ? '#fff' : '#333',
                  fontWeight: 600,
                }}
              >
                ID 登录
              </button>
            </div>
            <input
              style={inputStyle}
              placeholder="姓名"
              value={logName}
              onChange={(e) => setLogName(e.target.value)}
              autoComplete="username"
            />
            <input
              style={inputStyle}
              placeholder="班级"
              value={logClass}
              onChange={(e) => setLogClass(e.target.value)}
            />
            {loginMode === 'pin' ? (
              <input
                style={inputStyle}
                placeholder="PIN（4–6 位）"
                value={logPin}
                onChange={(e) => setLogPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            ) : (
              <input
                style={inputStyle}
                placeholder="用户 ID"
                value={logUserID}
                onChange={(e) => setLogUserID(e.target.value.trim())}
              />
            )}
            <button
              type="button"
              onClick={handleLogin}
              style={{
                marginTop: 8,
                padding: '14px',
                background: '#00897b',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
              }}
            >
              登录
            </button>
          </div>
        )}

        {message && (
          <div
            style={{
              marginTop: 18,
              padding: '12px',
              borderRadius: 8,
              background: message.includes('成功') || message.includes('欢迎') ? '#e8f5e9' : '#ffebee',
              color: message.includes('成功') || message.includes('欢迎') ? '#1b5e20' : '#b71c1c',
              fontSize: '14px',
              textAlign: 'center',
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
