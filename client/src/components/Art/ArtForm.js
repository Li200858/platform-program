// 艺术作品发布表单组件
import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Avatar from '../../Avatar';
import FileUploader from '../../FileUploader';
import { ART_TABS } from '../../utils/constants';
import { validation } from '../../utils/validation';

const ArtForm = ({ userInfo, onSubmit, onCancel, loading = false }) => {
  const [formData, setFormData] = useState({
    tab: '音乐',
    title: '',
    content: '',
    media: []
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除相关错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = (url) => {
    setFormData(prev => ({ ...prev, media: [...prev.media, url] }));
  };

  const handleRemoveFile = (index) => {
    setFormData(prev => ({ 
      ...prev, 
      media: prev.media.filter((_, i) => i !== index) 
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 验证表单
    const validationResult = validation.validateArt(formData);
    if (!validationResult.valid) {
      setErrors({ general: validationResult.message });
      return;
    }

    // 验证用户信息
    const userValidation = validation.validateUser(userInfo);
    if (!userValidation.valid) {
      setErrors({ general: userValidation.message });
      return;
    }

    onSubmit({
      ...formData,
      authorName: userInfo.name,
      authorClass: userInfo.class
    });
  };

  return (
    <Card style={{ maxWidth: '600px', margin: '40px auto' }}>
      <h2 style={{ marginBottom: '25px', color: '#2c3e50', textAlign: 'center' }}>
        ✨ 发布艺术作品
      </h2>
      
      <form onSubmit={handleSubmit}>
        {/* 作品分类 */}
        <Input
          type="select"
          label="作品分类"
          value={formData.tab}
          onChange={(e) => handleInputChange('tab', e.target.value)}
          required
        >
          {ART_TABS.filter(cat => cat.key !== 'all').map(category => (
            <option key={category.key} value={category.dbValue}>
              {category.label}
            </option>
          ))}
        </Input>

        {/* 作品标题 */}
        <Input
          type="text"
          label="作品标题"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="请输入作品标题"
          required
          error={errors.title}
        />

        {/* 作品描述 */}
        <Input
          type="textarea"
          label="作品描述"
          value={formData.content}
          onChange={(e) => handleInputChange('content', e.target.value)}
          placeholder="请描述您的作品..."
          rows={4}
          required
          error={errors.content}
        />

        {/* 用户信息显示 */}
        {userInfo && userInfo.name && userInfo.class ? (
          <div style={{ 
            marginBottom: '20px', 
            padding: '15px', 
            backgroundColor: '#e8f5e8', 
            borderRadius: '8px',
            border: '1px solid #c3e6c3'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Avatar src={userInfo.avatar} name={userInfo.name} size={40} />
              <div>
                <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{userInfo.name}</div>
                <div style={{ fontSize: '14px', color: '#7f8c8d' }}>{userInfo.class}</div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#27ae60' }}>
              ✓ 将以此身份发布作品
            </div>
          </div>
        ) : (
          <div style={{ 
            marginBottom: '20px', 
            padding: '15px', 
            backgroundColor: '#fef9e7', 
            borderRadius: '8px',
            border: '1px solid #f4d03f',
            textAlign: 'center'
          }}>
            <div style={{ color: '#f39c12', fontWeight: 'bold', marginBottom: 5 }}>
              请先设置个人信息
            </div>
            <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
              请先在个人信息页面填写姓名和班级信息
            </div>
          </div>
        )}

        {/* 文件上传 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
            上传文件
          </label>
          <FileUploader onUpload={handleFileUpload} />
        </div>

        {/* 已上传文件 */}
        {formData.media.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
              已上传文件
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {formData.media.map((url, idx) => (
                <div key={idx} style={{ 
                  padding: '5px 10px', 
                  background: '#ecf0f1', 
                  borderRadius: '5px', 
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <span>📎</span>
                  <span>{url.split('/').pop()}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 错误信息 */}
        {errors.general && (
          <div style={{ 
            color: '#e74c3c', 
            marginBottom: '20px',
            padding: '12px 16px',
            backgroundColor: '#fadbd8',
            border: '1px solid #f1948a',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            {errors.general}
          </div>
        )}

        {/* 按钮组 */}
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            type="submit"
            variant="success"
            loading={loading}
            disabled={loading}
          >
            ✨ 发布作品
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ArtForm;
