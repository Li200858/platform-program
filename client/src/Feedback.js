import React, { useState } from 'react';
import Avatar from './Avatar';
import api from './api';

export default function Feedback({ userInfo }) {
  const [formData, setFormData] = useState({
    content: '',
    category: '其他'
  });
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { value: '教学', label: '教学相关' },
    { value: '宿舍', label: '宿舍生活' },
    { value: '食堂', label: '食堂餐饮' },
    { value: '环境', label: '校园环境' },
    { value: '其他', label: '其他建议' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      alert('请填写反馈内容！');
      return;
    }

    if (!userInfo || !userInfo.name || !userInfo.class) {
      alert('请先在个人信息页面填写姓名和班级信息！');
      return;
    }

    setSubmitting(true);
    try {
      await api.feedback.create({
        ...formData,
        authorName: userInfo.name,
        authorClass: userInfo.class
      });
      
      alert('反馈提交成功！感谢您的建议。');
      setFormData({ content: '', category: '其他' });
    } catch (error) {
      alert('提交失败：' + (error.message || '请重试'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginBottom: 30, color: '#2c3e50', textAlign: 'center' }}>意见反馈</h2>
      
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#e8f4fd', 
        borderRadius: 8,
        border: '1px solid #bee5eb',
        marginBottom: '30px'
      }}>
        <div style={{ fontSize: '14px', color: '#0c5460', fontWeight: 'bold', marginBottom: '8px' }}>
          💡 反馈说明
        </div>
        <div style={{ fontSize: '13px', color: '#0c5460', lineHeight: '1.5' }}>
          您的反馈对我们很重要！请详细描述您遇到的问题或建议，我们会认真对待每一条反馈并及时处理。
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
            反馈分类
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            style={{ width: '100%', padding: '12px', borderRadius: 8, border: '2px solid #ecf0f1', fontSize: '16px' }}
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
            反馈内容 *
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="请详细描述您的问题或建议..."
            rows={6}
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: 8, 
              border: '2px solid #ecf0f1', 
              resize: 'vertical',
              fontSize: '16px',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* 用户信息显示 */}
        {userInfo && userInfo.name && userInfo.class ? (
          <div style={{ 
            marginBottom: 20, 
            padding: '15px', 
            backgroundColor: '#e8f5e8', 
            borderRadius: 8,
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
              ✓ 将以此身份提交反馈
            </div>
          </div>
        ) : (
          <div style={{ 
            marginBottom: 20, 
            padding: '15px', 
            backgroundColor: '#fef9e7', 
            borderRadius: 8,
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

        <div style={{ display: 'flex', gap: 15, justifyContent: 'center' }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '12px 30px',
              background: submitting ? '#95a5a6' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              minWidth: '120px'
            }}
          >
            {submitting ? '提交中...' : '提交反馈'}
          </button>
        </div>
      </form>

      <div style={{ 
        marginTop: '30px',
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: 8,
        border: '1px solid #e9ecef'
      }}>
        <div style={{ fontSize: '13px', color: '#6c757d', textAlign: 'center' }}>
          <strong>隐私保护：</strong>您的反馈信息将被严格保密，仅用于改进我们的服务。
        </div>
      </div>
    </div>
  );
}