import React, { useState, useEffect } from 'react';
import FileUploader from './FileUploader';

export default function ContentStatus() {
  const [contentStatus, setContentStatus] = useState({ pending: [], approved: [], rejected: [] });
  const [activeTab, setActiveTab] = useState('pending');
  const [editingContent, setEditingContent] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    category: '',
    media: []
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchContentStatus();
  }, []);

  const fetchContentStatus = async () => {
    try {
      const res = await fetch('/api/user-content-status', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      if (res.ok) {
        const data = await res.json();
        setContentStatus(data);
      }
    } catch (error) {
      console.error('获取内容状态失败:', error);
      setMsg('获取内容状态失败，请检查网络连接');
    }
  };

  const deleteContent = async (contentId) => {
    if (!window.confirm('确定要删除这条内容吗？')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/pending-content/${contentId}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      if (res.ok) {
        setMsg('内容已删除');
        fetchContentStatus();
      } else {
        const error = await res.json();
        setMsg(error.error);
      }
    } catch (error) {
      setMsg('删除失败');
    }
  };

  const startEdit = (content) => {
    setEditingContent(content);
    setEditForm({
      title: content.title,
      content: content.content,
      category: content.category,
      media: content.media || []
    });
  };

  const handleMediaUpload = (url) => {
    setEditForm(prev => ({
      ...prev,
      media: [...prev.media, url]
    }));
  };

  const removeMedia = (index) => {
    setEditForm(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
    }));
  };

  const saveEdit = async () => {
    if (!editForm.title.trim() || !editForm.content.trim() || !editForm.category) {
      setMsg('请填写完整信息');
      return;
    }

    try {
      const res = await fetch(`/api/pending-content/${editingContent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setMsg('内容已更新并重新提交审核');
        setEditingContent(null);
        setEditForm({ title: '', content: '', category: '', media: [] });
        fetchContentStatus();
      } else {
        const error = await res.json();
        setMsg(error.error);
      }
    } catch (error) {
      setMsg('更新失败');
    }
  };

  const cancelEdit = () => {
    setEditingContent(null);
    setEditForm({ title: '', content: '', category: '', media: [] });
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'study': return '学习板块';
      case 'art': return '艺术板块';
      case 'activity': return '活动板块';
      case 'crosscampus': return '跨校联合';
      case 'pending': return '待审核';
      case 'rejected': return '被驳回';
      default: return type;
    }
  };

  const renderMedia = (urls) => (
    <div style={{ marginTop: 8 }}>
      {urls && urls.map((url, idx) => {
        const ext = url.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
          return <img key={idx} src={url} alt="" style={{ maxWidth: 120, marginRight: 8 }} />;
        }
        if (['mp4', 'webm', 'ogg'].includes(ext)) {
          return <video key={idx} src={url} controls style={{ maxWidth: 180, marginRight: 8 }} />;
        }
        return (
          <a 
            key={idx} 
            href={url} 
            download 
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

  if (editingContent) {
    return (
      <div style={{ 
        maxWidth: 900, 
        margin: '40px auto', 
        background: '#fff', 
        borderRadius: 16, 
        padding: 40, 
        boxShadow: '0 8px 32px rgba(79, 70, 229, 0.12)',
        border: '1px solid #F8FAFC'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
          <h2 style={{ 
            margin: 0, 
            color: '#4F46E5', 
            fontSize: '24px', 
            fontWeight: '600' 
          }}>
修改内容
          </h2>
          <button 
            onClick={cancelEdit}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#6B7280', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => e.target.style.backgroundColor = '#4B5563'}
            onMouseLeave={e => e.target.style.backgroundColor = '#6B7280'}
          >
            取消
          </button>
        </div>

        {msg && (
          <div style={{
            padding: '12px 16px',
            marginBottom: 20,
            backgroundColor: msg.includes('内容已更新并重新提交审核') || msg.includes('成功') ? '#D1FAE5' : '#FEE2E2',
            color: msg.includes('内容已更新并重新提交审核') || msg.includes('成功') ? '#059669' : '#DC2626',
            borderRadius: '8px',
            border: `1px solid ${msg.includes('内容已更新并重新提交审核') || msg.includes('成功') ? '#A7F3D0' : '#FECACA'}`,
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {msg}
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: '600', 
            color: '#374151',
            fontSize: '14px'
          }}>
            分类：
          </label>
          <select 
            value={editForm.category} 
            onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value }))}
            style={{ 
              width: '100%', 
              padding: '12px 16px',
              border: '2px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '14px',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            required
            onFocus={e => e.target.style.borderColor = '#4F46E5'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'}
          >
            <option value="">请选择分类</option>
            {editingContent.type === 'study' && [
              'PBL项目式学习', '学习经验分享', '学习资料分享', '科普内容'
            ].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
            {editingContent.type === 'art' && [
              '音乐', '绘画', '舞蹈', '写作'
            ].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
            {editingContent.type === 'activity' && [
              '活动策划', '其他'
            ].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
            {editingContent.type === 'crosscampus' && [
              '活动举办', '学术交流'
            ].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: '600', 
            color: '#374151',
            fontSize: '14px'
          }}>
            标题：
          </label>
          <input 
            type="text"
            value={editForm.title} 
            onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
            style={{ 
              width: '100%', 
              padding: '12px 16px',
              border: '2px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '14px',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            placeholder="请输入标题"
            required
            onFocus={e => e.target.style.borderColor = '#4F46E5'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: '600', 
            color: '#374151',
            fontSize: '14px'
          }}>
            内容：
          </label>
          <textarea 
            value={editForm.content} 
            onChange={e => setEditForm(prev => ({ ...prev, content: e.target.value }))}
            style={{ 
              width: '100%', 
              padding: '12px 16px',
              border: '2px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '14px',
              minHeight: 200,
              resize: 'vertical',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            placeholder="请输入内容"
            required
            onFocus={e => e.target.style.borderColor = '#4F46E5'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: '600', 
            color: '#374151',
            fontSize: '14px'
          }}>
            媒体文件：
          </label>
          <FileUploader onUpload={handleMediaUpload} />
          {editForm.media.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <strong style={{ color: '#374151', fontSize: '14px' }}>
                已上传的文件：
              </strong>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                {editForm.media.map((url, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <img 
                      src={url} 
                      alt={`媒体文件${index + 1}`}
                      style={{ 
                        width: 100, 
                        height: 100, 
                        objectFit: 'cover', 
                        borderRadius: '8px',
                        border: '2px solid #E5E7EB'
                      }} 
                    />
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      style={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: '#DC2626',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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

        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <button 
            onClick={saveEdit}
            style={{ 
              padding: '12px 24px', 
              backgroundColor: '#4F46E5', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px',
              cursor: 'pointer',
              marginRight: 16,
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
            }}
            onMouseEnter={e => {
              e.target.style.backgroundColor = '#3730A3';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.target.style.backgroundColor = '#4F46E5';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            保存并重新提交
          </button>
          <button 
            onClick={cancelEdit}
            style={{ 
              padding: '12px 24px', 
              backgroundColor: '#6B7280', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => e.target.style.backgroundColor = '#4B5563'}
            onMouseLeave={e => e.target.style.backgroundColor = '#6B7280'}
          >
            取消
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: 1200, 
      margin: '40px auto', 
      background: '#fff', 
      borderRadius: 16, 
      padding: 40, 
      boxShadow: '0 8px 32px rgba(79, 70, 229, 0.12)',
      border: '1px solid #F8FAFC'
    }}>
      <h2 style={{ 
        margin: '0 0 30px 0', 
        color: '#4F46E5', 
        fontSize: '28px', 
        fontWeight: '600',
        textAlign: 'center'
      }}>
        内容处理状态
      </h2>
      
      {msg && (
        <div style={{
          padding: '12px 16px',
          marginBottom: 20,
          backgroundColor: msg.includes('成功') || msg.includes('内容已删除') || msg.includes('内容已更新并重新提交审核') ? '#D1FAE5' : '#FEE2E2',
          color: msg.includes('成功') || msg.includes('内容已删除') || msg.includes('内容已更新并重新提交审核') ? '#059669' : '#DC2626',
          borderRadius: '8px',
          border: `1px solid ${msg.includes('成功') || msg.includes('内容已删除') || msg.includes('内容已更新并重新提交审核') ? '#A7F3D0' : '#FECACA'}`,
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, marginBottom: 30, flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: activeTab === 'pending' ? '2px solid #F59E0B' : '2px solid #E5E7EB',
            background: activeTab === 'pending' ? '#FEF3C7' : '#F8FAFC',
            color: activeTab === 'pending' ? '#92400E' : '#374151',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => {
            if (activeTab !== 'pending') {
              e.target.style.borderColor = '#4F46E5';
              e.target.style.backgroundColor = '#EEF2FF';
            }
          }}
          onMouseLeave={e => {
            if (activeTab !== 'pending') {
              e.target.style.borderColor = '#E5E7EB';
              e.target.style.backgroundColor = '#F8FAFC';
            }
          }}
        >
审核中 ({contentStatus.pending.length})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: activeTab === 'approved' ? '2px solid #10B981' : '2px solid #E5E7EB',
            background: activeTab === 'approved' ? '#D1FAE5' : '#F8FAFC',
            color: activeTab === 'approved' ? '#047857' : '#374151',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => {
            if (activeTab !== 'approved') {
              e.target.style.borderColor = '#4F46E5';
              e.target.style.backgroundColor = '#EEF2FF';
            }
          }}
          onMouseLeave={e => {
            if (activeTab !== 'approved') {
              e.target.style.borderColor = '#E5E7EB';
              e.target.style.backgroundColor = '#F8FAFC';
            }
          }}
        >
已通过 ({contentStatus.approved.length})
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: activeTab === 'rejected' ? '2px solid #EF4444' : '2px solid #E5E7EB',
            background: activeTab === 'rejected' ? '#FEE2E2' : '#F8FAFC',
            color: activeTab === 'rejected' ? '#B91C1C' : '#374151',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => {
            if (activeTab !== 'rejected') {
              e.target.style.borderColor = '#4F46E5';
              e.target.style.backgroundColor = '#EEF2FF';
            }
          }}
          onMouseLeave={e => {
            if (activeTab !== 'rejected') {
              e.target.style.borderColor = '#E5E7EB';
              e.target.style.backgroundColor = '#F8FAFC';
            }
          }}
        >
被驳回 ({contentStatus.rejected.length})
        </button>
      </div>

      <div>
        {activeTab === 'pending' && (
          <div>
            <h3>审核中</h3>
            {contentStatus.pending.length === 0 ? (
              <p>暂无审核中的内容</p>
            ) : (
              Array.isArray(contentStatus.pending) && contentStatus.pending.map(content => (
                <div key={content._id} style={{ 
                  marginBottom: 20, 
                  padding: 20, 
                  border: '1px solid #ffc107', 
                  borderRadius: 8,
                  backgroundColor: '#fff3cd'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <h4>{content.title}</h4>
                    <span style={{ 
                      padding: '5px 10px', 
                      borderRadius: 3,
                      backgroundColor: '#ffc107',
                      color: '#856404',
                      fontSize: '12px'
                    }}>
                      审核中
                    </span>
                  </div>
                  <p><strong>板块：</strong>{getTypeText(content.type)}</p>
                  <p><strong>分类：</strong>{content.category}</p>
                  <p><strong>提交时间：</strong>{new Date(content.createdAt).toLocaleString()}</p>
                  <p><strong>内容：</strong></p>
                  <div style={{ 
                    padding: 10, 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: 3, 
                    marginBottom: 10,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {content.content}
                  </div>
                  {renderMedia(content.media)}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'approved' && (
          <div>
            <h3>已通过</h3>
            {contentStatus.approved.length === 0 ? (
              <p>暂无已通过的内容</p>
            ) : (
              Array.isArray(contentStatus.approved) && contentStatus.approved.map(content => (
                <div key={content._id} style={{ 
                  marginBottom: 20, 
                  padding: 20, 
                  border: '1px solid #28a745', 
                  borderRadius: 8,
                  backgroundColor: '#d4edda'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <h4>{content.title}</h4>
                    <span style={{ 
                      padding: '5px 10px', 
                      borderRadius: 3,
                      backgroundColor: '#28a745',
                      color: 'white',
                      fontSize: '12px'
                    }}>
                      已通过
                    </span>
                  </div>
                  <p><strong>板块：</strong>{getTypeText(content.type)}</p>
                  <p><strong>分类：</strong>{content.category}</p>
                  <p><strong>发布时间：</strong>{new Date(content.createdAt).toLocaleString()}</p>
                  <p><strong>内容：</strong></p>
                  <div style={{ 
                    padding: 10, 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: 3, 
                    marginBottom: 10,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {content.content}
                  </div>
                  {renderMedia(content.media)}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'rejected' && (
          <div>
            <h3>被驳回</h3>
            {contentStatus.rejected.length === 0 ? (
              <p>暂无被驳回的内容</p>
            ) : (
              Array.isArray(contentStatus.rejected) && contentStatus.rejected.map(content => (
                <div key={content._id} style={{ 
                  marginBottom: 20, 
                  padding: 20, 
                  border: '1px solid #dc3545', 
                  borderRadius: 8,
                  backgroundColor: '#f8d7da'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <h4>{content.title}</h4>
                    <div>
                      <button 
                        onClick={() => startEdit(content)}
                        style={{ 
                          marginRight: 10, 
                          padding: '5px 10px', 
                          backgroundColor: '#007bff', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: 3, 
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        修改
                      </button>
                      <button 
                        onClick={() => deleteContent(content._id)}
                        style={{ 
                          padding: '5px 10px', 
                          backgroundColor: '#dc3545', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: 3, 
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  <p><strong>板块：</strong>{getTypeText(content.type)}</p>
                  <p><strong>分类：</strong>{content.category}</p>
                  <p><strong>提交时间：</strong>{new Date(content.createdAt).toLocaleString()}</p>
                  <p><strong>驳回原因：</strong></p>
                  <div style={{ 
                    padding: 10, 
                    backgroundColor: '#e9ecef', 
                    borderRadius: 3, 
                    marginBottom: 10,
                    color: '#721c24'
                  }}>
                    {content.reviewNote}
                  </div>
                  <p><strong>内容：</strong></p>
                  <div style={{ 
                    padding: 10, 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: 3, 
                    marginBottom: 10,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {content.content}
                  </div>
                  {renderMedia(content.media)}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
} 