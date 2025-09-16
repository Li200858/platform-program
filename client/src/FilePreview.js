import React, { useState } from 'react';
import { buildFileUrl } from './utils/apiUrl';

const FilePreview = ({ urls, apiBaseUrl }) => {
  const [previewFile, setPreviewFile] = useState(null);
  const [previewType, setPreviewType] = useState('');

  const getFileType = (url) => {
    const ext = url.split('.').pop().toLowerCase();
    return {
      ext,
      isImage: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'].includes(ext),
      isVideo: ['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv'].includes(ext),
      isAudio: ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(ext),
      isDocument: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf'].includes(ext),
      isArchive: ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext),
      isCode: ['js', 'html', 'css', 'json', 'xml'].includes(ext)
    };
  };

  const buildUrl = (url) => {
    if (!url) {
      console.warn('FilePreview: 尝试构建空URL');
      return '';
    }
    const fullUrl = buildFileUrl(url);
    console.log('FilePreview: 构建文件URL:', { original: url, full: fullUrl });
    return fullUrl;
  };

  const getFileIcon = (fileType) => {
    if (fileType.isImage) return '🖼️';
    if (fileType.isVideo) return '🎥';
    if (fileType.isAudio) return '🎵';
    if (fileType.isDocument) return '📄';
    if (fileType.isArchive) return '📦';
    if (fileType.isCode) return '💻';
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
      // 对于文档类型，检查是否支持在线预览
      const ext = url.split('.').pop().toLowerCase();
      if (ext === 'pdf') {
        setPreviewType('document');
      } else if (['txt', 'csv', 'json', 'xml', 'html', 'css', 'js'].includes(ext)) {
        setPreviewType('text');
      } else {
        // Word、Excel等文档不支持在线预览，直接显示下载选项
        setPreviewType('download');
      }
    } else if (fileType.isCode) {
      setPreviewType('text');
    } else {
      setPreviewType('download');
    }
  };

  const handleDownload = (url, filename) => {
    const link = document.createElement('a');
    const fullUrl = buildUrl(url);
    
    console.log('下载文件URL:', fullUrl);
    link.href = fullUrl;
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
              
              {/* 预览按钮 - 所有文件类型都显示预览按钮 */}
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
                src={buildUrl(previewFile)} 
                alt="预览" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%', 
                  objectFit: 'contain',
                  display: 'block'
                }}
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  console.error('图片加载失败:', e.target.src);
                  
                  // 尝试直接访问文件URL进行诊断
                  fetch(e.target.src)
                    .then(response => {
                      console.log('文件访问诊断:', {
                        url: e.target.src,
                        status: response.status,
                        statusText: response.statusText,
                        headers: Object.fromEntries(response.headers.entries())
                      });
                    })
                    .catch(fetchError => {
                      console.error('文件访问失败:', fetchError);
                    });
                  
                  e.target.style.display = 'none';
                  // 显示错误信息
                  const errorDiv = document.createElement('div');
                  errorDiv.style.cssText = 'padding: 20px; text-align: center; color: #666;';
                  errorDiv.textContent = '图片加载失败，请检查文件是否存在';
                  e.target.parentNode.appendChild(errorDiv);
                }}
                onLoad={(e) => {
                  console.log('图片加载成功:', e.target.src);
                }}
              />
            )}
            
            {previewType === 'video' && (
              <video 
                src={buildUrl(previewFile)} 
                controls 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%',
                  display: 'block'
                }}
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  console.error('视频加载失败:', e.target.src);
                  e.target.style.display = 'none';
                  const errorDiv = document.createElement('div');
                  errorDiv.style.cssText = 'padding: 20px; text-align: center; color: #666;';
                  errorDiv.textContent = '视频加载失败，请检查文件是否存在';
                  e.target.parentNode.appendChild(errorDiv);
                }}
                onLoad={(e) => {
                  console.log('视频加载成功:', e.target.src);
                }}
              />
            )}
            
            {previewType === 'audio' && (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <audio 
                  src={buildUrl(previewFile)} 
                  controls 
                  style={{ width: '100%', maxWidth: '400px' }}
                  onError={(e) => {
                    console.error('音频加载失败:', e.target.src);
                    const errorDiv = document.createElement('div');
                    errorDiv.style.cssText = 'padding: 20px; text-align: center; color: #666;';
                    errorDiv.textContent = '音频加载失败，请检查文件是否存在';
                    e.target.parentNode.appendChild(errorDiv);
                  }}
                  onLoad={(e) => {
                    console.log('音频加载成功:', e.target.src);
                  }}
                />
              </div>
            )}
            
            {previewType === 'document' && (
              <div style={{ width: '800px', height: '600px' }}>
                <iframe
                  src={buildUrl(previewFile)}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="文档预览"
                  onError={(e) => {
                    console.error('文档加载失败:', e.target.src);
                    const errorDiv = document.createElement('div');
                    errorDiv.style.cssText = 'padding: 20px; text-align: center; color: #666;';
                    errorDiv.textContent = '文档加载失败，请检查文件是否存在';
                    e.target.parentNode.appendChild(errorDiv);
                  }}
                  onLoad={(e) => {
                    console.log('文档加载成功:', e.target.src);
                  }}
                />
              </div>
            )}
            
            {previewType === 'text' && (
              <div style={{ width: '800px', height: '600px', padding: '20px' }}>
                <iframe
                  src={buildUrl(previewFile)}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="文本预览"
                  onError={(e) => {
                    console.error('文本加载失败:', e.target.src);
                    const errorDiv = document.createElement('div');
                    errorDiv.style.cssText = 'padding: 20px; text-align: center; color: #666;';
                    errorDiv.textContent = '文本加载失败，请检查文件是否存在';
                    e.target.parentNode.appendChild(errorDiv);
                  }}
                  onLoad={(e) => {
                    console.log('文本加载成功:', e.target.src);
                  }}
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
