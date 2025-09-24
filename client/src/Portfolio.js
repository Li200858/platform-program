import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';
import FilePreview from './FilePreview';
import api from './api';

export default function Portfolio({ userInfo, onBack }) {
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showUploadContent, setShowUploadContent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [newPortfolio, setNewPortfolio] = useState({
    title: '',
    description: '',
    category: '绘画',
    tags: [],
    isPublic: true,
    featured: false
  });
  const [newContent, setNewContent] = useState({
    title: '',
    content: '',
    files: [],
    allowDownload: true
  });

  useEffect(() => {
    if (userInfo && userInfo.name) {
      loadPortfolios();
    }
  }, [userInfo]);

  const loadPortfolios = async () => {
    try {
      setLoading(true);
      const data = await api.portfolio.getUserPortfolios(userInfo.name);
      setPortfolios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载作品集失败:', error);
      setPortfolios([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortfolio = async () => {
    if (!newPortfolio.title.trim()) {
      setMessage('请输入作品集标题');
      return;
    }

    try {
      await api.portfolio.create({
        ...newPortfolio,
        creator: userInfo.name
      });
      setMessage('作品集创建成功！');
      setShowCreate(false);
      setNewPortfolio({
        title: '',
        description: '',
        category: 'art',
        tags: [],
        isPublic: true,
        featured: false
      });
      loadPortfolios();
    } catch (error) {
      console.error('创建作品集失败:', error);
      setMessage('创建作品集失败，请重试');
    }
  };

  const handleDeletePortfolio = async (portfolioId) => {
    if (!window.confirm('确定要删除这个作品集吗？删除后无法恢复！')) {
      return;
    }

    try {
      await api.portfolio.delete(portfolioId);
      setMessage('作品集删除成功！');
      loadPortfolios();
    } catch (error) {
      console.error('删除作品集失败:', error);
      setMessage('删除作品集失败，请重试');
    }
  };

  const handleViewPortfolio = async (portfolioId) => {
    try {
      console.log('加载作品集详情:', portfolioId);
      const data = await api.portfolio.getPortfolio(portfolioId);
      console.log('作品集详情加载成功:', data);
      setSelectedPortfolio(data);
    } catch (error) {
      console.error('加载作品集详情失败:', error);
      setMessage('加载作品集详情失败');
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    setMessage('');
    setUploading(true);
    
    const uploadFormData = new FormData();
    Array.from(files).forEach(file => uploadFormData.append('files', file));

    try {
      const data = await api.upload(uploadFormData);
      if (data && data.urls && data.urls.length > 0) {
        setNewContent(prev => ({ ...prev, files: [...prev.files, ...data.urls] }));
        setMessage(`成功上传 ${data.urls.length} 个文件`);
      } else {
        setMessage('文件上传失败，请重试');
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      setMessage('文件上传失败：' + (error.message || '请检查文件大小和格式'));
    } finally {
      setUploading(false);
    }
  };

  const handleUploadContent = async () => {
    console.log('开始上传内容...', { newContent, selectedPortfolio, userInfo });
    
    if (!newContent.title.trim()) {
      setMessage('请输入作品标题');
      return;
    }

    if (!selectedPortfolio || !selectedPortfolio._id) {
      console.error('作品集信息丢失:', selectedPortfolio);
      setMessage('作品集信息错误，请重试');
      return;
    }

    try {
      setUploading(true);
      setMessage('正在上传...');
      
      const formData = new FormData();
      formData.append('title', newContent.title);
      formData.append('content', newContent.content);
      formData.append('authorName', userInfo.name);
      formData.append('authorClass', userInfo.class || '未知班级');
      formData.append('category', selectedPortfolio.category);
      formData.append('portfolioId', selectedPortfolio._id);
      formData.append('allowDownload', newContent.allowDownload);
      
      // 处理文件上传 - 如果有文件需要上传
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput && fileInput.files && fileInput.files.length > 0) {
        Array.from(fileInput.files).forEach(file => {
          formData.append('files', file);
        });
      }
      
      console.log('FormData内容:', {
        title: newContent.title,
        content: newContent.content,
        authorName: userInfo.name,
        authorClass: userInfo.class || '未知班级',
        category: selectedPortfolio.category,
        portfolioId: selectedPortfolio._id,
        filesCount: fileInput ? fileInput.files.length : 0
      });

      console.log('发送请求到:', '/api/portfolio/upload-content');
      const result = await api.portfolio.uploadContent(formData);
      
      console.log('上传成功:', result);
      setMessage('内容上传成功！');
      setShowUploadContent(false);
      setNewContent({
        title: '',
        content: '',
        files: [],
        allowDownload: true
      });
      // 重新加载作品集详情
      handleViewPortfolio(selectedPortfolio._id);
    } catch (error) {
      console.error('上传内容失败:', error);
      setMessage(`上传内容失败: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };


  if (loading) {
    return (
      <div style={{ maxWidth: 1000, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px', color: '#7f8c8d' }}>加载中...</div>
        </div>
      </div>
    );
  }

  if (selectedPortfolio) {
    return (
      <div style={{ maxWidth: 1200, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>{selectedPortfolio.title}</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => {
                console.log('点击上传内容按钮', { selectedPortfolio, showUploadContent });
                setShowUploadContent(true);
              }}
              style={{
                padding: '10px 20px',
                background: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            >
              + 上传内容
            </button>
            <button
              onClick={() => handleDeletePortfolio(selectedPortfolio._id)}
              style={{
                padding: '10px 20px',
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            >
              删除作品集
            </button>
            <button
              onClick={() => setSelectedPortfolio(null)}
              style={{
                padding: '10px 20px',
                background: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            >
              返回列表
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 20, marginBottom: 15 }}>
            <div>
              <strong>分类：</strong>
              <span style={{
                padding: '4px 8px',
                borderRadius: 12,
                fontSize: '12px',
                background: '#3498db',
                color: 'white',
                marginLeft: 8
              }}>
                {selectedPortfolio.category}
              </span>
            </div>
            <div>
              <strong>状态：</strong>
              <span style={{
                padding: '4px 8px',
                borderRadius: 12,
                fontSize: '12px',
                background: selectedPortfolio.isPublic ? '#27ae60' : '#e74c3c',
                color: 'white',
                marginLeft: 8
              }}>
                {selectedPortfolio.isPublic ? '公开' : '私密'}
              </span>
            </div>
            {selectedPortfolio.featured && (
              <div>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: 12,
                  fontSize: '12px',
                  background: '#f39c12',
                  color: 'white'
                }}>
                  精选
                </span>
              </div>
            )}
          </div>

          {selectedPortfolio.description && (
            <div style={{ marginBottom: 20 }}>
              <strong>描述：</strong>
              <p style={{ margin: '10px 0 0 0', color: '#34495e', lineHeight: 1.6 }}>
                {selectedPortfolio.description}
              </p>
            </div>
          )}

          {selectedPortfolio.tags && selectedPortfolio.tags.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <strong>标签：</strong>
              <div style={{ marginTop: 8 }}>
                {selectedPortfolio.tags.map((tag, index) => (
                  <span key={index} style={{
                    display: 'inline-block',
                    background: '#ecf0f1',
                    padding: '4px 12px',
                    borderRadius: 16,
                    fontSize: '12px',
                    margin: '2px 4px 2px 0',
                    color: '#2c3e50'
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <strong>作品列表 ({selectedPortfolio.works.length + (selectedPortfolio.contents ? selectedPortfolio.contents.length : 0)})</strong>
        </div>

        {/* 直接上传的内容 */}
        {selectedPortfolio.contents && selectedPortfolio.contents.length > 0 && (
          <div style={{ marginBottom: 30 }}>
            <h4 style={{ marginBottom: 15, color: '#34495e', fontSize: 16 }}>直接上传的内容</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {selectedPortfolio.contents.map((content, index) => (
                <div key={`content-${index}`} style={{
                  border: '1px solid #ecf0f1',
                  borderRadius: 12,
                  padding: 20,
                  background: '#f8f9fa'
                }}>
                  <div style={{ marginBottom: 15 }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>
                      {content.title}
                    </h5>
                    <p style={{ margin: '0 0 15px 0', color: '#7f8c8d', fontSize: '14px' }}>
                      {content.content?.substring(0, 100) || '暂无内容描述'}...
                    </p>
                    {content.media && content.media.length > 0 && (
                      <div style={{ marginBottom: 15 }}>
                        <FilePreview files={content.media} />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#7f8c8d' }}>
                    <span>{new Date(content.createdAt).toLocaleDateString()}</span>
                    <span>{content.authorName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 关联的艺术作品 */}
        {selectedPortfolio.works && selectedPortfolio.works.length > 0 && (
          <div style={{ marginBottom: 30 }}>
            <h4 style={{ marginBottom: 15, color: '#34495e', fontSize: 16 }}>关联的艺术作品</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {selectedPortfolio.works.map(work => (
                <div key={work._id} style={{
                  border: '1px solid #ecf0f1',
                  borderRadius: 12,
                  padding: 20,
                  background: '#f8f9fa'
                }}>
                  <div style={{ marginBottom: 15 }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>
                      {work.title}
                    </h5>
                    <p style={{ margin: '0 0 15px 0', color: '#7f8c8d', fontSize: '14px' }}>
                      {work.content?.substring(0, 100)}...
                    </p>
                  </div>

                  {work.media && work.media.length > 0 && (
                    <div style={{ marginBottom: 15 }}>
                      <FilePreview files={work.media} />
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#7f8c8d' }}>
                    <span>{new Date(work.createdAt).toLocaleDateString()}</span>
                    <span>{work.authorName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {(!selectedPortfolio.contents || selectedPortfolio.contents.length === 0) && 
         (!selectedPortfolio.works || selectedPortfolio.works.length === 0) && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>[文件夹]</div>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>暂无作品</div>
            <div style={{ fontSize: '14px' }}>点击"上传内容"来添加您的作品</div>
          </div>
        )}

        <div style={{ marginTop: 30, padding: '20px', background: '#f8f9fa', borderRadius: 8 }}>
          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
            创建时间: {new Date(selectedPortfolio.createdAt).toLocaleString()} • 
            最后更新: {new Date(selectedPortfolio.updatedAt).toLocaleString()} • 
            作品数量: {selectedPortfolio.works.length}
          </div>
        </div>

        {/* 上传内容弹窗 - 移到作品集详情页面 */}
        {showUploadContent && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: 15,
              padding: 30,
              width: '90%',
              maxWidth: 600,
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>上传内容到作品集</h3>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>作品标题 *</label>
                <input
                  type="text"
                  value={newContent.title}
                  onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                  placeholder="请输入作品标题"
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    fontSize: 14
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>作品描述</label>
                <textarea
                  value={newContent.content}
                  onChange={(e) => setNewContent({ ...newContent, content: e.target.value })}
                  placeholder="请输入作品描述..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    fontSize: 14,
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>上传文件</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files.length > 0) {
                      setMessage(`已选择 ${files.length} 个文件，点击上传按钮开始上传`);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    fontSize: 14
                  }}
                />
                <div style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
                  支持多种格式，可同时选择多个文件
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newContent.allowDownload}
                    onChange={(e) => setNewContent({ ...newContent, allowDownload: e.target.checked })}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: 14 }}>允许其他用户下载此内容</span>
                </label>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  取消勾选后，其他用户将无法下载您上传的文件
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowUploadContent(false)}
                  style={{
                    padding: '10px 20px',
                    background: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleUploadContent}
                  disabled={uploading}
                  style={{
                    padding: '10px 20px',
                    background: uploading ? '#bdc3c7' : '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: uploading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {uploading ? '上传中...' : '上传'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>我的作品集</h2>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: '12px 24px',
            background: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          + 创建作品集
        </button>
      </div>

      {/* 消息显示 */}
      {message && (
        <div style={{ 
          marginBottom: 20, 
          padding: '10px 15px', 
          backgroundColor: message.includes('成功') ? '#d4edda' : '#f8d7da',
          color: message.includes('成功') ? '#155724' : '#721c24',
          borderRadius: 6,
          border: `1px solid ${message.includes('成功') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}

      {/* 作品集列表 */}
      {portfolios.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#7f8c8d' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>[作品集]</div>
          <div style={{ fontSize: '20px', marginBottom: '10px' }}>还没有作品集</div>
          <div style={{ fontSize: '14px', marginBottom: '30px' }}>创建您的第一个作品集，展示您的优秀作品</div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: '12px 24px',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            创建作品集
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {portfolios.map(portfolio => (
            <div key={portfolio._id} style={{
              border: '1px solid #ecf0f1',
              borderRadius: 12,
              padding: 20,
              background: '#f8f9fa',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onClick={() => handleViewPortfolio(portfolio._id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '16px' }}>
                  {portfolio.title}
                </h3>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  {portfolio.featured && (
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: 8,
                      fontSize: '10px',
                      background: '#f39c12',
                      color: 'white'
                    }}>
                      精选
                    </span>
                  )}
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: 8,
                    fontSize: '10px',
                    background: portfolio.isPublic ? '#27ae60' : '#e74c3c',
                    color: 'white'
                  }}>
                    {portfolio.isPublic ? '公开' : '私密'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePortfolio(portfolio._id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#e74c3c',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '2px 6px',
                      borderRadius: 4
                    }}
                    title="删除作品集"
                  >
                    ×
                  </button>
                </div>
              </div>

              <p style={{ margin: '0 0 15px 0', color: '#34495e', fontSize: '14px', lineHeight: 1.4 }}>
                {portfolio.description || '暂无描述'}
              </p>

              <div style={{ marginBottom: 15 }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: 12,
                  fontSize: '11px',
                  background: '#3498db',
                  color: 'white'
                }}>
                  {portfolio.category}
                </span>
              </div>

              {portfolio.tags && portfolio.tags.length > 0 && (
                <div style={{ marginBottom: 15 }}>
                  {portfolio.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} style={{
                      display: 'inline-block',
                      background: '#ecf0f1',
                      padding: '2px 6px',
                      borderRadius: 10,
                      fontSize: '10px',
                      margin: '1px 2px 1px 0',
                      color: '#2c3e50'
                    }}>
                      #{tag}
                    </span>
                  ))}
                  {portfolio.tags.length > 3 && (
                    <span style={{ fontSize: '10px', color: '#7f8c8d' }}>
                      +{portfolio.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: 10 }}>
                作品数量: {portfolio.works?.length || 0}
              </div>

              <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                创建时间: {new Date(portfolio.createdAt).toLocaleDateString()}
              </div>

              <div style={{ marginTop: 10, fontSize: '12px', color: '#3498db' }}>
                点击查看详情 →
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 创建作品集弹窗 */}
      {showCreate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 15,
            padding: 30,
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: 20, color: '#2c3e50' }}>创建作品集</h3>
            
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>作品集标题 *</label>
              <input
                type="text"
                value={newPortfolio.title}
                onChange={(e) => setNewPortfolio(prev => ({ ...prev, title: e.target.value }))}
                placeholder="请输入作品集标题"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 6,
                  border: '1px solid #ddd'
                }}
              />
            </div>

            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>分类</label>
              <select
                value={newPortfolio.category}
                onChange={(e) => setNewPortfolio(prev => ({ ...prev, category: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 6,
                  border: '1px solid #ddd'
                }}
              >
                <option value="音乐">音乐</option>
                <option value="绘画">绘画</option>
                <option value="舞蹈">舞蹈</option>
                <option value="写作">写作</option>
                <option value="摄影">摄影</option>
                <option value="雕塑">雕塑</option>
                <option value="书法">书法</option>
                <option value="设计">设计</option>
                <option value="戏剧">戏剧</option>
                <option value="影视">影视</option>
              </select>
            </div>

            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>描述</label>
              <textarea
                value={newPortfolio.description}
                onChange={(e) => setNewPortfolio(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请描述这个作品集..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>标签</label>
              <input
                type="text"
                placeholder="用逗号分隔多个标签，如：设计,创意,艺术"
                onChange={(e) => {
                  const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                  setNewPortfolio(prev => ({ ...prev, tags }));
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 6,
                  border: '1px solid #ddd'
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={newPortfolio.isPublic}
                  onChange={(e) => setNewPortfolio(prev => ({ ...prev, isPublic: e.target.checked }))}
                />
                <span>公开作品集（其他人可以查看）</span>
              </label>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={newPortfolio.featured}
                  onChange={(e) => setNewPortfolio(prev => ({ ...prev, featured: e.target.checked }))}
                />
                <span>设为精选作品集</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  padding: '10px 20px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={handleCreatePortfolio}
                style={{
                  padding: '10px 20px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
