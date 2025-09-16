// 意见反馈组件
import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Avatar from '../../Avatar';
import { useUserBasic as useUser } from '../../hooks/useUserBasic';
import { useApiMinimal as useApi } from '../../hooks/useApiMinimal';
import { validation } from '../../utils/validation';

const Feedback = () => {
  const [formData, setFormData] = useState({
    content: '',
    category: '其他'
  });
  const [errors, setErrors] = useState({});

  const { userInfo, isLoggedIn } = useUser();
  const api = useApi();

  const categories = [
    { value: '教学', label: '教学相关' },
    { value: '宿舍', label: '宿舍生活' },
    { value: '食堂', label: '食堂餐饮' },
    { value: '环境', label: '校园环境' },
    { value: '其他', label: '其他建议' }
  ];

  // 处理输入变化
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 清除相关错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 验证表单
    const validationResult = validation.validateFeedback(formData);
    if (!validationResult.valid) {
      setErrors({ general: validationResult.message });
      return;
    }

    // 验证用户信息
    if (!isLoggedIn) {
      setErrors({ general: '请先在个人信息页面填写姓名和班级信息！' });
      return;
    }

    try {
      await api.feedback.create({
        content: formData.content.trim(),
        category: formData.category,
        authorName: userInfo.name,
        authorClass: userInfo.class,
        authorAvatar: userInfo.avatar || ''
      });

      setFormData({ content: '', category: '其他' });
      setErrors({ general: '反馈提交成功，感谢您的建议！' });
    } catch (error) {
      setErrors({ general: error.message || '提交失败，请重试' });
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto' }}>
      <Card>
        <h2 style={{ marginBottom: '25px', color: '#2c3e50', textAlign: 'center' }}>
          意见反馈
        </h2>
        
        <form onSubmit={handleSubmit}>
          {/* 反馈分类 */}
          <Input
            type="select"
            label="反馈分类"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </Input>

          {/* 反馈内容 */}
          <Input
            type="textarea"
            label="反馈内容"
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            placeholder="请告诉我们您的想法、建议或遇到的问题..."
            rows={6}
            required
            error={errors.content}
          />

          {/* 用户信息显示 */}
          {isLoggedIn ? (
            <div style={{ 
              marginBottom: '20px', 
              padding: '15px', 
              backgroundColor: '#e8f5e8', 
              borderRadius: '8px',
              border: '1px solid #c3e6c3'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Avatar 
                  src={userInfo?.avatar} 
                  name={userInfo?.name || '用户'} 
                  size={40}
                />
                <div>
                  <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    {userInfo?.name || '未知用户'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                    {userInfo?.class || '未知班级'}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#27ae60' }}>
                ✓ 将以此身份提交反馈
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

          {/* 错误信息 */}
          {errors.general && (
            <div style={{ 
              color: errors.general.includes('成功') ? '#27ae60' : '#e74c3c', 
              marginBottom: '20px',
              padding: '12px 16px',
              backgroundColor: errors.general.includes('成功') ? '#d5f4e6' : '#fadbd8',
              border: `1px solid ${errors.general.includes('成功') ? '#a9dfbf' : '#f1948a'}`,
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              {errors.general}
            </div>
          )}

          {/* 提交按钮 */}
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <Button
              type="submit"
              variant="primary"
              loading={api.loading}
              disabled={api.loading || !isLoggedIn}
            >
              {api.loading ? '提交中...' : '✨ 提交反馈'}
            </Button>
          </div>
        </form>
      </Card>

      {/* 反馈说明 */}
      <Card style={{ marginTop: '25px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>反馈说明</h4>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#6c757d', fontSize: '14px', lineHeight: '1.6' }}>
          <li>您的反馈对我们改进平台非常重要</li>
          <li>我们会认真阅读每一条反馈并持续优化</li>
          <li>如需回复，请留下联系方式</li>
          <li>我们承诺保护您的隐私信息</li>
        </ul>
      </Card>
    </div>
  );
};

export default Feedback;
