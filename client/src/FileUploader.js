import React, { useRef, useState } from 'react';

export default function FileUploader({ onUpload }) {
  const fileInput = useRef();
  const [uploading, setUploading] = useState(false);

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
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setUploading(false);
      if (res.ok) {
        onUpload(data.url);
      } else {
        alert(data.error || '上传失败');
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      setUploading(false);
      alert('上传失败，请检查网络连接');
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
        <div style={{ color: '#007bff', fontSize: '14px', marginBottom: '5px' }}>
          上传中...
        </div>
      )}
      <div style={{ fontSize: '12px', color: '#666' }}>
        支持图片、视频、音频、文档、文本、压缩文件，最大10MB
      </div>
    </div>
  );
}