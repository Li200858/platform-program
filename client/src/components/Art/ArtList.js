// 艺术作品列表组件
import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Avatar from '../../Avatar';
import FilePreview from '../../FilePreview';
import { buildApiUrl } from '../../utils/apiUrl';
import { interactionStorage } from '../../utils/storage';

const ArtList = ({ 
  items = [], 
  userInfo, 
  onLike, 
  onFavorite, 
  onComment, 
  onDelete,
  showComments = {},
  onToggleComments,
  commentForm = {},
  onCommentChange,
  onCommentSubmit
}) => {
  const renderMedia = (urls) => {
    if (!urls || urls.length === 0) return null;
    
    const validUrls = urls.filter(url => url && url.trim() !== '');
    if (validUrls.length === 0) return null;
    
    return <FilePreview urls={validUrls} apiBaseUrl={buildApiUrl('')} />;
  };

  const renderItem = (item) => {
    const isLiked = interactionStorage.isLiked(item._id, 'art');
    const isFavorited = interactionStorage.isFavorited(item._id, 'art');
    const canDelete = userInfo && (item.authorName === userInfo.name || item.author === userInfo.name || userInfo.isAdmin);

    return (
      <Card key={item._id} hover style={{ marginBottom: '20px' }}>
        {/* 作者信息 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <Avatar 
            name={item.authorName || item.author || '用户'} 
            size={45}
            style={{ 
              marginRight: '15px',
              border: '3px solid #fff',
              boxShadow: '0 3px 10px rgba(0,0,0,0.1)'
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '4px', color: '#2c3e50' }}>
              {item.authorName || item.author}
            </div>
            <div style={{ fontSize: '14px', color: '#7f8c8d', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>班级: {item.authorClass}</span>
              <span>日期: {new Date(item.createdAt).toLocaleString()}</span>
              <span>浏览 {item.views || 0} 次</span>
            </div>
          </div>
        </div>

        {/* 作品内容 */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', color: '#2c3e50', flex: 1 }}>
              {item.title}
            </h3>
            {canDelete && (
              <Button
                variant="danger"
                size="small"
                onClick={() => onDelete(item._id)}
                style={{ marginLeft: '10px' }}
              >
                删除作品
              </Button>
            )}
          </div>
          <p style={{ margin: 0, lineHeight: 1.6, color: '#34495e', fontSize: '15px' }}>
            {item.content}
          </p>
        </div>

        {/* 媒体文件 */}
        {renderMedia(item.media)}

        {/* 互动按钮 */}
        <div style={{ 
          marginTop: '20px', 
          padding: '15px 0',
          borderTop: '1px solid #ecf0f1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Button
              variant={isLiked ? 'danger' : 'secondary'}
              size="small"
              onClick={() => onLike(item._id)}
            >
              {isLiked ? '已喜欢' : '喜欢'} {item.likes || 0}
            </Button>

            <Button
              variant={isFavorited ? 'warning' : 'secondary'}
              size="small"
              onClick={() => onFavorite(item._id)}
            >
              {isFavorited ? '已收藏' : '收藏'} {item.favorites?.length || 0}
            </Button>

            <Button
              variant="primary"
              size="small"
              onClick={() => onToggleComments(item._id)}
            >
              评论 ({item.comments?.length || 0})
            </Button>
          </div>
        </div>

        {/* 评论区域 */}
        {showComments[item._id] && (
          <div style={{ 
            marginTop: '15px', 
            padding: '15px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>评论</h4>
            
            {/* 评论表单 */}
            {userInfo && userInfo.name && (
              <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <Avatar 
                    src={userInfo?.avatar} 
                    name={userInfo?.name || '用户'} 
                    size={32}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#2c3e50' }}>
                      {userInfo?.name || '未登录用户'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      {userInfo?.class || '请先完善个人信息'}
                    </div>
                  </div>
                </div>
                <textarea
                  placeholder="写下您的评论..."
                  value={commentForm.content || ''}
                  onChange={(e) => onCommentChange('content', e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    borderRadius: '6px', 
                    border: '1px solid #ddd', 
                    resize: 'vertical',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                  rows={3}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => onCommentSubmit(item._id)}
                  >
                    发表评论
                  </Button>
                </div>
              </div>
            )}

            {/* 评论列表 */}
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {item.comments?.length > 0 ? (
                item.comments.map(comment => (
                  <div key={comment.id} style={{ 
                    marginBottom: '10px', 
                    padding: '12px', 
                    backgroundColor: '#fff', 
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '13px', color: '#2c3e50' }}>{comment.author}</strong>
                        <span style={{ fontSize: '11px', color: '#7f8c8d', background: '#f8f9fa', padding: '2px 6px', borderRadius: '10px' }}>
                          {comment.authorClass}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#7f8c8d' }}>
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#34495e', lineHeight: '1.4' }}>
                      {comment.content}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '13px', padding: '20px' }}>
                  暂无评论，快来抢沙发吧！
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    );
  };

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎨</div>
        <div>暂无艺术作品</div>
        <div style={{ fontSize: '14px', marginTop: '10px' }}>
          点击"发布作品"按钮开始创作吧！
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {items.map(renderItem)}
    </div>
  );
};

export default ArtList;
