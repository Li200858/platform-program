import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';
import FilePreview from './FilePreview';
import api from './api';

export default function Portfolio({ userInfo, onBack }) {
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [newPortfolio, setNewPortfolio] = useState({
    title: '',
    description: '',
    category: 'art',
    tags: [],
    isPublic: true,
    featured: false
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
    if (!window.confirm('确定要删除这个作品集吗？')) {
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
      const data = await api.portfolio.getPortfolio(portfolioId);
      setSelectedPortfolio(data);
    } catch (error) {
      console.error('加载作品集详情失败:', error);
      setMessage('加载作品集详情失败');
    }
  };

  const handleExportPortfolio = (portfolio) => {
    // 创建一个简单的HTML文档用于导出
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${portfolio.title} - 作品集</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 40px; }
          .title { font-size: 28px; color: #2c3e50; margin-bottom: 10px; }
          .meta { color: #7f8c8d; font-size: 14px; }
          .description { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
          .works { margin-top: 30px; }
          .work-item { margin-bottom: 30px; padding: 20px; border: 1px solid #ecf0f1; border-radius: 8px; }
          .work-title { font-size: 18px; color: #2c3e50; margin-bottom: 10px; }
          .work-content { color: #34495e; margin-bottom: 15px; }
          .work-meta { font-size: 12px; color: #7f8c8d; }
          .tags { margin: 15px 0; }
          .tag { display: inline-block; background: #ecf0f1; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-right: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${portfolio.title}</div>
          <div class="meta">
            分类: ${portfolio.category === 'art' ? '艺术作品' : '活动设计'} | 
            创建时间: ${new Date(portfolio.createdAt).toLocaleString()} | 
            作品数量: ${portfolio.works.length}
          </div>
        </div>
        
        ${portfolio.description ? `<div class="description">${portfolio.description}</div>` : ''}
        
        ${portfolio.tags && portfolio.tags.length > 0 ? `
          <div class="tags">
            <strong>标签:</strong>
            ${portfolio.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
          </div>
        ` : ''}
        
        <div class="works">
          <h2>作品列表</h2>
          ${portfolio.works.map(work => `
            <div class="work-item">
              <div class="work-title">${work.title}</div>
              <div class="work-content">${work.content || '暂无内容描述'}</div>
              <div class="work-meta">
                作者: ${work.authorName} | 
                班级: ${work.authorClass} | 
                创建时间: ${new Date(work.createdAt).toLocaleString()}
              </div>
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `;

    // 创建Blob对象并下载
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${portfolio.title}_作品集.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setMessage('作品集导出成功！');
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
              onClick={() => handleExportPortfolio(selectedPortfolio)}
              style={{
                padding: '10px 20px',
                background: '#f39c12',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            >
              导出HTML
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
                {selectedPortfolio.category === 'art' ? '艺术作品' : '活动设计'}
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
          <strong>作品列表 ({selectedPortfolio.works.length})</strong>
        </div>

        {selectedPortfolio.works.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📁</div>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>暂无作品</div>
            <div style={{ fontSize: '14px' }}>请先添加作品到此作品集</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {selectedPortfolio.works.map(work => (
              <div key={work._id} style={{
                border: '1px solid #ecf0f1',
                borderRadius: 12,
                padding: 20,
                background: '#f8f9fa'
              }}>
                <div style={{ marginBottom: 15 }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>
                    {work.title}
                  </h4>
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
        )}

        <div style={{ marginTop: 30, padding: '20px', background: '#f8f9fa', borderRadius: 8 }}>
          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
            创建时间: {new Date(selectedPortfolio.createdAt).toLocaleString()} • 
            最后更新: {new Date(selectedPortfolio.updatedAt).toLocaleString()} • 
            作品数量: {selectedPortfolio.works.length}
          </div>
        </div>
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
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📚</div>
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
                <div style={{ display: 'flex', gap: 5 }}>
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
                  {portfolio.category === 'art' ? '艺术作品' : '活动设计'}
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
                <option value="art">艺术作品</option>
                <option value="activity">活动设计</option>
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
