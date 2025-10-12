/**
 * 智能文件上传组件
 * <2GB: 使用方案A（快速上传+进度条）
 * >2GB: 自动切换到ChunkedFileUploader（分块上传+断点续传）
 */

import React, { useState, useRef } from 'react';
import ChunkedFileUploader from './ChunkedFileUploader';

const SIZE_THRESHOLD = 2 * 1024 * 1024 * 1024; // 2GB

export default function SmartFileUploader({ onUpload, onError, multiple = false }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [useChunked, setUseChunked] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const fileInputRef = useRef();

  const formatSize = (bytes) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
    } else if (bytes >= 1024 * 1024) {
      return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    }
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileSize = file.size;

    console.log(`📤 选择文件: ${file.name} (${formatSize(fileSize)})`);

    // 检查是否超过2GB
    if (fileSize > SIZE_THRESHOLD) {
      console.log(`⚡ 文件超过2GB，切换到分块上传模式`);
      setUseChunked(true);
      setCurrentFile(file);
      return;
    }

    // 小于2GB，使用方案A（快速上传+进度条）
    console.log(`📦 文件小于2GB，使用快速上传模式`);
    await handleSmallFileUpload(files);
  };

  const handleSmallFileUpload = async (files) => {
    setUploading(true);
    setUploadProgress(0);
    setUploadSpeed(0);

    const uploadFormData = new FormData();
    let totalSize = 0;
    Array.from(files).forEach(file => {
      uploadFormData.append('files', file);
      totalSize += file.size;
    });

    const startTime = Date.now();

    try {
      const xhr = new XMLHttpRequest();

      // 监听上传进度
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
          
          const elapsedTime = (Date.now() - startTime) / 1000;
          const speed = e.loaded / elapsedTime;
          setUploadSpeed(speed);
          
          console.log(`📊 上传进度: ${percentComplete.toFixed(1)}% (${formatSize(speed)}/s)`);
        }
      });

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error('网络错误'));
        xhr.ontimeout = () => reject(new Error('上传超时'));
      });

      const baseUrl = process.env.REACT_APP_API_URL || 
        (process.env.NODE_ENV === 'production' ? 'https://platform-program.onrender.com' : 'http://localhost:5000');
      
      xhr.open('POST', `${baseUrl}/api/upload`, true);
      xhr.timeout = 1800000; // 30分钟
      xhr.send(uploadFormData);

      const data = await uploadPromise;

      if (data && data.urls && data.urls.length > 0) {
        console.log(`✅ 上传成功: ${data.urls[0]}`);
        setUploadProgress(100);
        
        // 成功回调
        if (onUpload) {
          data.urls.forEach(url => onUpload(url));
        }
        
        // 3秒后重置
        setTimeout(() => {
          setUploadProgress(0);
          setUploadSpeed(0);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 3000);
      } else {
        throw new Error('上传响应格式错误');
      }
    } catch (error) {
      console.error('❌ 上传失败:', error);
      setUploadProgress(0);
      setUploadSpeed(0);
      
      if (onError) {
        onError(error);
      } else {
        alert(`❌ 上传失败: ${error.message}`);
      }
    } finally {
      setUploading(false);
    }
  };

  // 如果使用分块上传模式
  if (useChunked) {
    return (
      <div>
        <div style={{ 
          padding: '15px', 
          background: '#fff3cd', 
          border: '1px solid #ffc107',
          borderRadius: '8px',
          marginBottom: '15px',
          color: '#856404'
        }}>
          <strong>📦 大文件模式</strong>
          <div style={{ fontSize: '13px', marginTop: '5px' }}>
            文件 <strong>{currentFile?.name}</strong> ({formatSize(currentFile?.size)}) 超过2GB
            <br />
            将使用分块上传模式（支持断点续传）
          </div>
        </div>

        <ChunkedFileUploader
          onUpload={(url) => {
            console.log('✅ 大文件上传成功:', url);
            setUseChunked(false);
            setCurrentFile(null);
            if (onUpload) onUpload(url);
          }}
          onError={(error) => {
            console.error('❌ 大文件上传失败:', error);
            setUseChunked(false);
            setCurrentFile(null);
            if (onError) onError(error);
          }}
        />
        
        <button
          onClick={() => {
            setUseChunked(false);
            setCurrentFile(null);
          }}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ← 返回选择其他文件
        </button>
      </div>
    );
  }

  // 默认：方案A（快速上传+进度条）
  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        onChange={handleFileSelect}
        disabled={uploading}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: 8,
          border: '2px solid #ecf0f1',
          marginBottom: '10px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          backgroundColor: uploading ? '#f5f5f5' : 'white'
        }}
      />

      {/* 实时上传进度条 */}
      {uploading && uploadProgress > 0 && (
        <div style={{ marginTop: '15px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
            fontSize: '13px',
            color: '#2c3e50'
          }}>
            <span style={{ fontWeight: 'bold' }}>
              📊 上传进度: {uploadProgress.toFixed(1)}%
            </span>
            <span style={{ color: '#3498db', fontWeight: '600' }}>
              {uploadSpeed > 0 ? `⚡ ${formatSize(uploadSpeed)}/s` : '计算速度...'}
            </span>
          </div>

          <div style={{
            width: '100%',
            height: '28px',
            backgroundColor: '#ecf0f1',
            borderRadius: '14px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              width: `${uploadProgress}%`,
              height: '100%',
              transition: 'width 0.3s ease, background-color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: uploadProgress === 100
                ? 'linear-gradient(90deg, #27ae60, #2ecc71)'
                : 'linear-gradient(90deg, #3498db, #5dade2)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              <span style={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: '13px',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}>
                {uploadProgress === 100 ? '✅ 完成' : `${uploadProgress.toFixed(0)}%`}
              </span>
            </div>
          </div>

          {uploadProgress === 100 && (
            <div style={{
              marginTop: '10px',
              color: '#27ae60',
              fontSize: '14px',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              ✨ 上传完成！
            </div>
          )}
        </div>
      )}

      {!uploading && (
        <div style={{
          fontSize: '12px',
          color: '#666',
          marginTop: '8px',
          lineHeight: '1.6'
        }}>
          💡 提示: 
          <br />• 小于2GB: 快速上传（当前模式）
          <br />• 大于2GB: 自动切换到分块上传（支持断点续传）
          <br />• 支持图片、视频、音频、文档等，最大5GB
        </div>
      )}
    </div>
  );
}

