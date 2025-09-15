import React, { useRef, useState } from 'react';
import api from './api';

export default function FileUploader({ onUpload }) {
  const fileInput = useRef();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = async () => {
    const file = fileInput.current.files[0];
    if (!file) return;
    
    // 文件大小检查 (10MB限制)
    if (file.size > 10 * 1024 * 1024) {
      alert('文件大小不能超过10MB');
      return;
    }
    
    // 文件类型检查
    const allowedTypes = [
      // 图片
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
      // 视频
      'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov',
      // 音频
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg',
      // 文档
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // 文本
      'text/plain', 'text/csv',
      // 压缩文件
      'application/zip', 'application/x-rar-compressed'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert('不支持的文件类型。支持：图片、视频、音频、文档、文本、压缩文件');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('files', file);
      
      // 使用XMLHttpRequest来监控上传进度
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setUploadProgress(Math.round(percentComplete));
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (e) {
              reject(new Error('响应解析失败'));
            }
          } else {
            reject(new Error(`上传失败: ${xhr.status}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('网络错误'));
        });
        
        xhr.open('POST', `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/upload`);
        xhr.send(formData);
      });
      
      const data = await uploadPromise;
      onUpload(data.urls[0]);
    } catch (error) {
      console.error('文件上传失败:', error);
      alert('上传失败：' + (error.message || '请检查网络连接'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div style={{ margin: '10px 0' }}>
      <input 
        type="file" 
        ref={fileInput} 
        onChange={handleUpload}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
        style={{ marginBottom: '10px' }}
        disabled={uploading}
      />
      {uploading && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ color: '#007bff', fontSize: '14px', marginBottom: '5px' }}>
            上传中... {uploadProgress}%
          </div>
          <div style={{ 
            width: '100%', 
            height: '8px', 
            backgroundColor: '#e9ecef', 
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${uploadProgress}%`, 
              height: '100%', 
              backgroundColor: '#007bff',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>
      )}
      <div style={{ fontSize: '12px', color: '#666' }}>
        支持图片、视频、音频、文档、文本、压缩文件，最大10MB
      </div>
    </div>
  );
}