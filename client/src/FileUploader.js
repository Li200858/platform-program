import React, { useRef, useState } from 'react';import { buildApiUrl, buildFileUrl } from './utils/apiUrl';

import api from './api';

// 图片压缩函数
const compressImage = (file, quality = 0.8, maxWidth = 1920) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 计算新尺寸
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 绘制压缩后的图片
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('图片压缩失败'));
          }
        },
        file.type,
        quality
      );
    };
    
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = URL.createObjectURL(file);
  });
};

export default function FileUploader({ onUpload }) {
  const fileInput = useRef();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = async () => {
    const file = fileInput.current.files[0];
    if (!file) return;
    
    // 文件大小检查 (2MB限制)
    if (file.size > 2 * 1024 * 1024) {
      alert('文件大小不能超过2MB，请压缩后上传');
      return;
    }
    
    // 如果是图片，尝试压缩
    let fileToUpload = file;
    if (file.type.startsWith('image/') && file.size > 256 * 1024) { // 大于256KB的图片就压缩
      try {
        fileToUpload = await compressImage(file, 0.6, 800); // 更激进的压缩
        console.log(`图片压缩: ${file.size} -> ${fileToUpload.size} bytes (${Math.round((1 - fileToUpload.size/file.size) * 100)}% 减少)`);
      } catch (error) {
        console.warn('图片压缩失败，使用原文件:', error);
      }
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
      formData.append('files', fileToUpload);
      
      // 使用XMLHttpRequest来监控上传进度
      const xhr = new XMLHttpRequest();
      
      // 设置超时时间
      xhr.timeout = 60000; // 60秒超时
      
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setUploadProgress(Math.round(percentComplete));
            console.log(`上传进度: ${Math.round(percentComplete)}% (${e.loaded}/${e.total} bytes)`);
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              console.log('上传成功:', data);
              resolve(data);
            } catch (e) {
              console.error('响应解析失败:', e);
              reject(new Error('响应解析失败'));
            }
          } else {
            console.error(`上传失败: ${xhr.status}`, xhr.responseText);
            reject(new Error(`上传失败: ${xhr.status}`));
          }
        });
        
        xhr.addEventListener('error', (e) => {
          console.error('网络错误:', e);
          reject(new Error('网络错误'));
        });
        
        xhr.addEventListener('timeout', () => {
          console.error('上传超时');
          reject(new Error('上传超时，请重试'));
        });
        
        xhr.open('POST', buildApiUrl('/api/upload'));
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