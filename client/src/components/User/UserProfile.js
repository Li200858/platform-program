// 用户信息管理组件
import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Avatar from '../../Avatar';
import FileUploader from '../../FileUploader';
import { useUser } from '../../hooks/useUser';
import { useApi } from '../../hooks/useApi';
import { validation } from '../../utils/validation';

const UserProfile = ({ onBack, onUserInfoUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    avatar: '',
    userId: ''
  });
  const [errors, setErrors] = useState({});
  const [nameLocked, setNameLocked] = useState(false);
  const [showDataSection, setShowDataSection] = useState(false);
  const [importUserId, setImportUserId] = useState('');

  const { userInfo, isLoggedIn, isAdmin, saveUserInfo, updateUserInfo } = useUser();
  const api = useApi();

  // 生成用户ID
  const generateUserId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `U${timestamp}${randomStr}`.toUpperCase();
  };

  // 加载用户信息
  useEffect(() => {
    if (userInfo) {
      setFormData({
        name: userInfo.name || '',
        class: userInfo.class || '',
        avatar: userInfo.avatar || '',
        userId: userInfo.userId || ''
      });
      
      // 检查姓名是否已锁定
      const nameLocked = localStorage.getItem('name_locked') === 'true';
      setNameLocked(nameLocked);
    }
  }, [userInfo]);

  // 处理输入变化
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 清除相关错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 处理头像上传
  const handleAvatarUpload = (url) => {
    setFormData(prev => ({ ...prev, avatar: url }));
    updateUserInfo({ avatar: url });
  };

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 验证表单
    const validationResult = validation.validateUser(formData);
    if (!validationResult.valid) {
      setErrors({ general: validationResult.message });
      return;
    }

    try {
      let userData = { ...formData };
      
      // 如果是第一次保存姓名，则锁定姓名并生成用户ID
      if (!nameLocked && formData.name.trim()) {
        localStorage.setItem('name_locked', 'true');
        setNameLocked(true);
        
        // 生成用户ID
        const newUserId = generateUserId();
        userData.userId = newUserId;
      }

      await saveUserInfo(userData);
      
      // 通知父组件更新
      if (onUserInfoUpdate) {
        onUserInfoUpdate();
      }
      
      // 延迟返回
      setTimeout(() => {
        if (onBack) onBack();
      }, 1500);
      
    } catch (error) {
      setErrors({ general: error.message });
    }
  };

  // 导入用户数据
  const handleImportData = async () => {
    if (!importUserId.trim()) {
      setErrors({ general: '请输入用户ID' });
      return;
    }

    try {
      const userData = await api.user.get(importUserId);
      
      const importedUserInfo = {
        name: userData.name || '',
        class: userData.class || '',
        avatar: userData.avatar || '',
        userId: importUserId,
        isAdmin: userData.isAdmin || false
      };
      
      await saveUserInfo(importedUserInfo);
      setImportUserId('');
      
      // 通知父组件更新
      if (onUserInfoUpdate) {
        onUserInfoUpdate();
      }
      
    } catch (error) {
      setErrors({ general: '导入失败：网络错误或用户ID无效' });
    }
  };

  // 导出用户数据
  const handleExportData = () => {
    if (!formData.userId) {
      setErrors({ general: '请先保存个人信息以生成用户ID' });
      return;
    }

    try {
      const exportData = {
        ...formData,
        exportTime: new Date().toISOString()
      };
      
      localStorage.setItem(`user_data_${formData.userId}`, JSON.stringify(exportData));
      setErrors({ general: '用户数据已导出，请保存好您的用户ID以便下次导入' });
    } catch (error) {
      setErrors({ general: '导出数据失败' });
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto' }}>
      {/* 头部 */}
      <Card style={{ marginBottom: '25px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="secondary"
            onClick={onBack}
            style={{ marginRight: '15px' }}
          >
            ← 返回
          </Button>
          <div>
            <h2 style={{ margin: 0, color: '#2c3e50' }}>
              用户信息设置
            </h2>
            <div style={{ 
              marginTop: '5px', 
              fontSize: '14px', 
              color: isAdmin ? '#e74c3c' : '#27ae60',
              fontWeight: 'bold'
            }}>
              身份: {isAdmin ? '管理员' : '用户'}
            </div>
          </div>
        </div>
      </Card>

      {/* 用户信息表单 */}
      <Card>
        <form onSubmit={handleSubmit}>
          {/* 头像设置 */}
          <div style={{ marginBottom: '25px', textAlign: 'center' }}>
            <label style={{ display: 'block', marginBottom: '15px', fontWeight: 'bold', color: '#2c3e50' }}>
              头像设置
            </label>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '15px' }}>
              <Avatar 
                src={formData.avatar} 
                name={formData.name || '用户'} 
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
          <Input
            type="text"
            label={`姓名 ${nameLocked ? '(已锁定，不可修改)' : ''}`}
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="请输入您的真实姓名"
            disabled={nameLocked}
            required
            error={errors.name}
          />

          {/* 班级输入 */}
          <Input
            type="text"
            label="班级"
            value={formData.class}
            onChange={(e) => handleInputChange('class', e.target.value)}
            placeholder="请输入您的班级"
            required
            error={errors.class}
          />

          {/* 用户ID显示 */}
          {formData.userId && (
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
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
                  value={formData.userId}
                  readOnly
                  style={{ 
                    flex: 1,
                    padding: '8px', 
                    borderRadius: '4px', 
                    border: '1px solid #ced4da',
                    backgroundColor: '#e9ecef',
                    fontSize: '14px',
                    fontFamily: 'monospace'
                  }}
                />
                <Button
                  type="button"
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(formData.userId);
                    setErrors({ general: '用户ID已复制到剪贴板' });
                  }}
                >
                  复制
                </Button>
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
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '8px', border: '1px solid #bee5eb' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
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
                  borderRadius: '4px', 
                  border: '1px solid #ced4da',
                  fontSize: '14px'
                }}
              />
              <Button
                type="button"
                size="small"
                onClick={handleImportData}
                loading={api.loading}
              >
                导入
              </Button>
            </div>
            <p style={{ 
              fontSize: '12px', 
              color: '#6c757d', 
              margin: 0,
              lineHeight: '1.4'
            }}>
              输入您的用户ID即可在任何设备上恢复您的所有数据（姓名、班级、头像、管理员状态等）。
            </p>
          </div>

          {/* 错误信息 */}
          {errors.general && (
            <div style={{ 
              color: errors.general.includes('成功') || errors.general.includes('已复制') ? '#27ae60' : '#e74c3c', 
              marginBottom: '20px',
              padding: '12px 16px',
              backgroundColor: errors.general.includes('成功') || errors.general.includes('已复制') ? '#d5f4e6' : '#fadbd8',
              border: `1px solid ${errors.general.includes('成功') || errors.general.includes('已复制') ? '#a9dfbf' : '#f1948a'}`,
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              {errors.general}
            </div>
          )}

          {/* 按钮组 */}
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              type="submit"
              variant="primary"
              loading={api.loading}
              disabled={api.loading}
            >
              {api.loading ? '保存中...' : '保存信息'}
            </Button>
            
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowDataSection(!showDataSection)}
            >
              {showDataSection ? '隐藏数据管理' : '数据管理'}
            </Button>
          </div>
        </form>
      </Card>

      {/* 数据管理部分 */}
      {showDataSection && (
        <Card style={{ marginTop: '25px' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>数据管理</h4>
          <p style={{ margin: '0 0 15px 0', color: '#6c757d', fontSize: '14px' }}>
            您可以通过以下方式管理您的数据：<br/>
            1. <strong>用户ID方式</strong>：保存好您的用户ID，在新设备上直接输入ID即可导入所有数据<br/>
            2. <strong>文件方式</strong>：导出数据文件，在新设备上上传文件来导入数据
          </p>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              onClick={handleExportData}
            >
              导出数据
            </Button>
          </div>
        </Card>
      )}

      {/* 信息说明 */}
      <Card style={{ marginTop: '25px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>信息说明</h4>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#6c757d', fontSize: '14px', lineHeight: '1.6' }}>
          <li>您的姓名和班级信息将用于作品发布和评论显示</li>
          <li>头像将显示在您的作品和评论旁边</li>
          <li>信息仅存储在您的浏览器中，保护您的隐私</li>
          <li>使用数据管理功能可以在不同浏览器间同步数据</li>
        </ul>
      </Card>
    </div>
  );
};

export default UserProfile;
