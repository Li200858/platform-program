import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';
import api from './api';

export default function Follow({ userInfo, onBack }) {
  const [activeTab, setActiveTab] = useState('following'); // following, followers
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (userInfo && userInfo.name) {
      loadFollowData();
    }
  }, [userInfo, activeTab]);

  const loadFollowData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'following') {
        const data = await api.follow.getFollowing(userInfo.name);
        setFollowing(Array.isArray(data) ? data : []);
      } else {
        const data = await api.follow.getFollowers(userInfo.name);
        setFollowers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('加载关注数据失败:', error);
      if (activeTab === 'following') {
        setFollowing([]);
      } else {
        setFollowers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (username) => {
    if (!window.confirm(`确定要取消关注 ${username} 吗？`)) {
      return;
    }

    try {
      await api.follow.unfollow(userInfo.name, username);
      setMessage(`已取消关注 ${username}`);
      loadFollowData(); // 重新加载数据
    } catch (error) {
      console.error('取消关注失败:', error);
      setMessage('取消关注失败，请重试');
    }
  };

  const handleFollow = async (username) => {
    try {
      await api.follow.follow({
        follower: userInfo.name,
        following: username
      });
      setMessage(`已关注 ${username}`);
      loadFollowData(); // 重新加载数据
    } catch (error) {
      console.error('关注失败:', error);
      setMessage('关注失败，请重试');
    }
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
          <h2 style={{ margin: 0, color: '#2c3e50' }}>关注管理</h2>
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
          <h2 style={{ margin: 0, color: '#2c3e50' }}>关注管理</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
          请先完善个人信息
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
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
        <h2 style={{ margin: 0, color: '#2c3e50', flex: 1 }}>关注管理</h2>
      </div>

      {/* 消息显示 */}
      {message && (
        <div style={{ 
          marginBottom: 20, 
          padding: '15px', 
          background: message.includes('已关注') || message.includes('已取消') ? '#d4edda' : '#f8d7da',
          color: message.includes('已关注') || message.includes('已取消') ? '#155724' : '#721c24',
          borderRadius: 8,
          border: `1px solid ${message.includes('已关注') || message.includes('已取消') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}

      {/* 标签页 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 30, borderBottom: '1px solid #ecf0f1' }}>
        <button
          onClick={() => setActiveTab('following')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'following' ? '2px solid #3498db' : '2px solid transparent',
            color: activeTab === 'following' ? '#3498db' : '#7f8c8d',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          我的关注 ({following.length})
        </button>
        <button
          onClick={() => setActiveTab('followers')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'followers' ? '2px solid #3498db' : '2px solid transparent',
            color: activeTab === 'followers' ? '#3498db' : '#7f8c8d',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          我的粉丝 ({followers.length})
        </button>
      </div>

      {/* 关注列表 */}
      {activeTab === 'following' && (
        <div>
          {following.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>👥</div>
              <div style={{ fontSize: '18px', marginBottom: '10px' }}>还没有关注任何人</div>
              <div style={{ fontSize: '14px' }}>去发现有趣的人吧！</div>
            </div>
          ) : (
            following.map(item => (
              <div key={item._id} style={{ 
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
                  <Avatar name={item.following} size={50} />
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '16px' }}>
                      {item.following}
                    </div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                      关注于 {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleUnfollow(item.following)}
                  style={{
                    padding: '8px 16px',
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  取消关注
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* 粉丝列表 */}
      {activeTab === 'followers' && (
        <div>
          {followers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>👥</div>
              <div style={{ fontSize: '18px', marginBottom: '10px' }}>还没有粉丝</div>
              <div style={{ fontSize: '14px' }}>发布更多精彩内容来吸引关注吧！</div>
            </div>
          ) : (
            followers.map(item => (
              <div key={item._id} style={{ 
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
                  <Avatar name={item.follower} size={50} />
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '16px' }}>
                      {item.follower}
                    </div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                      关注于 {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleFollow(item.follower)}
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
                  回关
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
