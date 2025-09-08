import React, { useState, useEffect, useCallback, useMemo } from 'react';
import FileUploader from './FileUploader';
import config from './config';

export default function ContentStatus() {
  const [contentStatus, setContentStatus] = useState({ 
    pending: [], 
    approved: [], 
    rejected: [] 
  });
  const [activeTab, setActiveTab] = useState('pending');
  const [editingContent, setEditingContent] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    category: '',
    media: []
  });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // 优化的数据获取函数
  const fetchContentStatus = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setContentStatus({ pending: [], approved: [], rejected: [] });
        return;
      }

      const res = await fetch(`${config.API_BASE_URL}/api/user-content-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setContentStatus({
          pending: Array.isArray(data.pending) ? data.pending : [],
          approved: Array.isArray(data.approved) ? data.approved : [],
          rejected: Array.isArray(data.rejected) ? data.rejected : []
        });
      } else {
        console.error('获取内容状态失败:', res.status);
        setContentStatus({ pending: [], approved: [], rejected: [] });
      }
    } catch (error) {
      console.error('获取内容状态失败:', error);
      setContentStatus({ pending: [], approved: [], rejected: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContentStatus();
  }, [fetchContentStatus]);

  const deleteContent = useCallback(async (contentId) => {
    if (!window.confirm('确定要删除这条内容吗？')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${config.API_BASE_URL}/api/pending-content/${contentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setMsg('内容已删除');
        fetchContentStatus();
      } else {
        const error = await res.json();
        setMsg(error.error || '删除失败');
      }
    } catch (error) {
      console.error('删除内容失败:', error);
      setMsg('删除失败');
    } finally {
      setLoading(false);
    }
  }, [fetchContentStatus]);

  const startEdit = useCallback((content) => {
    setEditingContent(content);
    setEditForm({
      title: content.title || '',
      content: content.content || '',
      category: content.category || '',
      media: Array.isArray(content.media) ? content.media : []
    });
  }, []);

  const handleMediaUpload = useCallback((url) => {
    setEditForm(prev => ({
      ...prev,
      media: [...prev.media, url]
    }));
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingContent) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${config.API_BASE_URL}/api/pending-content/${editingContent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        setMsg('内容已更新');
        setEditingContent(null);
        setEditForm({ title: '', content: '', category: '', media: [] });
        fetchContentStatus();
      } else {
        const error = await res.json();
        setMsg(error.error || '更新失败');
      }
    } catch (error) {
      console.error('更新内容失败:', error);
      setMsg('更新失败');
    } finally {
      setLoading(false);
    }
  }, [editingContent, editForm, fetchContentStatus]);

  const cancelEdit = useCallback(() => {
    setEditingContent(null);
    setEditForm({ title: '', content: '', category: '', media: [] });
  }, []);

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
                style={{ width: 60, height: 60, objectFit: 'cover', marginRight: 8 }}
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

  // 使用useMemo缓存标签页数据
  const tabs = useMemo(() => [
    { key: 'pending', label: '审核中', count: contentStatus.pending?.length || 0, color: '#ffc107' },
    { key: 'approved', label: '已通过', count: contentStatus.approved?.length || 0, color: '#28a745' },
    { key: 'rejected', label: '被驳回', count: contentStatus.rejected?.length || 0, color: '#dc3545' }
  ], [contentStatus]);

  const currentContent = contentStatus[activeTab] || [];

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
      <h2>我的内容状态</h2>

      {msg && (
        <div style={{ 
          color: msg.includes('成功') ? 'green' : 'red', 
          marginBottom: 15,
          padding: 10,
          backgroundColor: msg.includes('成功') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${msg.includes('成功') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: 4
        }}>
          {msg}
        </div>
      )}

      {/* 标签页 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '12px 24px',
              border: '1px solid #ddd',
              backgroundColor: activeTab === tab.key ? tab.color : '#f8f9fa',
              color: activeTab === tab.key ? 'white' : '#333',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* 编辑表单 */}
      {editingContent && (
        <div style={{ 
          border: '2px solid #007bff', 
          borderRadius: 8, 
          padding: 20, 
          marginBottom: 20,
          backgroundColor: '#f8f9fa'
        }}>
          <h3>编辑内容</h3>
          <div style={{ marginBottom: 15 }}>
            <input
              type="text"
              value={editForm.title}
              onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="标题"
              style={{ width: '100%', padding: 8, marginBottom: 10 }}
            />
            <textarea
              value={editForm.content}
              onChange={e => setEditForm(prev => ({ ...prev, content: e.target.value }))}
              placeholder="内容"
              style={{ width: '100%', minHeight: 100, padding: 8, marginBottom: 10 }}
            />
            <input
              type="text"
              value={editForm.category}
              onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value }))}
              placeholder="分类"
              style={{ width: '100%', padding: 8, marginBottom: 10 }}
            />
            <FileUploader onUpload={handleMediaUpload} />
            {renderMedia(editForm.media)}
          </div>
          <div>
            <button 
              onClick={saveEdit} 
              disabled={loading}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: 4, 
                marginRight: 10,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '保存中...' : '保存'}
            </button>
            <button 
              onClick={cancelEdit}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#6c757d', 
                color: 'white', 
                border: 'none', 
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 内容列表 */}
      <div>
        {loading && <div style={{ textAlign: 'center', padding: 20 }}>加载中...</div>}
        
        {!loading && currentContent.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
            暂无{activeTab === 'pending' ? '审核中' : activeTab === 'approved' ? '已通过' : '被驳回'}的内容
          </div>
        )}
        
        {!loading && currentContent.length > 0 && (
          <div>
            {currentContent.map(content => (
              <div key={content._id} style={{ 
                marginBottom: 20, 
                padding: 20, 
                border: `1px solid ${tabs.find(t => t.key === activeTab)?.color || '#ddd'}`, 
                borderRadius: 8,
                backgroundColor: '#fff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>{content.title || '无标题'}</h4>
                    <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                      <span style={{ 
                        backgroundColor: tabs.find(t => t.key === activeTab)?.color || '#ddd',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: 3,
                        marginRight: 10
                      }}>
                        {content.category}
                      </span>
                      <span>{new Date(content.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    {activeTab === 'pending' && (
                      <button 
                        onClick={() => startEdit(content)}
                        style={{ 
                          padding: '6px 12px', 
                          backgroundColor: '#007bff', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: 4, 
                          marginRight: 8,
                          cursor: 'pointer'
                        }}
                      >
                        编辑
                      </button>
                    )}
                    <button 
                      onClick={() => deleteContent(content._id)}
                      style={{ 
                        padding: '6px 12px', 
                        backgroundColor: '#dc3545', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
                
                <div style={{ color: '#333', lineHeight: 1.5, marginBottom: 10 }}>
                  {content.content}
                </div>
                
                {renderMedia(content.media)}
                
                {content.reviewNote && (
                  <div style={{ 
                    marginTop: 10, 
                    padding: 10, 
                    backgroundColor: '#f8f9fa', 
                    borderLeft: '4px solid #ffc107',
                    borderRadius: 4
                  }}>
                    <strong>审核备注：</strong> {content.reviewNote}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}