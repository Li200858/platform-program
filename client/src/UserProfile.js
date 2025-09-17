import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';
import api from './api';
import FileUploader from './FileUploader';
import UserManager from './UserManager';

export default function UserProfile({ onBack }) {
  const [userInfo, setUserInfo] = useState({
    name: '',
    class: '',
    avatar: '',
    userId: '',
    isAdmin: false
  });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDataSection, setShowDataSection] = useState(false);
  const [nameLocked, setNameLocked] = useState(false);
  const [identityWarning, setIdentityWarning] = useState('');
  const [importUserId, setImportUserId] = useState('');

  // 生成用户ID的函数
  const generateUserId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `U${timestamp}${randomStr}`.toUpperCase();
  };

  // 从localStorage加载用户信息
  useEffect(() => {
    const savedUserInfo = UserManager.getUserProfile();
    if (savedUserInfo) {
      setUserInfo(savedUserInfo);
      // 检查姓名是否已锁定
      const nameLocked = localStorage.getItem('name_locked') === 'true';
      setNameLocked(nameLocked);
      
      // 检查管理员状态
      if (savedUserInfo.name) {
        checkAdminStatus(savedUserInfo.name);
      }
    }
  }, []);

  // 检查管理员状态
  const checkAdminStatus = async (userName) => {
    try {
      const response = await api.admin.check(userName);
      setUserInfo(prev => ({ ...prev, isAdmin: response.isAdmin }));
    } catch (error) {
      console.error('检查管理员状态失败:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userInfo.name.trim() || !userInfo.class.trim()) {
      setMsg('请填写姓名和班级信息');
      return;
    }

    try {
      setLoading(true);
      
      // 如果是第一次保存姓名，则锁定姓名并生成用户ID
      if (!nameLocked && userInfo.name.trim()) {
        localStorage.setItem('name_locked', 'true');
        setNameLocked(true);
        
        // 生成用户ID
        const newUserId = generateUserId();
        const updatedUserInfo = { ...userInfo, userId: newUserId };
        setUserInfo(updatedUserInfo);
        UserManager.saveUserProfile(updatedUserInfo);
        setMsg(`用户信息保存成功！您的用户ID是：${newUserId}`);
      } else {
        // 保存到localStorage
        UserManager.saveUserProfile(userInfo);
        setMsg('用户信息保存成功！');
      }
      setTimeout(() => {
        if (onBack && typeof onBack === 'function') {
          onBack();
        }
      }, 1500);
    } catch (error) {
      console.error('保存用户信息失败:', error);
      setMsg('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setUserInfo(prev => ({ ...prev, [field]: value }));
    
    // 如果修改了姓名，检查身份冲突
    if (field === 'name' && value.trim()) {
      checkIdentityConflict(value.trim(), userInfo.class);
    }
  };

  // 导入用户数据
  const handleImportData = () => {
    if (!importUserId.trim()) {
      setMsg('请输入用户ID');
      return;
    }

    try {
      const importedData = localStorage.getItem(`user_data_${importUserId}`);
      if (importedData) {
        const parsedData = JSON.parse(importedData);
        
        // 如果导入的数据包含用户信息，直接使用
        if (parsedData.name && parsedData.class) {
          setUserInfo(parsedData);
          UserManager.saveUserProfile(parsedData);
          setMsg(`用户数据导入成功！已导入用户：${parsedData.name} (${parsedData.class})`);
        } else if (parsedData.profile) {
          // 如果导入的数据包含profile字段，使用profile数据
          setUserInfo(parsedData.profile);
          UserManager.saveUserProfile(parsedData.profile);
          setMsg(`用户数据导入成功！已导入用户：${parsedData.profile.name} (${parsedData.profile.class})`);
        } else {
          setMsg('导入的数据格式不正确');
          return;
        }
        
        setImportUserId('');
      } else {
        setMsg('未找到该用户ID对应的数据');
      }
    } catch (error) {
      setMsg('导入数据失败，请检查用户ID是否正确');
    }
  };

  // 导出用户数据
  const handleExportData = () => {
    if (!userInfo.userId) {
      setMsg('请先保存个人信息以生成用户ID');
      return;
    }

    try {
      const exportData = {
        ...userInfo,
        exportTime: new Date().toISOString()
      };
      
      localStorage.setItem(`user_data_${userInfo.userId}`, JSON.stringify(exportData));
      setMsg('用户数据已导出，请保存好您的用户ID以便下次导入');
    } catch (error) {
      setMsg('导出数据失败');
    }
  };

  const checkIdentityConflict = async (name, className) => {
    if (!name || !className) return;
    
    try {
      await api.verifyIdentity({
        authorName: name,
        authorClass: className
      });
      setIdentityWarning('');
    } catch (error) {
      console.error('身份验证失败:', error);
      if (error.message.includes('409')) {
        setIdentityWarning(error.message);
      } else {
        setIdentityWarning('');
      }
    }
  };

  const handleAvatarUpload = (url) => {
    const updatedUserInfo = { ...userInfo, avatar: url };
    setUserInfo(updatedUserInfo);
    // 立即保存头像到localStorage
    UserManager.saveUserProfile(updatedUserInfo);
    setMsg('头像上传成功！');
  };

  const handleDownloadData = () => {
    UserManager.downloadUserData();
    setMsg('用户数据已下载！');
  };

  const handleUploadData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    UserManager.uploadUserData(file)
      .then((message) => {
        setMsg(message);
        // 重新加载用户信息
        const savedUserInfo = UserManager.getUserProfile();
        if (savedUserInfo) {
          setUserInfo(savedUserInfo);
        }
      })
      .catch((error) => {
        setMsg(`导入失败: ${error}`);
      });
  };

  return (
    <div style={{ 
      maxWidth: 600, 
      margin: '40px auto', 
      background: '#fff', 
      borderRadius: 15, 
      padding: 30, 
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: 30,
        paddingBottom: 20,
        borderBottom: '2px solid #ecf0f1'
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            marginRight: 15,
            color: '#7f8c8d'
          }}
        >
          ←
        </button>
        <div>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>
            用户信息设置
          </h2>
          <div style={{ 
            marginTop: 5, 
            fontSize: '14px', 
            color: userInfo?.isAdmin ? '#e74c3c' : '#27ae60',
            fontWeight: 'bold'
          }}>
            身份: {userInfo?.isAdmin ? '管理员' : '用户'}
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* 头像设置 */}
        <div style={{ marginBottom: 25, textAlign: 'center' }}>
          <label style={{ display: 'block', marginBottom: 15, fontWeight: 'bold', color: '#2c3e50' }}>
            头像设置
          </label>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 15 }}>
            <Avatar 
              src={userInfo.avatar} 
              name={userInfo.name || '用户'} 
              size={80}
              style={{ border: '3px solid #3498db' }}
            />
            <div>
              <FileUploader onUpload={handleAvatarUpload} />
              <p style={{ 
                fontSize: '12px', 
                color: '#7f8c8d', 
                margin: '5px 0 0 0',
                textAlign: 'center'
              }}>
                支持图片格式，建议尺寸 200x200
              </p>
            </div>
          </div>
        </div>

        {/* 姓名输入 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
            姓名 * {nameLocked && <span style={{ color: '#e74c3c', fontSize: '12px' }}>(已锁定，不可修改)</span>}
          </label>
          <input
            type="text"
            value={userInfo.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="请输入您的真实姓名"
            disabled={nameLocked}
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: 8, 
              border: '2px solid #ecf0f1',
              fontSize: '14px',
              backgroundColor: nameLocked ? '#f8f9fa' : 'white',
              color: nameLocked ? '#6c757d' : '#2c3e50',
              cursor: nameLocked ? 'not-allowed' : 'text'
            }}
          />
          {nameLocked && (
            <div style={{ 
              fontSize: '12px', 
              color: '#e74c3c', 
              marginTop: '5px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              姓名一旦设置保存后就不能再修改，请确保输入正确
            </div>
          )}
          {identityWarning && (
            <div style={{ 
              fontSize: '12px', 
              color: '#e74c3c', 
              marginTop: '5px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '8px',
              backgroundColor: '#f8d7da',
              borderRadius: '4px',
              border: '1px solid #f5c6cb'
            }}>
              {identityWarning}
            </div>
          )}
        </div>

        {/* 班级输入 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
            班级 *
          </label>
          <input
            type="text"
            value={userInfo.class || ''}
            onChange={(e) => handleInputChange('class', e.target.value)}
            placeholder="请输入您的班级"
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: 8, 
              border: '2px solid #ecf0f1',
              fontSize: '14px'
            }}
          />
        </div>

        {/* 用户ID显示 */}
        {userInfo.userId && (
          <div style={{ marginBottom: 20, padding: '15px', backgroundColor: '#f8f9fa', borderRadius: 8, border: '1px solid #e9ecef' }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
              用户ID
            </label>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              marginBottom: '10px'
            }}>
              <input
                type="text"
                value={userInfo.userId || ''}
                readOnly
                style={{ 
                  flex: 1,
                  padding: '8px', 
                  borderRadius: 4, 
                  border: '1px solid #ced4da',
                  backgroundColor: '#e9ecef',
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(userInfo.userId);
                  setMsg('用户ID已复制到剪贴板');
                }}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                复制
              </button>
            </div>
            <p style={{ 
              fontSize: '12px', 
              color: '#6c757d', 
              margin: 0,
              lineHeight: '1.4'
            }}>
              请保存好您的用户ID，在更换浏览器或设备时，可以通过此ID导入您的所有数据。
            </p>
          </div>
        )}

        {/* 导入用户数据 */}
        <div style={{ marginBottom: 20, padding: '15px', backgroundColor: '#e8f4fd', borderRadius: 8, border: '1px solid #bee5eb' }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
            导入用户数据
          </label>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            marginBottom: '10px'
          }}>
            <input
              type="text"
              value={importUserId}
              onChange={(e) => setImportUserId(e.target.value)}
              placeholder="请输入用户ID"
              style={{ 
                flex: 1,
                padding: '8px', 
                borderRadius: 4, 
                border: '1px solid #ced4da',
                fontSize: '14px'
              }}
            />
            <button
              type="button"
              onClick={handleImportData}
              style={{
                padding: '8px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              导入
            </button>
          </div>
          <p style={{ 
            fontSize: '12px', 
            color: '#6c757d', 
            margin: 0,
            lineHeight: '1.4'
          }}>
            如果您之前保存过用户ID，可以在这里输入ID来导入您的所有数据。
          </p>
        </div>

        {msg && (
          <div style={{ 
            color: msg.includes('成功') ? '#27ae60' : '#e74c3c', 
            marginBottom: 20,
            padding: '12px 16px',
            backgroundColor: msg.includes('成功') ? '#d5f4e6' : '#fadbd8',
            border: `1px solid ${msg.includes('成功') ? '#a9dfbf' : '#f1948a'}`,
            borderRadius: 8,
            fontSize: '14px'
          }}>
            {msg}
          </div>
        )}

        <div style={{ display: 'flex', gap: 15, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 30px',
              backgroundColor: loading ? '#bdc3c7' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#2980b9';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#3498db';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            {loading ? '保存中...' : '保存信息'}
          </button>
          
          <button
            type="button"
            onClick={() => setShowDataSection(!showDataSection)}
            style={{
              padding: '12px 20px',
              backgroundColor: '#f8f9fa',
              color: '#6c757d',
              border: '1px solid #dee2e6',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {showDataSection ? '隐藏数据管理' : '数据管理'}
          </button>
        </div>
      </form>

      {/* 数据管理部分 */}
      {showDataSection && (
        <div style={{ 
          marginTop: 30, 
          padding: '20px', 
          backgroundColor: '#e8f4fd', 
          borderRadius: 8,
          border: '1px solid #b3d9ff'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>数据管理</h4>
          <p style={{ margin: '0 0 15px 0', color: '#6c757d', fontSize: '14px' }}>
            您可以通过以下方式管理您的数据：<br/>
            1. <strong>用户ID方式</strong>：保存好您的用户ID，在新设备上直接输入ID即可导入所有数据<br/>
            2. <strong>文件方式</strong>：导出数据文件，在新设备上上传文件来导入数据
          </p>
          <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap' }}>
            <button
              onClick={handleExportData}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              导出数据
            </button>
            <button
              onClick={handleDownloadData}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              下载数据
            </button>
            <label style={{
              padding: '10px 20px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'inline-block'
            }}>
              📤 导入数据
              <input
                type="file"
                accept=".json"
                onChange={handleUploadData}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      )}

      <div style={{ 
        marginTop: 30, 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: 8,
        border: '1px solid #e9ecef'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>信息说明</h4>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#6c757d', fontSize: '14px', lineHeight: '1.6' }}>
          <li>您的姓名和班级信息将用于作品发布和评论显示</li>
          <li>头像将显示在您的作品和评论旁边</li>
          <li>信息仅存储在您的浏览器中，保护您的隐私</li>
          <li>使用数据管理功能可以在不同浏览器间同步数据</li>
        </ul>
      </div>
    </div>
  );
}
