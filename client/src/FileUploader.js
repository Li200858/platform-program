import React, { useRef, useState } from 'react';

export default function FileUploader({ onUpload }) {
  const fileInput = useRef();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    const file = fileInput.current.files[0];
    if (!file) return;
    setUploading(true);
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
  };

  return (
    <div style={{ margin: '10px 0' }}>
      <input type="file" ref={fileInput} />
      <button type="button" onClick={handleUpload} disabled={uploading}>
        {uploading ? '上传中...' : '上传文件'}
      </button>
    </div>
  );
}