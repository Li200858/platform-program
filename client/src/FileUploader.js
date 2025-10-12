import React, { useRef, useState } from 'react';
import api from './api';

export default function FileUploader({ onUpload }) {
  const fileInput = useRef();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    const file = fileInput.current.files[0];
    if (!file) return;
    
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    console.log(`📤 准备上传文件: ${file.name} (${fileSizeMB}MB)`);
    
    // 文件大小检查 (2GB限制 - 支持微电影等长视频)
    if (file.size > 2048 * 1024 * 1024) {
      alert(`文件大小不能超过2GB\n当前文件: ${fileSizeMB}MB\n\n如果文件过大，建议:\n1. 使用视频编辑软件压缩\n2. 降低分辨率到1080p\n3. 使用H.264编码`);
      return;
    }
    
    // 文件类型检查（已放宽限制）
    const allowedTypes = [
      // 图片
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
      // 视频
      'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime',
      // 音频
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg', 'audio/m4a', 'audio/aac',
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
      'application/zip', 'application/x-rar-compressed', 'application/x-zip-compressed'
    ];
    
    if (file.type && !allowedTypes.includes(file.type)) {
      console.warn(`⚠️ 不支持的文件类型: ${file.type}`);
      alert(`不支持的文件类型: ${file.type}\n\n支持：图片、视频、音频、文档、文本、压缩文件`);
      return;
    }
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('files', file);
      
      console.log(`⏳ 开始上传 ${fileSizeMB}MB 文件...`);
      const data = await api.upload(formData);
      
      if (data.success && data.urls && data.urls.length > 0) {
        console.log(`✅ 上传成功: ${data.urls[0]}`);
        onUpload(data.urls[0]);
      } else {
        throw new Error('上传响应格式错误');
      }
    } catch (error) {
      console.error('❌ 文件上传失败:', error);
      const errorMsg = error.message || '请检查网络连接或文件大小';
      alert(`上传失败: ${errorMsg}\n\n提示：\n- 文件不能超过2GB\n- 大文件上传需要较长时间，请耐心等待\n- 请保持网络连接稳定\n- 建议使用有线网络或稳定WiFi上传大文件`);
    } finally {
      setUploading(false);
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
        支持图片、视频、音频、文档、文本、压缩文件，最大2GB
        <br />
        <span style={{ color: '#28a745', fontWeight: 'bold' }}>✨ 支持微电影等长视频上传</span>
      </div>
    </div>
  );
}