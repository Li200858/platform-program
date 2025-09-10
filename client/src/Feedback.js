import React, { useState } from 'react';

export default function Feedback() {
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setMsg('请输入反馈内容');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: content.trim(),
          contact: contact.trim() || '匿名'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMsg('反馈提交成功，感谢您的建议！');
        setContent('');
        setContact('');
      } else {
        setMsg(data.error || '提交失败');
      }
    } catch (error) {
      console.error('提交反馈失败:', error);
      setMsg('提交失败，请重试');
    } finally {
      setLoading(false);
    }
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
      <h2 style={{ marginBottom: 25, color: '#2c3e50', textAlign: 'center' }}>
        💬 意见反馈
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
            反馈内容 *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="请告诉我们您的想法、建议或遇到的问题..."
            rows={6}
            style={{ 
              width: '100%', 
              padding: '15px', 
              borderRadius: 8, 
              border: '2px solid #ecf0f1',
              resize: 'vertical',
              fontSize: '14px',
              lineHeight: '1.5'
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
            联系方式（可选）
          </label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="请输入您的姓名或联系方式（可选）"
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: 8, 
              border: '2px solid #ecf0f1',
              fontSize: '14px'
            }}
          />
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

        <div style={{ display: 'flex', gap: 15, justifyContent: 'center' }}>
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
            {loading ? '提交中...' : '✨ 提交反馈'}
          </button>
        </div>
      </form>

      <div style={{ 
        marginTop: 30, 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: 8,
        border: '1px solid #e9ecef'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>📝 反馈说明</h4>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#6c757d', fontSize: '14px', lineHeight: '1.6' }}>
          <li>您的反馈对我们改进平台非常重要</li>
          <li>我们会认真阅读每一条反馈并持续优化</li>
          <li>如需回复，请留下联系方式</li>
          <li>我们承诺保护您的隐私信息</li>
        </ul>
      </div>
    </div>
  );
}