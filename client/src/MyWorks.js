import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';
import FilePreview from './FilePreview';
import api from './api';

export default function MyWorks({ userInfo, onBack }) {
  const [works, setWorks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('art');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (userInfo && userInfo.name) {
      loadAllData();
    } else {
      setLoading(false);
    }
  }, [userInfo?.name]);

  useEffect(() => {
    if (userInfo && userInfo.name) {
      loadTabData();
    }
  }, [activeTab, userInfo?.name]);

  const loadAllData = async () => {
    if (!userInfo || !userInfo.name) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [worksData, activitiesData, feedbacksData] = await Promise.all([
        api.art.getMyWorks(userInfo.name),
        api.activity.getAll(),
        api.feedback.getMy(userInfo.name)
      ]);
      
      setWorks(Array.isArray(worksData) ? worksData : []);
      setActivities(Array.isArray(activitiesData) ? activitiesData.filter(activity => activity.authorName === userInfo.name) : []);
      setFeedbacks(Array.isArray(feedbacksData) ? feedbacksData : []);
    } catch (error) {
      console.error('加载数据失败:', error);
      setWorks([]);
      setActivities([]);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async () => {
    if (!userInfo || !userInfo.name) {
      return;
    }

    try {
      setLoading(true);
      if (activeTab === 'art') {
        const data = await api.art.getMyWorks(userInfo.name);
        setWorks(Array.isArray(data) ? data : []);
      } else if (activeTab === 'activity') {
        const data = await api.activity.getAll();
        setActivities(Array.isArray(data) ? data.filter(activity => activity.authorName === userInfo.name) : []);
      } else if (activeTab === 'feedback') {
        const data = await api.feedback.getMy(userInfo.name);
        setFeedbacks(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, type) => {
    if (!userInfo || !userInfo.name) {
      setMessage('请先完善个人信息');
      return;
    }

    if (!window.confirm('确定要删除这个内容吗？此操作不可恢复。')) {
      return;
    }

    try {
      if (type === 'art') {
        await api.art.delete(id, userInfo.name, userInfo.isAdmin || false);
        setWorks(prev => prev.filter(item => item._id !== id));
      } else if (type === 'activity') {
        // 这里需要添加删除活动的API
        setActivities(prev => prev.filter(item => item._id !== id));
      }
      setMessage('内容已删除');
    } catch (error) {
      console.error('删除失败:', error);
      setMessage('删除失败，请重试');
    }
  };

  const handleFeedbackReply = async (feedbackId, content) => {
    if (!content.trim()) return;

    try {
      await api.feedback.reply(feedbackId, {
        content: content,
        authorName: userInfo.name,
        authorClass: userInfo.class,
        authorAvatar: ''
      });
      
      setMessage('回复成功！');
      loadTabData();
    } catch (error) {
      console.error('回复失败:', error);
      setMessage('回复失败，请重试');
    }
  };

  const handleItemClick = (item, type) => {
    setSelectedItem({ ...item, type });
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedItem(null);
  };

  // 详情查看组件
  const DetailView = ({ item, onClose }) => {
    if (!item) return null;

    return (
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
          maxWidth: '90%',
          maxHeight: '90%',
          overflow: 'auto',
          position: 'relative',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 15,
              right: 15,
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#7f8c8d',
              zIndex: 1001
            }}
          >
            ×
          </button>

          {/* 内容区域 */}
          <div style={{ marginRight: '30px' }}>
            {/* 作者信息 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 20 }}>
              <Avatar 
                name={item.authorName} 
                size={50}
              />
              <div>
                <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '16px' }}>
                  {item.authorName}
                </div>
                <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                  {item.authorClass} • {new Date(item.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* 标题和内容 */}
            <h2 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '24px' }}>
              {item.title}
            </h2>
            
            <div style={{ 
              margin: '0 0 20px 0', 
              color: '#34495e', 
              lineHeight: 1.8, 
              fontSize: '16px',
              whiteSpace: 'pre-wrap'
            }}>
              {item.content || item.description}
            </div>

            {/* 媒体文件 */}
            {item.media && item.media.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <FilePreview 
                  urls={item.media} 
                  apiBaseUrl={process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000'} 
                />
              </div>
            )}

            {/* 统计信息 */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 20, 
              marginBottom: 20,
              padding: '15px',
              background: '#f8f9fa',
              borderRadius: 8
            }}>
              <span style={{ fontSize: '16px', color: '#7f8c8d' }}>
                {item.likes || 0} 喜欢
              </span>
              <span style={{ fontSize: '16px', color: '#7f8c8d' }}>
                {item.favorites?.length || 0} 收藏
              </span>
              <span style={{ fontSize: '16px', color: '#7f8c8d' }}>
                {item.comments?.length || 0} 评论
              </span>
            </div>

            {/* 评论区域 */}
            {item.comments && item.comments.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '18px' }}>
                  评论 ({item.comments.length})
                </h3>
                <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                  {item.comments.map((comment, index) => (
                    <div key={index} style={{
                      border: '1px solid #ecf0f1',
                      borderRadius: 8,
                      padding: 15,
                      marginBottom: 10,
                      background: '#f8f9fa'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <Avatar 
                          name={comment.authorName || '用户'} 
                          size={30}
                        />
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '14px' }}>
                            {comment.authorName || '用户'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                            {comment.authorClass || ''} • {new Date(comment.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div style={{ color: '#34495e', lineHeight: 1.6, fontSize: '14px' }}>
                        {comment.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              marginRight: '15px',
              color: '#7f8c8d'
            }}
          >
            ←
          </button>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>我的作品</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
          加载中...
        </div>
      </div>
    );
  }

  if (!userInfo || !userInfo.name) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              marginRight: '15px',
              color: '#7f8c8d'
            }}
          >
            ←
          </button>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>我的作品</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
          请先完善个人信息
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            marginRight: '15px',
            color: '#7f8c8d'
          }}
        >
          ←
        </button>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>我的作品</h2>
      </div>

      {/* 消息显示 */}
      {message && (
        <div style={{ 
          marginBottom: 20, 
          padding: '15px', 
          background: message.includes('成功') || message.includes('已') ? '#d4edda' : '#f8d7da',
          color: message.includes('成功') || message.includes('已') ? '#155724' : '#721c24',
          borderRadius: 8,
          border: `1px solid ${message.includes('成功') || message.includes('已') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}

      {/* 分区标签 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 30, borderBottom: '1px solid #ecf0f1' }}>
        <button
          onClick={() => setActiveTab('art')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'art' ? '2px solid #3498db' : '2px solid transparent',
            color: activeTab === 'art' ? '#3498db' : '#7f8c8d',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          艺术作品 ({works.length})
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'activity' ? '2px solid #3498db' : '2px solid transparent',
            color: activeTab === 'activity' ? '#3498db' : '#7f8c8d',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          活动设计 ({activities.length})
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'feedback' ? '2px solid #3498db' : '2px solid transparent',
            color: activeTab === 'feedback' ? '#3498db' : '#7f8c8d',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          意见反馈 ({feedbacks.length})
        </button>
      </div>

      {/* 艺术作品 */}
      {activeTab === 'art' && (
        <div>
          {works.map(item => (
            <div 
              key={item._id} 
              onClick={() => handleItemClick(item, 'art')}
              style={{ 
                border: '1px solid #ecf0f1', 
                borderRadius: 12, 
                padding: 20, 
                marginBottom: 20,
                background: '#f8f9fa',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                  <Avatar 
                    name={item.authorName} 
                    size={40}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                      {item.authorName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                      {item.authorClass} • {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item._id, 'art');
                  }}
                  style={{
                    padding: '6px 12px',
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  删除
                </button>
              </div>
              
              <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{item.title}</h3>
              <p style={{ margin: '0 0 15px 0', color: '#34495e', lineHeight: 1.6 }}>
                {item.content.length > 100 ? `${item.content.substring(0, 100)}...` : item.content}
              </p>
              
              {item.media && item.media.length > 0 && (
                <div style={{ marginBottom: 15 }}>
                  <FilePreview 
                    urls={item.media} 
                    apiBaseUrl={process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000'} 
                  />
                </div>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <span style={{ fontSize: '14px', color: '#7f8c8d' }}>
                  {item.likes || 0} 喜欢
                </span>
                <span style={{ fontSize: '14px', color: '#7f8c8d' }}>
                  {item.favorites?.length || 0} 收藏
                </span>
                <span style={{ fontSize: '14px', color: '#7f8c8d' }}>
                  {item.comments?.length || 0} 评论
                </span>
                <span style={{ fontSize: '12px', color: '#3498db', marginLeft: 'auto' }}>
                  点击查看详情 →
                </span>
              </div>
            </div>
          ))}
          
          {works.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}></div>
              <div style={{ fontSize: '18px', marginBottom: '10px' }}>暂无作品</div>
              <div style={{ fontSize: '14px' }}>去艺术作品页面发布您的第一个作品吧！</div>
            </div>
          )}
        </div>
      )}

      {/* 活动设计 */}
      {activeTab === 'activity' && (
        <div>
          {activities.map(item => (
            <div 
              key={item._id} 
              onClick={() => handleItemClick(item, 'activity')}
              style={{ 
                border: '1px solid #ecf0f1', 
                borderRadius: 12, 
                padding: 20, 
                marginBottom: 20,
                background: '#f8f9fa',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                  <Avatar 
                    name={item.authorName} 
                    size={40}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                      {item.authorName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                      {item.authorClass} • {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item._id, 'activity');
                  }}
                  style={{
                    padding: '6px 12px',
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  删除
                </button>
              </div>
              
              <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{item.title}</h3>
              <p style={{ margin: '0 0 15px 0', color: '#34495e', lineHeight: 1.6 }}>
                {(item.description || item.content || '').length > 100 
                  ? `${(item.description || item.content || '').substring(0, 100)}...` 
                  : (item.description || item.content || '')}
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <span style={{ fontSize: '14px', color: '#7f8c8d' }}>
                  {item.likes || 0} 喜欢
                </span>
                <span style={{ fontSize: '14px', color: '#7f8c8d' }}>
                  {item.favorites?.length || 0} 收藏
                </span>
                <span style={{ fontSize: '14px', color: '#7f8c8d' }}>
                  {item.comments?.length || 0} 评论
                </span>
                <span style={{ fontSize: '12px', color: '#3498db', marginLeft: 'auto' }}>
                  点击查看详情 →
                </span>
              </div>
            </div>
          ))}
          
          {activities.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}></div>
              <div style={{ fontSize: '18px', marginBottom: '10px' }}>暂无活动设计</div>
              <div style={{ fontSize: '14px' }}>去活动展示页面发布您的第一个活动吧！</div>
            </div>
          )}
        </div>
      )}

      {/* 意见反馈 */}
      {activeTab === 'feedback' && (
        <div>
          {feedbacks.map(item => (
            <div key={item._id} style={{ 
              border: '1px solid #ecf0f1', 
              borderRadius: 12, 
              padding: 20, 
              marginBottom: 20,
              background: '#f8f9fa'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '16px' }}>
                    {item.category || '其他'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontSize: '12px',
                  fontWeight: 'bold',
                  background: item.status === 'received' ? '#d4edda' : 
                             item.status === 'processing' ? '#fff3cd' : '#f8d7da',
                  color: item.status === 'received' ? '#155724' : 
                         item.status === 'processing' ? '#856404' : '#721c24'
                }}>
                  {item.status === 'received' ? '已收到' : 
                   item.status === 'processing' ? '处理中' : '待处理'}
                </span>
              </div>
              
              <div style={{ fontSize: '14px', color: '#34495e', lineHeight: 1.6, marginBottom: 15 }}>
                {item.content}
              </div>

              {/* 对话记录 */}
              {item.conversations && item.conversations.length > 0 && (
                <div style={{ marginBottom: 15 }}>
                  <h4 style={{ marginBottom: 10, color: '#2c3e50', fontSize: '14px' }}>对话记录</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {item.conversations.map(conv => (
                      <div key={conv.id} style={{
                        padding: 10,
                        borderRadius: 6,
                        background: conv.isAdmin ? '#e3f2fd' : '#f5f5f5',
                        borderLeft: `3px solid ${conv.isAdmin ? '#2196f3' : '#4caf50'}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                          <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '12px' }}>
                            {conv.authorName} {conv.isAdmin && '(管理员)'}
                          </div>
                          <div style={{ fontSize: '10px', color: '#7f8c8d' }}>
                            {new Date(conv.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div style={{ fontSize: '13px', color: '#34495e' }}>
                          {conv.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 回复框 */}
              <div style={{ 
                border: '1px solid #dee2e6', 
                borderRadius: 6,
                padding: 15,
                background: '#fff'
              }}>
                <textarea
                  placeholder="回复管理员..."
                  style={{
                    width: '100%',
                    height: '60px',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    fontSize: '13px',
                    resize: 'vertical',
                    marginBottom: 10
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleFeedbackReply(item._id, e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
                <div style={{ fontSize: '11px', color: '#6c757d' }}>
                  按 Ctrl+Enter 发送回复
                </div>
              </div>
            </div>
          ))}
          
          {feedbacks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}></div>
              <div style={{ fontSize: '18px', marginBottom: '10px' }}>暂无反馈</div>
              <div style={{ fontSize: '14px' }}>去反馈页面提交您的建议吧！</div>
            </div>
          )}
        </div>
      )}

      {/* 详情查看弹窗 */}
      {showDetail && selectedItem && (
        <DetailView item={selectedItem} onClose={handleCloseDetail} />
      )}
    </div>
  );
}