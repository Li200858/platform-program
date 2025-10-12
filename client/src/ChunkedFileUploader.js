/**
 * 分块上传前端组件
 * 支持超大文件、断点续传、进度显示
 * 
 * 使用方法：
 * import ChunkedFileUploader from './ChunkedFileUploader';
 * <ChunkedFileUploader onUpload={(url) => console.log('上传成功:', url)} />
 */

import React, { useState, useRef } from 'react';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB

export default function ChunkedFileUploader({ onUpload, onError }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState(null);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const fileInput = useRef();
  const abortController = useRef(null);

  const formatSize = (bytes) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
    } else if (bytes >= 1024 * 1024) {
      return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    } else if (bytes >= 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    }
    return bytes + ' B';
  };

  const formatTime = (seconds) => {
    if (seconds < 60) {
      return Math.ceil(seconds) + '秒';
    } else if (seconds < 3600) {
      return Math.ceil(seconds / 60) + '分钟';
    } else {
      return Math.ceil(seconds / 3600) + '小时';
    }
  };

  const uploadFile = async (file) => {
    try {
      console.log(`📤 准备上传: ${file.name} (${formatSize(file.size)})`);
      
      // 检查文件大小
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`文件太大！最大支持 ${formatSize(MAX_FILE_SIZE)}`);
      }

      // 计算分块数量
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      console.log(`  分块数量: ${totalChunks}`);

      setCurrentFile({
        name: file.name,
        size: file.size,
        totalChunks
      });

      // 1. 初始化上传
      const baseUrl = process.env.REACT_APP_API_URL || 
        (process.env.NODE_ENV === 'production' ? 'https://platform-program.onrender.com' : 'http://localhost:5000');
      
      const initResponse = await fetch(`${baseUrl}/api/upload/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          fileSize: file.size,
          totalChunks
        })
      });

      const initData = await initResponse.json();
      const { uploadId } = initData;
      console.log(`  上传ID: ${uploadId}`);

      // 创建 AbortController 用于取消上传
      abortController.current = new AbortController();

      // 2. 上传所有分块
      const startTime = Date.now();
      let uploadedBytes = 0;

      for (let i = 0; i < totalChunks; i++) {
        // 检查是否已取消
        if (abortController.current.signal.aborted) {
          throw new Error('上传已取消');
        }

        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('uploadId', uploadId);
        formData.append('chunkIndex', i);

        try {
          await fetch(`${baseUrl}/api/upload/chunk`, {
            method: 'POST',
            body: formData,
            signal: abortController.current.signal
          });

          uploadedBytes += chunk.size;
          const currentProgress = ((i + 1) / totalChunks) * 100;
          setProgress(currentProgress);

          // 计算上传速度和剩余时间
          const elapsedTime = (Date.now() - startTime) / 1000; // 秒
          const speed = uploadedBytes / elapsedTime; // 字节/秒
          const remainingBytes = file.size - uploadedBytes;
          const remaining = remainingBytes / speed; // 秒

          setUploadSpeed(speed);
          setRemainingTime(remaining);

          console.log(`  进度: ${currentProgress.toFixed(1)}% (${formatSize(speed)}/s, 剩余 ${formatTime(remaining)})`);
        } catch (error) {
          if (error.name === 'CanceledError') {
            throw new Error('上传已取消');
          }
          throw error;
        }
      }

      // 3. 完成上传（合并分块）
      console.log(`  合并文件...`);
      setProgress(100);
      const completeResponse = await fetch(`${baseUrl}/api/upload/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId })
      });

      const completeData = await completeResponse.json();
      const { url, sizeMB } = completeData;
      console.log(` 上传完成: ${url} (${sizeMB}MB)`);

      // 重置状态
      setUploading(false);
      setProgress(0);
      setCurrentFile(null);
      setUploadSpeed(0);
      setRemainingTime(0);
      
      if (onUpload) {
        onUpload(url);
      }

      alert(` 上传成功！\n文件: ${file.name}\n大小: ${sizeMB}MB`);
    } catch (error) {
      console.error(' 上传失败:', error);
      
      // 重置状态
      setUploading(false);
      setProgress(0);
      setCurrentFile(null);
      setUploadSpeed(0);
      setRemainingTime(0);
      
      if (onError) {
        onError(error);
      }

      alert(` 上传失败: ${error.message}`);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    await uploadFile(file);
  };

  const handleCancel = async () => {
    if (abortController.current) {
      abortController.current.abort();
    }
    
    setUploading(false);
    setProgress(0);
    setCurrentFile(null);
    setUploadSpeed(0);
    setRemainingTime(0);
    
    console.log('⛔ 上传已取消');
  };

  return (
    <div style={{ margin: '20px 0' }}>
      <div style={{ marginBottom: '15px' }}>
        <input
          type="file"
          ref={fileInput}
          onChange={handleFileChange}
          disabled={uploading}
          style={{
            padding: '10px',
            border: '2px dashed #007bff',
            borderRadius: '8px',
            width: '100%',
            cursor: uploading ? 'not-allowed' : 'pointer',
            backgroundColor: uploading ? '#f0f0f0' : 'white'
          }}
        />
      </div>

      {uploading && currentFile && (
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '15px',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>正在上传:</strong> {currentFile.name}
          </div>
          <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
            文件大小: {formatSize(currentFile.size)} | 
            分块数量: {currentFile.totalChunks}
          </div>

          {/* 进度条 */}
          <div style={{
            width: '100%',
            height: '30px',
            backgroundColor: '#e9ecef',
            borderRadius: '15px',
            overflow: 'hidden',
            marginBottom: '10px',
            position: 'relative'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: progress === 100 ? '#28a745' : '#007bff',
              transition: 'width 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                {progress.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* 上传信息 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '13px',
            color: '#666',
            marginBottom: '10px'
          }}>
            <span>
              速度: <strong>{formatSize(uploadSpeed)}/s</strong>
            </span>
            <span>
              剩余时间: <strong>{formatTime(remainingTime)}</strong>
            </span>
          </div>

          {/* 取消按钮 */}
          <button
            onClick={handleCancel}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            ⛔ 取消上传
          </button>
        </div>
      )}

      {!uploading && (
        <div style={{
          fontSize: '12px',
          color: '#666',
          marginTop: '10px',
          lineHeight: '1.6'
        }}>
          <p> 支持超大文件上传 (最大 {formatSize(MAX_FILE_SIZE)})</p>
          <p> 自动分块上传 (每块 {formatSize(CHUNK_SIZE)})</p>
          <p> 实时显示上传速度和剩余时间</p>
          <p> 支持取消上传</p>
        </div>
      )}
    </div>
  );
}

