import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';
import FilePreview from './FilePreview';
import api from './api';

export default function Search({ userInfo, onBack }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all'); // all, art, activity, user
  const [searchResults, setSearchResults] = useState({ arts: [], activities: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const searchTypes = [
    { key: 'all', label: '全部' },
    { key: 'art', label: '艺术作品' },
    { key: 'activity', label: '活动设计' },
    { key: 'user', label: '用户' }
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setMessage('请输入搜索关键词');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      const results = await api.search.global(searchQuery, searchType);
      setSearchResults(results);
      
      const totalResults = results.arts.length + results.activities.length + results.users.length;
      if (totalResults === 0) {
        setMessage('未找到匹配的结果');
      } else {
        setMessage(`找到 ${totalResults} 个匹配的结果`);
      }
    } catch (error) {
      console.error('搜索失败:', error);
      setSearchResults({ arts: [], activities: [], users: [] });
      setMessage('搜索失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFollow = async (username) => {
    if (!userInfo || !userInfo.name) {
      setMessage('请先完善个人信息');
      return;
    }

    try {
      await api.follow.follow({
        follower: userInfo.name,
        following: username
      });
      setMessage(`已关注 ${username}`);
      handleSearch(); // 刷新搜索结果
    } catch (error) {
      console.error('关注失败:', error);
      setMessage('关注失败，请重试');
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      {/* 头部 */}
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
        <h2 style={{ margin: 0, color: '#2c3e50', flex: 1 }}>搜索</h2>
      </div>

      {/* 消息显示 */}
      {message && (
        <div style={{ 
          marginBottom: 20, 
          padding: '15px', 
          background: message.includes('找到') || message.includes('已关注') ? '#d4edda' : '#f8d7da',
          color: message.includes('找到') || message.includes('已关注') ? '#155724' : '#721c24',
          borderRadius: 8,
          border: `1px solid ${message.includes('找到') || message.includes('已关注') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}

      {/* 搜索栏 */}
      <div style={{ marginBottom: 30 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="搜索作品、活动或用户..."
            style={{
              flex: 1,
              padding: '12px',
              border: '2px solid #ecf0f1',
              borderRadius: 8,
              fontSize: '16px'
            }}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: loading ? '#95a5a6' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {loading ? '搜索中...' : '搜索'}
          </button>
        </div>

        {/* 搜索类型选择 */}
        <div style={{ display: 'flex', gap: 10 }}>
          {searchTypes.map(type => (
            <button
              key={type.key}
              onClick={() => setSearchType(type.key)}
              style={{
                padding: '8px 16px',
                background: searchType === type.key ? '#3498db' : '#ecf0f1',
                color: searchType === type.key ? 'white' : '#7f8c8d',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* 搜索结果 */}
      {searchQuery && (
        <div>
          {/* 艺术作品结果 */}
          {(searchType === 'all' || searchType === 'art') && searchResults.arts.length > 0 && (
            <div style={{ marginBottom: 30 }}>
              <h3 style={{ marginBottom: 20, color: '#2c3e50' }}>艺术作品 ({searchResults.arts.length})</h3>
              {searchResults.arts.map(item => (
                <div key={item._id} style={{ 
                  border: '1px solid #ecf0f1', 
                  borderRadius: 12, 
                  padding: 20, 
                  marginBottom: 20,
                  background: '#f8f9fa'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 15 }}>
                    <Avatar name={item.authorName} size={40} />
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                        {item.authorName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                        {item.authorClass} • {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{item.title}</h4>
                  <p style={{ margin: '0 0 15px 0', color: '#34495e', lineHeight: 1.6 }}>
                    {item.content.length > 200 ? `${item.content.substring(0, 200)}...` : item.content}
                  </p>
                  
                  {item.media && item.media.length > 0 && (
                    <div style={{ marginBottom: 15 }}>
                      <FilePreview 
                        urls={item.media} 
                        apiBaseUrl={process.env.NODE_ENV === 'production' ? 'https://platform-program.onrender.com' : 'http://localhost:5000'} 
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
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 活动结果 */}
          {(searchType === 'all' || searchType === 'activity') && searchResults.activities.length > 0 && (
            <div style={{ marginBottom: 30 }}>
              <h3 style={{ marginBottom: 20, color: '#2c3e50' }}>活动设计 ({searchResults.activities.length})</h3>
              {searchResults.activities.map(item => (
                <div key={item._id} style={{ 
                  border: '1px solid #ecf0f1', 
                  borderRadius: 12, 
                  padding: 20, 
                  marginBottom: 20,
                  background: '#f8f9fa'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 15 }}>
                    <Avatar name={item.authorName} size={40} />
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                        {item.authorName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                        {item.authorClass} • {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{item.title}</h4>
                  <p style={{ margin: '0 0 15px 0', color: '#34495e', lineHeight: 1.6 }}>
                    {item.description.length > 200 ? `${item.description.substring(0, 200)}...` : item.description}
                  </p>
                  
                  {item.media && item.media.length > 0 && (
                    <div style={{ marginBottom: 15 }}>
                      <FilePreview 
                        urls={item.media} 
                        apiBaseUrl={process.env.NODE_ENV === 'production' ? 'https://platform-program.onrender.com' : 'http://localhost:5000'} 
                      />
                    </div>
                  )}
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '15px',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '14px', color: '#2c3e50' }}>
                      <strong>活动时间：</strong>
                      {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                    </div>
                  </div>

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
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 用户结果 */}
          {(searchType === 'all' || searchType === 'user') && searchResults.users.length > 0 && (
            <div style={{ marginBottom: 30 }}>
              <h3 style={{ marginBottom: 20, color: '#2c3e50' }}>用户 ({searchResults.users.length})</h3>
              {searchResults.users.map(user => (
                <div key={user._id} style={{ 
                  border: '1px solid #ecf0f1', 
                  borderRadius: 12, 
                  padding: 20, 
                  marginBottom: 15,
                  background: '#f8f9fa',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <Avatar name={user.name} size={50} />
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '16px' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                        班级: {user.class}
                      </div>
                      {user.bio && (
                        <div style={{ fontSize: '13px', color: '#34495e', marginTop: 5 }}>
                          {user.bio}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {userInfo && userInfo.name !== user.name && (
                    <button
                      onClick={() => handleFollow(user.name)}
                      style={{
                        padding: '8px 16px',
                        background: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      关注
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
