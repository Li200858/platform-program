import React, { useState, useEffect } from 'react';
import FileUploader from './FileUploader';
import Avatar from './Avatar';

export default function Feedback({ user }) {
  const [selectedImage, setSelectedImage] = useState(null);
  
  const categories = [
    { key: 'teaching', label: '教学', dbValue: '教学' },
    { key: 'dormitory', label: '宿舍', dbValue: '宿舍' },
    { key: 'canteen', label: '食堂', dbValue: '食堂' },
    { key: 'environment', label: '校园环境', dbValue: '校园环境' }
  ];
  
  const [category, setCategory] = useState(categories[0].key);
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/feedback')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setList(data);
        } else {
          console.error('API返回的数据不是数组:', data);
          setList([]);
        }
      });
  }, []);

  const handleFileUpload = url => setMedia([...media, url]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    if (!content.trim()) {
      setMsg('内容不能为空');
      return;
    }
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({ category: categories.find(c => c.key === category)?.dbValue || category, content, media })
    });
    const data = await res.json();
    if (res.ok) {
      setList([data, ...(Array.isArray(list) ? list : [])]);
      setContent('');
      setMedia([]);
      setMsg('提交成功');
    } else {
      setMsg(data.error || '提交失败');
    }
  };

  const renderMedia = (urls) => (
    <div style={{ marginTop: 8 }}>
      {urls && urls.map((url, idx) => {
        const ext = url.split('.').pop().toLowerCase();
        if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) {
          return (
            <img 
              key={idx} 
              src={`http://localhost:5000${url}`} 
              alt="" 
              style={{ maxWidth: 120, marginRight: 8, cursor: 'pointer' }} 
              onClick={() => setSelectedImage(`http://localhost:5000${url}`)}
            />
          );
        }
        if (["mp4", "webm", "ogg"].includes(ext)) {
          return <video key={idx} src={`http://localhost:5000${url}`} controls style={{ maxWidth: 180, marginRight: 8 }} />;
        }
        if (["pdf"].includes(ext)) {
          return <iframe key={idx} src={`http://localhost:5000${url}`} style={{ width: 180, height: 220, marginRight: 8, border: '1px solid #eee' }} title={`pdf${idx}`}></iframe>;
        }
        if (["doc", "docx", "ppt", "pptx"].includes(ext)) {
          return <a key={idx} href={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent('http://localhost:5000' + url)}`} target="_blank" rel="noopener noreferrer" style={{ marginRight: 8, color: '#007bff', textDecoration: 'underline' }}>在线预览文档{idx + 1}</a>;
        }
        return (
          <a 
            key={idx} 
            href={`http://localhost:5000${url}`} 
            download 
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              marginRight: 8, 
              color: '#007bff', 
              textDecoration: 'underline',
              display: 'inline-block',
              padding: '4px 8px',
              border: '1px solid #007bff',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            下载文件{idx + 1}
          </a>
        );
      })}
    </div>
  );

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', background: '#fff', borderRadius: 10, padding: 30, boxShadow: '0 2px 8px #eee' }}>
      <h2>意见与评论</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 30 }}>
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: 8, marginRight: 10 }}>
          {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <input
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="请输入你的意见或建议"
          style={{ width: 300, padding: 8, marginRight: 10 }}
        />
        <FileUploader onUpload={handleFileUpload} />
        {renderMedia(media)}
        <button type="submit" style={{ padding: '8px 20px' }}>提交</button>
      </form>
      {msg && <div style={{ color: msg === '提交成功' ? 'green' : 'red', marginBottom: 10 }}>{msg}</div>}
      <ul>
        {Array.isArray(list) && list.map(item => (
          <li key={item._id} style={{ marginBottom: 15, borderBottom: '1px solid #eee', paddingBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <Avatar 
              src={item.authorAvatar ? `http://localhost:5000${item.authorAvatar}` : ''} 
              name={item.authorName || item.author || '用户'} 
              size={36}
              style={{ marginRight: 8, border: '1px solid #eee' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: 15 }}>
                {item.authorName || item.author}
                {item.authorClass && <span style={{ color: '#888', fontSize: 13, marginLeft: 8 }}>({item.authorClass})</span>}
              </div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>{new Date(item.createdAt).toLocaleString()}</div>
              <b>[{categories.find(c => c.key === item.category)?.label || item.category}]</b> {item.content}
              {renderMedia(item.media)}
            </div>
          </li>
        ))}
      </ul>

      {/* 图片放大弹窗 */}
      {selectedImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
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