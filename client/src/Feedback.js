import React, { useState, useEffect, useCallback, useMemo } from 'react';
import FileUploader from './FileUploader';
import Avatar from './Avatar';
import config from './config';

export default function Feedback({ user }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [category, setCategory] = useState('teaching');
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // 使用useMemo缓存分类数据
  const categories = useMemo(() => [
    { key: 'teaching', label: '教学', dbValue: '教学' },
    { key: 'dormitory', label: '宿舍', dbValue: '宿舍' },
    { key: 'canteen', label: '食堂', dbValue: '食堂' },
    { key: 'environment', label: '校园环境', dbValue: '校园环境' }
  ], []);

  // 优化的媒体渲染函数
  const renderMedia = useCallback((urls) => {
    if (!Array.isArray(urls) || urls.length === 0) return null;
    
    return (
      <div style={{ marginTop: 8 }}>
        {urls.map((url, idx) => {
          const ext = url.split('.').pop()?.toLowerCase();
          if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) {
            return (
              <img
                key={idx}
                src={config.API_BASE_URL + url}
                alt={`媒体 ${idx + 1}`}
                style={{ width: 100, height: 100, objectFit: 'cover', marginRight: 8, cursor: 'pointer' }}
                onClick={() => setSelectedImage(config.API_BASE_URL + url)}
              />
            );
          }
          return (
            <a key={idx} href={config.API_BASE_URL + url} target="_blank" rel="noopener noreferrer" style={{ marginRight: 8 }}>
              文件 {idx + 1}
            </a>
          );
        })}
      </div>
    );
  }, []);

  // 优化的数据获取函数
  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setList([]);
        return;
      }

      const res = await fetch(`${config.API_BASE_URL}/api/feedback`, {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setList(Array.isArray(data) ? data : []);
      } else {
        console.error('获取反馈失败:', res.status);
        setList([]);
      }
    } catch (error) {
      console.error('获取反馈数据失败:', error);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 使用useEffect获取数据
  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleFileUpload = useCallback((url) => {
    setMedia(prev => [...prev, url]);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setMsg('请输入反馈内容');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setMsg('请先登录');
        return;
      }

      const selectedCategory = categories.find(c => c.key === category);
      const res = await fetch(`${config.API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          category: selectedCategory?.dbValue || category, 
          content: content.trim(), 
          media 
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMsg('提交成功');
        setContent('');
        setMedia([]);
        fetchFeedbacks(); // 重新获取数据
      } else {
        setMsg(data.error || '提交失败');
      }
    } catch (error) {
      console.error('提交反馈失败:', error);
      setMsg('提交失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [content, category, media, categories, fetchFeedbacks]);

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h2>意见反馈</h2>
      
      {selectedImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="预览" style={{ maxWidth: '90%', maxHeight: '90%' }} />
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginBottom: 30 }}>
        <div style={{ marginBottom: 15 }}>
          <select 
            value={category} 
            onChange={e => setCategory(e.target.value)} 
            style={{ padding: 8, marginRight: 10, minWidth: 120 }}
          >
            {categories.map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
        
        <div style={{ marginBottom: 15 }}>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="请输入你的意见或建议"
            style={{ 
              width: '100%', 
              minHeight: 100, 
              padding: 12, 
              border: '1px solid #ddd', 
              borderRadius: 4,
              resize: 'vertical'
            }}
          />
        </div>
        
        <div style={{ marginBottom: 15 }}>
          <FileUploader onUpload={handleFileUpload} />
          {renderMedia(media)}
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '提交中...' : '提交'}
        </button>
      </form>

      {msg && (
        <div style={{ 
          color: msg === '提交成功' ? 'green' : 'red', 
          marginBottom: 15,
          padding: 10,
          backgroundColor: msg === '提交成功' ? '#d4edda' : '#f8d7da',
          border: `1px solid ${msg === '提交成功' ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: 4
        }}>
          {msg}
        </div>
      )}

      <div>
        <h3>反馈列表</h3>
        {loading && <div style={{ textAlign: 'center', padding: 20 }}>加载中...</div>}
        
        {!loading && list.length === 0 && (
          <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>
            暂无反馈记录
          </div>
        )}
        
        {!loading && list.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {list.map(item => (
              <li key={item._id} style={{ 
                marginBottom: 20, 
                borderBottom: '1px solid #eee', 
                paddingBottom: 15,
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: 12 
              }}>
                <Avatar src={item.authorAvatar} name={item.authorName} size={40} />
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    marginBottom: 5 
                  }}>
                    <strong style={{ color: '#333' }}>{item.authorName || '匿名用户'}</strong>
                    <span style={{ 
                      fontSize: 12, 
                      color: '#888',
                      backgroundColor: '#f0f0f0',
                      padding: '2px 6px',
                      borderRadius: 3
                    }}>
                      {categories.find(c => c.key === item.category)?.label || item.category}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                  <div style={{ color: '#333', lineHeight: 1.5 }}>
                    {item.content}
                  </div>
                  {renderMedia(item.media)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}