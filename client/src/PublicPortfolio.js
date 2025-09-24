import React, { useState, useEffect } from 'react';
import api from './api';

export default function PublicPortfolio({ userInfo, onBack }) {
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedContent, setSelectedContent] = useState(null);

  useEffect(() => {
    loadPublicPortfolios();
  }, []);

  const loadPublicPortfolios = async () => {
    try {
      setLoading(true);
      const data = await api.portfolio.getPublicPortfolios();
      setPortfolios(data);
    } catch (error) {
      console.error('加载公开作品集失败:', error);
      setMessage('加载公开作品集失败');
    } finally {
      setLoading(false);
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

  const handleViewContent = (content) => {
    setSelectedContent(content);
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

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 20, marginBottom: 15 }}>
            <div>
              <strong>分类：</strong>
              <span style={{ 
                background: '#e8f4fd',
                color: '#2980b9',
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 12
              }}>
                {selectedPortfolio.category}
              </span>
            </div>
            <div>
              <strong>创建者：</strong>{selectedPortfolio.creator}
            </div>
            <div>
              <strong>创建时间：</strong>{new Date(selectedPortfolio.createdAt).toLocaleString()}
            </div>
          </div>
          
          {selectedPortfolio.description && (
            <div style={{ 
              background: '#f8f9fa', 
              padding: 15, 
              borderRadius: 8, 
              marginBottom: 20,
              border: '1px solid #ecf0f1'
            }}>
              <strong>作品集描述：</strong>
              <div style={{ marginTop: 8, lineHeight: 1.6 }}>{selectedPortfolio.description}</div>
            </div>
          )}

          {selectedPortfolio.tags && selectedPortfolio.tags.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <strong>标签：</strong>
              <div style={{ marginTop: 8 }}>
                {selectedPortfolio.tags.map((tag, index) => (
                  <span key={index} style={{
                    background: '#ecf0f1',
                    color: '#2c3e50',
                    padding: '4px 8px',
                    borderRadius: 12,
                    fontSize: 12,
                    marginRight: 8,
                    display: 'inline-block'
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {selectedPortfolio.contents.map((content, index) => (
                <div key={`content-${index}`} style={{
                  border: '1px solid #ecf0f1',
                  borderRadius: 12,
                  padding: 20,
                  background: '#f8f9fa',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => handleViewContent(content)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
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
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>附件:</div>
                        {content.media.map((file, fileIndex) => (
                          <div key={fileIndex} style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>
                            {file.originalName}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#7f8c8d' }}>
                    <span>{new Date(content.createdAt).toLocaleDateString()}</span>
                    <span>{content.authorName}</span>
                  </div>
                  <div style={{ marginTop: 10, fontSize: '12px', color: '#3498db', fontWeight: 'bold' }}>
                    点击查看详情 →
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
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>附件:</div>
                      {work.media.map((file, fileIndex) => (
                        <div key={fileIndex} style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>
                          {file.originalName}
                        </div>
                      ))}
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
            <div style={{ fontSize: '14px' }}>此作品集还没有任何作品</div>
          </div>
        )}

        {/* 内容详情查看模态框 */}
        {selectedContent && (
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
              maxWidth: 800,
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, color: '#2c3e50' }}>{selectedContent.title}</h3>
                <button
                  onClick={() => setSelectedContent(null)}
                  style={{
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ✕ 关闭
                </button>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 20, marginBottom: 15, fontSize: '14px', color: '#7f8c8d' }}>
                  <span>作者: {selectedContent.authorName}</span>
                  <span>发布时间: {new Date(selectedContent.createdAt).toLocaleString()}</span>
                </div>
                
                {selectedContent.content && (
                  <div style={{ 
                    background: '#f8f9fa', 
                    padding: 15, 
                    borderRadius: 8, 
                    marginBottom: 20,
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6
                  }}>
                    {selectedContent.content}
                  </div>
                )}

                {selectedContent.media && selectedContent.media.length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>附件预览</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 15 }}>
                      {selectedContent.media.map((file, index) => (
                        <div key={index} style={{
                          border: '1px solid #ecf0f1',
                          borderRadius: 8,
                          padding: 15,
                          background: '#f8f9fa',
                          textAlign: 'center'
                        }}>
                          {file.type?.startsWith('image/') ? (
                            <div>
                              <img 
                                src={file.url} 
                                alt={file.originalName}
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: 150, 
                                  borderRadius: 4,
                                  cursor: 'pointer'
                                }}
                                onClick={() => window.open(file.url, '_blank')}
                              />
                              <div style={{ marginTop: 8, fontSize: '12px', color: '#7f8c8d' }}>
                                {file.originalName}
                              </div>
                            </div>
                          ) : file.type?.startsWith('video/') ? (
                            <div>
                              <video 
                                controls 
                                style={{ maxWidth: '100%', maxHeight: 150 }}
                                onClick={() => window.open(file.url, '_blank')}
                              >
                                <source src={file.url} type={file.type} />
                                您的浏览器不支持视频播放
                              </video>
                              <div style={{ marginTop: 8, fontSize: '12px', color: '#7f8c8d' }}>
                                {file.originalName}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ 
                                fontSize: '24px', 
                                color: '#3498db', 
                                marginBottom: 8 
                              }}>
                                📄
                              </div>
                              <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: 8 }}>
                                {file.originalName}
                              </div>
                              <button
                                onClick={() => window.open(file.url, '_blank')}
                                style={{
                                  background: '#3498db',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 4,
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  cursor: 'pointer'
                                }}
                              >
                                预览文件
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div style={{ 
                      marginTop: 15, 
                      padding: 10, 
                      background: '#fff3cd', 
                      borderRadius: 4, 
                      fontSize: '12px', 
                      color: '#856404' 
                    }}>
                      ⚠️ 版权保护：附件仅供预览，不支持下载
                    </div>
                  </div>
                )}
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
        <h2 style={{ margin: 0, color: '#2c3e50' }}>公开作品集</h2>
        <button
          onClick={onBack}
          style={{
            padding: '10px 20px',
            background: '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer'
          }}
        >
          返回
        </button>
      </div>

      {/* 消息显示 */}
      {message && (
        <div style={{
          background: message.includes('成功') ? '#d4edda' : '#f8d7da',
          color: message.includes('成功') ? '#155724' : '#721c24',
          padding: '12px 16px',
          borderRadius: 8,
          marginBottom: 20,
          border: `1px solid ${message.includes('成功') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}

      {/* 作品集列表 */}
      {portfolios.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#7f8c8d' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>[作品集]</div>
          <div style={{ fontSize: '20px', marginBottom: '10px' }}>还没有公开作品集</div>
          <div style={{ fontSize: '14px', marginBottom: '30px' }}>其他用户还没有分享他们的作品集</div>
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
              transition: 'all 0.3s ease'
            }}
            onClick={() => handleViewPortfolio(portfolio._id)}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
            >
              <div style={{ marginBottom: 15 }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: 18 }}>
                  {portfolio.title}
                </h3>
                <p style={{ margin: '0 0 15px 0', color: '#7f8c8d', fontSize: 14, lineHeight: 1.5 }}>
                  {portfolio.description || '暂无描述'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 15, flexWrap: 'wrap' }}>
                <span style={{
                  background: '#e8f4fd',
                  color: '#2980b9',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: 12
                }}>
                  {portfolio.category}
                </span>
                {portfolio.featured && (
                  <span style={{
                    background: '#fff3cd',
                    color: '#856404',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 12
                  }}>
                    精选
                  </span>
                )}
              </div>

              {portfolio.tags && portfolio.tags.length > 0 && (
                <div style={{ marginBottom: 15 }}>
                  {portfolio.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} style={{
                      background: '#ecf0f1',
                      color: '#2c3e50',
                      padding: '2px 6px',
                      borderRadius: 8,
                      fontSize: 11,
                      marginRight: 6,
                      display: 'inline-block'
                    }}>
                      #{tag}
                    </span>
                  ))}
                  {portfolio.tags.length > 3 && (
                    <span style={{ fontSize: 11, color: '#7f8c8d' }}>
                      +{portfolio.tags.length - 3} 更多
                    </span>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#7f8c8d' }}>
                <span>创建者: {portfolio.creator}</span>
                <span>{new Date(portfolio.createdAt).toLocaleDateString()}</span>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, color: '#95a5a6' }}>
                作品数量: {portfolio.works.length + (portfolio.contents ? portfolio.contents.length : 0)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
