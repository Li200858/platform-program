import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';
import { useUserID } from './UserIDManager';
import api from './api';

export default function UserProfile({ onBack, onUserInfoUpdate }) {
  const { userID } = useUserID();
  const [userInfo, setUserInfo] = useState({
    name: '',
    class: ''
  });
  const [message, setMessage] = useState('');
  const [userRole, setUserRole] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [nameEdited, setNameEdited] = useState(false);

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

  const handleSave = async () => {
    if (!userInfo.name || !userInfo.class) {
      setMessage('请填写姓名和班级');
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
        setMessage('本地保存成功，但同步到服务器失败，请检查网络连接');
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
            }
          }}
          placeholder="请输入您的姓名"
          disabled={nameEdited}
          style={{ 
            width: '100%', 
            padding: '12px', 
            borderRadius: 8, 
            border: '2px solid #ecf0f1',
            fontSize: '16px',
            backgroundColor: nameEdited ? '#f8f9fa' : 'white',
            color: nameEdited ? '#6c757d' : '#2c3e50'
          }}
        />
        {!nameEdited && (
          <div style={{ fontSize: '12px', color: '#e74c3c', marginTop: '5px' }}>
            注意：姓名只能设置一次，请谨慎填写
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