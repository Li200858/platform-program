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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      alert('只支持图片和视频文件');
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
        accept="image/*,video/*"
        style={{ marginBottom: '10px' }}
        disabled={uploading}
      />
      {uploading && (
        <div style={{ color: '#007bff', fontSize: '14px', marginBottom: '5px' }}>
          上传中...
        </div>
      )}
      <div style={{ fontSize: '12px', color: '#666' }}>
        支持图片和视频文件，最大10MB
      </div>
    </div>
  );
}