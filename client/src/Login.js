import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    
    // 输入验证
    if (!email.trim()) {
      setMsg('请输入邮箱');
      return;
    }
    if (!password.trim()) {
      setMsg('请输入密码');
      return;
    }
    if (!isLogin && password.length < 6) {
      setMsg('密码长度至少6位');
      return;
    }
    
    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMsg('请输入有效的邮箱地址');
      return;
    }
    
    const url = isLogin ? '/api/login' : '/api/register';
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        if (isLogin) {
          localStorage.setItem('token', data.token);
          onLogin && onLogin(data.email);
        } else {
          setMsg('注册成功，请登录');
          setIsLogin(true);
        }
      } else {
        setMsg(data.error || '出错了');
      }
    } catch (error) {
      console.error('登录/注册错误:', error);
      setMsg('网络错误，请检查网络连接');
    }
  };

  return (
    <div style={{ maxWidth: 350, margin: '80px auto', padding: 30, background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px #eee' }}>
      <h2 style={{ textAlign: 'center' }}>{isLogin ? '登录' : '注册'}</h2>
      <form onSubmit={handleSubmit}>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="邮箱" required style={inputStyle} />
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="密码" required style={inputStyle} />
        <button type="submit" style={btnStyle}>{isLogin ? '登录' : '注册'}</button>
      </form>
      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <span style={{ color: '#888', cursor: 'pointer' }} onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? '没有账号？注册' : '已有账号？登录'}
        </span>
      </div>
      {msg && <div style={{ color: 'red', marginTop: 10, textAlign: 'center' }}>{msg}</div>}
    </div>
  );
}

const inputStyle = { width: '100%', padding: 10, margin: '10px 0', borderRadius: 5, border: '1px solid #ccc' };
const btnStyle = { width: '100%', padding: 10, borderRadius: 5, border: 'none', background: '#222', color: '#fff', fontSize: 16 };