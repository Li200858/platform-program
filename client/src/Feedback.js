import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';
import FilePreview from './FilePreview';
import api from './api';

export default function Feedback({ userInfo }) {
  const [formData, setFormData] = useState({
    content: '',
    media: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]); // 保存选择的文件

  // 保存草稿到localStorage
  const saveDraft = () => {
    const draft = {
      formData,
      selectedFiles
    };
    localStorage.setItem('feedback_draft', JSON.stringify(draft));
  };

  // 从localStorage恢复草稿
  const loadDraft = () => {
    const savedDraft = localStorage.getItem('feedback_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(draft.formData || {
          content: '',
          media: []
        });
        setSelectedFiles(draft.selectedFiles || []);
      } catch (error) {
        console.error('恢复草稿失败:', error);
      }
    }
  };

  // 清除草稿
  const clearDraft = () => {
    localStorage.removeItem('feedback_draft');
    setFormData({
      content: '',
      media: []
    });
    setSelectedFiles([]);
  };

  // 组件加载时恢复草稿
  useEffect(() => {
    loadDraft();
  }, []);

  // 当表单数据变化时自动保存草稿
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft();
    }, 1000); // 1秒后保存，避免频繁保存

    return () => clearTimeout(timer);
  }, [formData, selectedFiles]);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    setSelectedFiles(Array.from(files));
    setUploading(true);
    setUploadProgress(0);
    
    const uploadFormData = new FormData();
    let totalSize = 0;
    Array.from(files).forEach(file => {
      uploadFormData.append('files', file);
      totalSize += file.size;
    });

    const startTime = Date.now();

    try {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
          const speed = e.loaded / ((Date.now() - startTime) / 1000);
          setUploadSpeed(speed);
        }
      });

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => xhr.status === 200 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error('上传失败'));
        xhr.onerror = () => reject(new Error('网络错误'));
      });

      const baseUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://platform-program.onrender.com' : 'http://localhost:5000');
      xhr.open('POST', `${baseUrl}/api/upload`, true);
      xhr.timeout = 1800000;
      xhr.send(uploadFormData);

      const data = await uploadPromise;
      if (data && data.urls && data.urls.length > 0) {
        setFormData(prev => ({ ...prev, media: [...prev.media, ...data.urls] }));
        setUploadProgress(100);
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      alert('文件上传失败：' + (error.message || '请检查文件大小和格式'));
      setUploadProgress(0);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 3000);
    }
  };

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
      // 提交成功后清除草稿
      clearDraft();
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
          反馈说明
        </div>
        <div style={{ fontSize: '13px', color: '#0c5460', lineHeight: '1.5' }}>
          您的反馈对我们很重要！请详细描述您遇到的问题或建议，我们会认真对待每一条反馈并及时处理。
        </div>
      </div>

      <form onSubmit={handleSubmit}>
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

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
            上传文件（可选，最大2GB）
          </label>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ width: '100%', padding: '10px', borderRadius: 8, border: '2px solid #ecf0f1' }}
          />
          
          {/* 实时上传进度条 */}
          {uploading && uploadProgress > 0 && (
            <div style={{ marginTop: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '13px',
                color: '#2c3e50',
                marginBottom: '8px'
              }}>
                <span style={{ fontWeight: 'bold' }}>
                  📊 {uploadProgress.toFixed(1)}%
                </span>
                <span style={{ color: '#3498db', fontWeight: '600' }}>
                  {uploadSpeed > 0 ? `⚡ ${(uploadSpeed / 1024 / 1024).toFixed(2)} MB/s` : '计算中...'}
                </span>
              </div>
              
              <div style={{
                width: '100%',
                height: '25px',
                backgroundColor: '#ecf0f1',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  background: uploadProgress === 100 
                    ? 'linear-gradient(90deg, #27ae60, #2ecc71)' 
                    : 'linear-gradient(90deg, #3498db, #5dade2)',
                  transition: 'width 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: 'white', fontWeight: 'bold', fontSize: '12px' }}>
                    {uploadProgress === 100 ? '✅' : `${uploadProgress.toFixed(0)}%`}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {formData.media.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#2c3e50' }}>
              已上传文件预览
            </label>
            <div style={{ 
              border: '1px solid #ecf0f1', 
              borderRadius: 8, 
              padding: 15, 
              background: '#f8f9fa',
              position: 'relative'
            }}>
              <FilePreview 
                urls={formData.media} 
                apiBaseUrl={process.env.NODE_ENV === 'production' ? 'https://platform-program.onrender.com' : 'http://localhost:5000'} 
              />
            </div>
          </div>
        )}

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
              <Avatar name={userInfo.name} size={40} />
              <div>
                <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{userInfo.name}</div>
                <div style={{ fontSize: '14px', color: '#7f8c8d' }}>{userInfo.class}</div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#27ae60' }}>
              将以此身份提交反馈
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