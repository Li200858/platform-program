import React, { useState } from 'react';

const FilePreview = ({ urls, apiBaseUrl }) => {
  const [previewFile, setPreviewFile] = useState(null);
  const [previewType, setPreviewType] = useState('');

  const getFileType = (url) => {
    const ext = url.split('.').pop().toLowerCase();
    return {
      ext,
      isImage: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext),
      isVideo: ['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv'].includes(ext),
      isAudio: ['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(ext),
      isDocument: ['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext),
      isArchive: ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)
    };
  };

  const getFileIcon = (fileType) => {
    if (fileType.isImage) return '🖼️';
    if (fileType.isVideo) return '🎥';
    if (fileType.isAudio) return '🎵';
    if (fileType.isDocument) return '📄';
    if (fileType.isArchive) return '📦';
    return '📎';
  };

  const handlePreview = (url, fileType) => {
    setPreviewFile(url);
    if (fileType.isImage) {
      setPreviewType('image');
    } else if (fileType.isVideo) {
      setPreviewType('video');
    } else if (fileType.isAudio) {
      setPreviewType('audio');
    } else if (fileType.isDocument) {
      setPreviewType('document');
    } else {
      setPreviewType('download');
    }
  };

  const handleDownload = (url, filename) => {
    const link = document.createElement('a');
    link.href = `${apiBaseUrl}${url}`;
    link.download = filename || url.split('/').pop();
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const closePreview = () => {
    setPreviewFile(null);
    setPreviewType('');
  };

  if (!urls || urls.length === 0) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {urls.map((url, idx) => {
          const fileType = getFileType(url);
          const filename = url.split('/').pop();
          
          return (
            <div key={idx} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '8px 12px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}>
              <span style={{ fontSize: '16px' }}>
                {getFileIcon(fileType)}
              </span>
              <span style={{ 
                maxWidth: '120px', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap',
                color: '#495057'
              }}>
                {filename}
              </span>
              
              {/* 预览按钮 */}
              {(fileType.isImage || fileType.isVideo || fileType.isAudio || fileType.isDocument) && (
                <button
                  onClick={() => handlePreview(url, fileType)}
                  style={{
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
                >
                  预览
                </button>
              )}
              
              {/* 下载按钮 */}
              <button
                onClick={() => handleDownload(url, filename)}
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
              >
                下载
              </button>
            </div>
          );
        })}
      </div>

      {/* 预览弹窗 */}
      {previewFile && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={closePreview}
        >
          <div style={{ 
            position: 'relative',
            maxWidth: '90%',
            maxHeight: '90%',
            background: 'white',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            {/* 关闭按钮 */}
            <button
              onClick={closePreview}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                cursor: 'pointer',
                fontSize: '16px',
                zIndex: 1001
              }}
            >
              ×
            </button>

            {/* 预览内容 */}
            {previewType === 'image' && (
              <img 
                src={`${apiBaseUrl}${previewFile}`} 
                alt="预览" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%', 
                  objectFit: 'contain',
                  display: 'block'
                }}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            
            {previewType === 'video' && (
              <video 
                src={`${apiBaseUrl}${previewFile}`} 
                controls 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%',
                  display: 'block'
                }}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            
            {previewType === 'audio' && (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <audio 
                  src={`${apiBaseUrl}${previewFile}`} 
                  controls 
                  style={{ width: '100%', maxWidth: '400px' }}
                />
              </div>
            )}
            
            {previewType === 'document' && (
              <div style={{ width: '800px', height: '600px' }}>
                <iframe
                  src={`${apiBaseUrl}${previewFile}`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="文档预览"
                />
              </div>
            )}
            
            {previewType === 'download' && (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <p>此文件类型不支持预览</p>
                <button
                  onClick={() => handleDownload(previewFile, previewFile.split('/').pop())}
                  style={{
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    marginTop: '10px'
                  }}
                >
                  下载文件
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilePreview;
