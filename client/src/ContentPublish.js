import React, { useState, useEffect } from 'react';
import FileUploader from './FileUploader';

export default function ContentPublish({ type, onBack }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [media, setMedia] = useState([]);
  const [msg, setMsg] = useState('');
  const [profileComplete, setProfileComplete] = useState(true);
  const [profileMessage, setProfileMessage] = useState('');
  const [autoSave, setAutoSave] = useState(true);

  const getTypeText = (type) => {
    switch (type) {
      case 'study': return '学习板块';
      case 'art': return '艺术创作';
      case 'activity': return '活动策划';
      case 'crosscampus': return '跨校联合';
      default: return type;
    }
  };

  const getCategories = (type) => {
    switch (type) {
      case 'study':
        return ['PBL项目式学习', '学习经验分享', '学习资料分享', '科普内容'];
      case 'art':
        return ['音乐', '绘画', '舞蹈', '写作'];
      case 'activity':
        return ['活动策划', '其他'];
      case 'crosscampus':
        return ['活动举办', '学术交流'];
      default:
        return ['其他'];
    }
  };

  const handleMediaUpload = (url) => {
    setMedia([...media, url]);
  };

  // 加载保存的内容
  useEffect(() => {
    const savedContent = localStorage.getItem(`content_draft_${type}`);
    if (savedContent) {
      const parsed = JSON.parse(savedContent);
      setTitle(parsed.title || '');
      setContent(parsed.content || '');
      setCategory(parsed.category || '');
      setMedia(parsed.media || []);
    }
  }, [type]);

  // 检查个人信息是否完善
  useEffect(() => {
    const checkProfileComplete = async () => {
      try {
        const res = await fetch('/api/user-profile-complete', {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
        });
        if (res.ok) {
          const data = await res.json();
          setProfileComplete(data.isComplete);
          setProfileMessage(data.message);
        }
      } catch (error) {
        console.error('检查个人信息失败:', error);
        setProfileMessage('无法检查个人信息，请稍后重试');
      }
    };
    
    checkProfileComplete();
  }, []);

  // 自动保存功能
  useEffect(() => {
    if (autoSave) {
      const saveContent = () => {
        const contentToSave = {
          title,
          content,
          category,
          media,
          timestamp: Date.now()
        };
        localStorage.setItem(`content_draft_${type}`, JSON.stringify(contentToSave));
      };

      const timeoutId = setTimeout(saveContent, 1000); // 1秒后自动保存
      return () => clearTimeout(timeoutId);
    }
  }, [title, content, category, media, type, autoSave]);

  const removeMedia = (index) => {
    setMedia(media.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');

    if (!profileComplete) {
      setMsg('请先在"我的"板块中完善个人信息');
      return;
    }

    if (!title.trim() || !content.trim() || !category) {
      setMsg('请填写完整信息');
      return;
    }

    try {
      // 获取当前用户信息
      const userRes = await fetch('/api/me', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      const userData = await userRes.json();

      const res = await fetch('/api/pending-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({
          type,
          category,
          title: title.trim(),
          content: content.trim(),
          media,
          authorName: userData.name || userData.email,
          authorAvatar: userData.avatar || ''
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMsg('内容已提交审核，请等待管理员审核');
        setTitle('');
        setContent('');
        setCategory('');
        setMedia([]);
        // 清除本地保存的草稿
        localStorage.removeItem(`content_draft_${type}`);
      } else {
        setMsg(data.error || '提交失败');
      }
    } catch (error) {
      console.error('内容提交失败:', error);
      setMsg('提交失败，请检查网络连接后重试');
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 10, padding: 30, boxShadow: '0 2px 8px #eee' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <h2>发布{getTypeText(type)}内容</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            onClick={onBack}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: 5, 
              cursor: 'pointer' 
            }}
          >
            返回
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <input
              type="checkbox"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
            />
            自动保存
          </label>
        </div>
      </div>

      {!profileComplete && (
        <div style={{
          padding: 15,
          marginBottom: 20,
          backgroundColor: '#fff3cd',
          color: '#856404',
          borderRadius: 5,
          border: '1px solid #ffeaa7'
        }}>
          <strong>⚠️ 个人信息不完整</strong><br />
          {profileMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>分类：</label>
          <select 
            value={category} 
            onChange={e => setCategory(e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 5, border: '1px solid #ddd' }}
            required
          >
            <option value="">请选择分类</option>
            {getCategories(type).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>标题：</label>
          <input 
            type="text"
            value={title} 
            onChange={e => setTitle(e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 5, border: '1px solid #ddd' }}
            placeholder="请输入标题"
            required
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>内容：</label>
          <textarea 
            value={content} 
            onChange={e => setContent(e.target.value)}
            style={{ 
              width: '100%', 
              padding: 8, 
              borderRadius: 5, 
              border: '1px solid #ddd',
              minHeight: 200,
              resize: 'vertical'
            }}
            placeholder="请输入内容"
            required
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>媒体文件：</label>
          <FileUploader onUpload={handleMediaUpload} />
          {media.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <strong>已上传的文件：</strong>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 5 }}>
                {media.map((url, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <img 
                      src={url} 
                      alt={`媒体${index + 1}`} 
                      style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 5 }} 
                    />
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      style={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ 
            padding: 15, 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: 5,
            color: '#856404'
          }}>
            <strong>提示：</strong>您发布的内容需要经过管理员审核后才能正式显示在网站上。
          </div>
        </div>

        <button 
          type="submit" 
          style={{ 
            padding: '12px 24px', 
            backgroundColor: '#3498db', 
            color: 'white', 
            border: 'none', 
            borderRadius: 5,
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          提交审核
        </button>
      </form>

      {msg && (
        <div style={{ 
          marginTop: 20,
          padding: 10,
          backgroundColor: msg.includes('成功') ? '#d4edda' : '#f8d7da',
          color: msg.includes('成功') ? '#155724' : '#721c24',
          borderRadius: 5,
          border: `1px solid ${msg.includes('成功') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {msg}
        </div>
      )}
    </div>
  );
} 