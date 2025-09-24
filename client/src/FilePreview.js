import React, { useState } from 'react';

export default function FilePreview({ urls, apiBaseUrl = process.env.NODE_ENV === 'production' ? 'https://platform-program.onrender.com' : 'http://localhost:5000', showDownloadButton = false, onDownload, allowDownload = true }) {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!urls || urls.length === 0) {
    return null;
  }

  const getFileType = (url) => {
    const extension = url.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) {
      return 'image';
    } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) {
      return 'video';
    } else if (['pdf'].includes(extension)) {
      return 'pdf';
    } else if (['doc', 'docx'].includes(extension)) {
      return 'word';
    } else if (['xls', 'xlsx'].includes(extension)) {
      return 'excel';
    } else if (['ppt', 'pptx'].includes(extension)) {
      return 'powerpoint';
    } else {
      return 'file';
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'image':
        return '';
      case 'video':
        return '';
      case 'pdf':
        return '';
      case 'word':
        return '';
      case 'excel':
        return '';
      case 'powerpoint':
        return '';
      default:
        return '';
    }
  };

  const handleDownload = (url) => {
    const link = document.createElement('a');
    // 如果URL已经包含完整路径，直接使用；否则构建完整URL
    const downloadUrl = url.startsWith('http') ? url : `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`;
    link.href = downloadUrl;
    link.download = url.split('/').pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ marginTop: '15px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {urls.map((url, index) => {
          const fileType = getFileType(url);
          // 如果URL已经包含完整路径，直接使用；否则构建完整URL
          const fullUrl = url.startsWith('http') ? url : `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`;
          const fileName = url.split('/').pop();

          return (
            <div key={index} style={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: '8px', 
              padding: '10px', 
              background: '#f9f9f9',
              minWidth: '120px',
              textAlign: 'center'
            }}>
              {fileType === 'image' ? (
                <div>
                  <img
                    src={fullUrl}
                    alt={fileName}
                    style={{
                      width: '100px',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: '2px solid #fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    onClick={() => setSelectedImage(fullUrl)}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div style={{ display: 'none', fontSize: '48px', margin: '20px 0' }}>
                    {getFileIcon(fileType)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px', wordBreak: 'break-all' }}>
                    {fileName}
                  </div>
                  <button
                    onClick={() => window.open(fullUrl, '_blank')}
                    style={{
                      marginTop: '5px',
                      padding: '4px 8px',
                      fontSize: '10px',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    预览
                  </button>
                  {allowDownload && (
                    <button
                      onClick={() => handleDownload(url)}
                      style={{
                        marginTop: '5px',
                        marginLeft: '5px',
                        padding: '4px 8px',
                        fontSize: '10px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      下载
                    </button>
                  )}
                </div>
              ) : fileType === 'video' ? (
                <div>
                  <video
                    src={fullUrl}
                    controls
                    style={{
                      width: '100px',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: '2px solid #fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div style={{ display: 'none', fontSize: '48px', margin: '20px 0' }}>
                    {getFileIcon(fileType)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px', wordBreak: 'break-all' }}>
                    {fileName}
                  </div>
                  <button
                    onClick={() => window.open(fullUrl, '_blank')}
                    style={{
                      marginTop: '5px',
                      padding: '4px 8px',
                      fontSize: '10px',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    预览
                  </button>
                  {allowDownload && (
                    <button
                      onClick={() => handleDownload(url)}
                      style={{
                        marginTop: '5px',
                        marginLeft: '5px',
                        padding: '4px 8px',
                        fontSize: '10px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      下载
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '48px', margin: '20px 0' }}>
                    {getFileIcon(fileType)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px', wordBreak: 'break-all' }}>
                    {fileName}
                  </div>
                  <button
                    onClick={() => window.open(fullUrl, '_blank')}
                    style={{
                      marginTop: '5px',
                      padding: '4px 8px',
                      fontSize: '10px',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    预览
                  </button>
                  {allowDownload && (
                    <button
                      onClick={() => handleDownload(url)}
                      style={{
                        marginTop: '5px',
                        marginLeft: '5px',
                        padding: '4px 8px',
                        fontSize: '10px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      下载
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 图片放大弹窗 */}
      {selectedImage && (
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
            zIndex: 1000
          }}
          onClick={() => setSelectedImage(null)}
        >
          <img 
            src={selectedImage} 
            alt="" 
            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}