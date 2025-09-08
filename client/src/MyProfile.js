import React, { useEffect, useState } from 'react';
import FileUploader from './FileUploader';
import Avatar from './Avatar';

export default function MyProfile() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [userClass, setUserClass] = useState('');
  const [avatar, setAvatar] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/me', {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    })
      .then(res => res.json())
      .then(data => {
        setName(data.name || '');
        setAge(data.age || '');
        setUserClass(data.class || '');
        setAvatar(data.avatar || '');
        setEmail(data.email || '');
        setRole(data.role || 'user');
      });
  }, []);

  const handleAvatarUpload = (url) => {
    setAvatar(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    
    // 验证年级输入
    if (age && (isNaN(age) || age < 1 || age > 12)) {
      setMsg('年级必须是1-12之间的数字');
      return;
    }
    
    const res = await fetch('/api/me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({ 
        name, 
        age: age ? parseInt(age) : null, 
        class: userClass, 
        avatar 
      })
    });
    const data = await res.json();
    if (res.ok) {
      setMsg('保存成功');
    } else {
      setMsg(data.error || '保存失败');
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'founder': return '创始人';
      case 'admin': return '管理员';
      case 'user': return '用户';
      default: return '用户';
    }
  };

  return (
    <div style={{ 
      maxWidth: 500, 
      margin: '40px auto', 
      background: '#fff', 
      borderRadius: 16, 
      padding: 40, 
      boxShadow: '0 8px 32px rgba(79, 70, 229, 0.12)',
      border: '1px solid #F8FAFC'
    }}>
      <h2 style={{ 
        margin: '0 0 30px 0', 
        color: '#4F46E5', 
        fontSize: '24px', 
        fontWeight: '600',
        textAlign: 'center'
      }}>
        我的信息
      </h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: '600', 
            color: '#374151',
            fontSize: '14px'
          }}>
邮箱（不可修改）：
          </label>
          <div style={{ 
            padding: '12px 16px', 
            backgroundColor: '#F8FAFC', 
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            color: '#6B7280'
          }}>
            {email}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: '600', 
            color: '#374151',
            fontSize: '14px'
          }}>
身份：
          </label>
          <div style={{ 
            padding: '12px 16px', 
            backgroundColor: '#F8FAFC', 
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            color: role === 'founder' ? '#DC2626' : role === 'admin' ? '#D97706' : '#4F46E5',
            fontWeight: '600'
          }}>
            {getRoleText(role)}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: '600', 
            color: '#374151',
            fontSize: '14px'
          }}>
昵称：
          </label>
          <input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            style={{ 
              width: '100%', 
              padding: '12px 16px',
              border: '2px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '14px',
              transition: 'all 0.2s ease',
              outline: 'none'
            }} 
            placeholder="请输入昵称"
            onFocus={e => e.target.style.borderColor = '#4F46E5'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: '600', 
            color: '#374151',
            fontSize: '14px'
          }}>
年级：
          </label>
          <input 
            type="number"
            value={age} 
            onChange={e => setAge(e.target.value)} 
            style={{ 
              width: '100%', 
              padding: '12px 16px',
              border: '2px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '14px',
              transition: 'all 0.2s ease',
              outline: 'none'
            }} 
            placeholder="请输入年级"
            min="1"
            max="12"
            onFocus={e => e.target.style.borderColor = '#4F46E5'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: '600', 
            color: '#374151',
            fontSize: '14px'
          }}>
班级：
          </label>
          <input 
            value={userClass} 
            onChange={e => setUserClass(e.target.value)} 
            style={{ 
              width: '100%', 
              padding: '12px 16px',
              border: '2px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '14px',
              transition: 'all 0.2s ease',
              outline: 'none'
            }} 
            placeholder="请输入班级"
            onFocus={e => e.target.style.borderColor = '#4F46E5'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'}
          />
        </div>

        <div style={{ marginBottom: 25 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: '600', 
            color: '#374151',
            fontSize: '14px'
          }}>
头像：
          </label>
          <div>
            <Avatar 
              src={avatar} 
              name={name || '用户'} 
              size={100}
              style={{ 
                marginBottom: 16,
                border: '3px solid #4F46E5',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
              }}
            />
            <FileUploader
              onUpload={url => {
                // 只允许图片
                if (!url.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
                  alert('只能上传图片格式');
                  return;
                }
                handleAvatarUpload(url);
              }}
            />
          </div>
        </div>

        <button 
          type="submit" 
          style={{ 
            width: '100%',
            padding: '14px 24px', 
            backgroundColor: '#4F46E5', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
          }}
          onMouseEnter={e => {
            e.target.style.backgroundColor = '#3730A3';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            e.target.style.backgroundColor = '#4F46E5';
            e.target.style.transform = 'translateY(0)';
          }}
        >
保存
        </button>
      </form>

      {msg && (
        <div style={{ 
          color: msg === '保存成功' ? '#059669' : '#DC2626', 
          marginTop: 20,
          padding: '12px 16px',
          backgroundColor: msg === '保存成功' ? '#D1FAE5' : '#FEE2E2',
          borderRadius: '8px',
          border: `1px solid ${msg === '保存成功' ? '#A7F3D0' : '#FECACA'}`,
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {msg}
        </div>
      )}
    </div>
  );
}