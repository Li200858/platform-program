import React, { useEffect, useState } from 'react';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [pendingContent, setPendingContent] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [msg, setMsg] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [rejectingContentId, setRejectingContentId] = useState(null);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'review') {
      fetchPendingContent();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      setMsg('获取用户列表失败，请检查网络连接');
    }
  };

  const fetchPendingContent = async () => {
    try {
      const res = await fetch('/api/pending-content', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingContent(data);
      }
    } catch (error) {
      console.error('获取待审核内容失败:', error);
      setMsg('获取待审核内容失败，请检查网络连接');
    }
  };

  const searchUser = async () => {
    if (!searchEmail) {
      setMsg('请输入邮箱');
      return;
    }
    try {
      const res = await fetch(`/api/users/search?email=${encodeURIComponent(searchEmail)}`, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResult(data);
        setMsg('');
      } else {
        const error = await res.json();
        setMsg(error.error);
        setSearchResult(null);
      }
    } catch (error) {
      setMsg('搜索失败');
    }
  };

  const transferRole = async (userId, newRole) => {
    try {
      const res = await fetch(`/api/users/${userId}/transfer-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ newRole })
      });
      if (res.ok) {
        setMsg('权限转让成功');
        fetchUsers();
        setSearchResult(null);
        setSearchEmail('');
      } else {
        const error = await res.json();
        setMsg(error.error);
      }
    } catch (error) {
      setMsg('权限转让失败');
    }
  };

  const reviewContent = async (contentId, action, note = '') => {
    try {
      const res = await fetch(`/api/pending-content/${contentId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ action, note })
      });
      if (res.ok) {
        setMsg(action === 'approve' ? '内容已通过' : '内容已驳回');
        fetchPendingContent();
        setRejectingContentId(null);
        setRejectNote('');
      } else {
        const error = await res.json();
        setMsg(error.error);
      }
    } catch (error) {
      setMsg('审核失败');
    }
  };

  const handleReject = (contentId) => {
    if (!rejectNote.trim()) {
      setMsg('请填写驳回原因');
      return;
    }
    reviewContent(contentId, 'reject', rejectNote.trim());
  };

  const getRoleText = (role) => {
    const roleMap = {
      'founder': '创始人',
      'admin': '管理员',
      'user': '用户'
    };
    return roleMap[role] || '用户';
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': '待审核',
      'approved': '已通过', 
      'rejected': '已驳回'
    };
    return statusMap[status] || status;
  };

  return (
    <div style={{ 
      maxWidth: 1400, 
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
        管理员面板
      </h2>
      
      <div style={{ marginBottom: 30, display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <button 
          onClick={() => setActiveTab('users')}
          style={{
            padding: '16px 40px',
            backgroundColor: activeTab === 'users' ? '#4F46E5' : '#F8FAFC',
            color: activeTab === 'users' ? 'white' : '#374151',
            border: activeTab === 'users' ? 'none' : '2px solid #E5E7EB',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'users' ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none',
            minWidth: '200px'
          }}
          onMouseEnter={e => {
            if (activeTab !== 'users') {
              e.target.style.backgroundColor = '#EEF2FF';
              e.target.style.borderColor = '#4F46E5';
            }
          }}
          onMouseLeave={e => {
            if (activeTab !== 'users') {
              e.target.style.backgroundColor = '#F8FAFC';
              e.target.style.borderColor = '#E5E7EB';
            }
          }}
        >
          用户管理
        </button>
        <button 
          onClick={() => setActiveTab('review')}
          style={{
            padding: '16px 40px',
            backgroundColor: activeTab === 'review' ? '#4F46E5' : '#F8FAFC',
            color: activeTab === 'review' ? 'white' : '#374151',
            border: activeTab === 'review' ? 'none' : '2px solid #E5E7EB',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'review' ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none',
            minWidth: '200px'
          }}
          onMouseEnter={e => {
            if (activeTab !== 'review') {
              e.target.style.backgroundColor = '#EEF2FF';
              e.target.style.borderColor = '#4F46E5';
            }
          }}
          onMouseLeave={e => {
            if (activeTab !== 'review') {
              e.target.style.backgroundColor = '#F8FAFC';
              e.target.style.borderColor = '#E5E7EB';
            }
          }}
        >
          内容审核
        </button>
      </div>

      {msg && (
        <div style={{
          padding: '12px 16px',
          marginBottom: 20,
          backgroundColor: msg.includes('成功') || msg.includes('权限转让成功') || msg.includes('内容已通过') ? '#D1FAE5' : '#FEE2E2',
          color: msg.includes('成功') || msg.includes('权限转让成功') || msg.includes('内容已通过') ? '#059669' : '#DC2626',
          borderRadius: '8px',
          border: `1px solid ${msg.includes('成功') || msg.includes('权限转让成功') || msg.includes('内容已通过') ? '#A7F3D0' : '#FECACA'}`,
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {msg}
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <h3>用户管理</h3>
          
          {/* 搜索用户 */}
          <div style={{ marginBottom: 20, padding: 20, backgroundColor: '#f8f9fa', borderRadius: 5 }}>
            <h4>搜索用户（通过邮箱）</h4>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <input
                type="email"
                value={searchEmail}
                onChange={e => setSearchEmail(e.target.value)}
                placeholder="请输入用户邮箱"
                style={{ flex: 1, padding: 8, borderRadius: 5, border: '1px solid #ddd' }}
              />
              <button onClick={searchUser} style={{ padding: '8px 16px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer' }}>
                搜索
              </button>
            </div>
            
            {searchResult && (
              <div style={{ padding: 15, backgroundColor: 'white', borderRadius: 5, border: '1px solid #ddd' }}>
                <h5>搜索结果：</h5>
                <p><strong>邮箱：</strong>{searchResult.email}</p>
                <p><strong>昵称：</strong>{searchResult.name || '未设置'}</p>
                <p><strong>当前身份：</strong>{getRoleText(searchResult.role)}</p>
                <div style={{ marginTop: 10 }}>
                  <button 
                    onClick={() => transferRole(searchResult._id, 'admin')}
                    style={{ marginRight: 10, padding: '5px 10px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer' }}
                  >
                    设为管理员
                  </button>
                  <button 
                    onClick={() => transferRole(searchResult._id, 'founder')}
                    style={{ marginRight: 10, padding: '5px 10px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer' }}
                  >
                    转让创始人权限
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 用户列表 */}
          <div>
            <h4>所有用户</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: 10, textAlign: 'left', border: '1px solid #ddd' }}>邮箱</th>
                    <th style={{ padding: 10, textAlign: 'left', border: '1px solid #ddd' }}>昵称</th>
                    <th style={{ padding: 10, textAlign: 'left', border: '1px solid #ddd' }}>身份</th>
                    <th style={{ padding: 10, textAlign: 'left', border: '1px solid #ddd' }}>班级</th>
                    <th style={{ padding: 10, textAlign: 'left', border: '1px solid #ddd' }}>注册时间</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td style={{ padding: 10, border: '1px solid #ddd' }}>{user.email}</td>
                      <td style={{ padding: 10, border: '1px solid #ddd' }}>{user.name || '未设置'}</td>
                      <td style={{ padding: 10, border: '1px solid #ddd' }}>
                        <span style={{ 
                          color: user.role === 'founder' ? '#e74c3c' : user.role === 'admin' ? '#f39c12' : '#3498db',
                          fontWeight: 'bold'
                        }}>
                          {getRoleText(user.role)}
                        </span>
                      </td>
                      <td style={{ padding: 10, border: '1px solid #ddd' }}>{user.class || '未设置'}</td>
                      <td style={{ padding: 10, border: '1px solid #ddd' }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'review' && (
        <div>
          <h3>内容审核</h3>
          
          {pendingContent.length === 0 ? (
            <p>暂无待审核内容</p>
          ) : (
            <div>
              {pendingContent.map(content => (
                <div key={content._id} style={{ 
                  marginBottom: 20, 
                  padding: 20, 
                  border: '1px solid #ddd', 
                  borderRadius: 5,
                  backgroundColor: content.status === 'pending' ? '#fff3cd' : content.status === 'approved' ? '#d4edda' : '#f8d7da'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <h4>{content.title}</h4>
                    <span style={{ 
                      padding: '5px 10px', 
                      borderRadius: 3,
                      backgroundColor: content.status === 'pending' ? '#ffc107' : content.status === 'approved' ? '#28a745' : '#dc3545',
                      color: 'white',
                      fontSize: '12px'
                    }}>
                      {getStatusText(content.status)}
                    </span>
                  </div>
                  
                                     <p><strong>分类：</strong>{content.category}</p>
                   <p><strong>类型：</strong>{content.type}</p>
                   <p><strong>作者：</strong>
                     <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
                       {content.authorAvatar && (
                         <img src={content.authorAvatar} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', marginRight: 8 }} />
                       )}
                       <span>{content.authorName || content.author}</span>
                     </div>
                   </p>
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
                  
                  {content.media && content.media.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <strong>媒体文件：</strong>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {content.media.map((url, index) => (
                          <img key={index} src={url} alt={`媒体${index + 1}`} style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 5 }} />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {content.status === 'pending' && (
                    <div style={{ marginTop: 15 }}>
                      <button 
                        onClick={() => reviewContent(content._id, 'approve')}
                        style={{ 
                          marginRight: 10, 
                          padding: '8px 16px', 
                          backgroundColor: '#28a745', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: 5, 
                          cursor: 'pointer' 
                        }}
                      >
                        通过
                      </button>
                      <button 
                        onClick={() => setRejectingContentId(content._id)}
                        style={{ 
                          padding: '8px 16px', 
                          backgroundColor: '#dc3545', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: 5, 
                          cursor: 'pointer' 
                        }}
                      >
                        驳回
                      </button>
                    </div>
                  )}
                  
                  {rejectingContentId === content._id && (
                    <div style={{ marginTop: 15, padding: 15, backgroundColor: '#f8f9fa', borderRadius: 5 }}>
                      <h5 style={{ marginBottom: 10, color: '#dc3545' }}>填写驳回原因（必填）：</h5>
                      <textarea
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                        placeholder="请输入驳回原因..."
                        style={{
                          width: '100%',
                          minHeight: 80,
                          padding: 8,
                          borderRadius: 5,
                          border: '1px solid #ddd',
                          resize: 'vertical'
                        }}
                      />
                      <div style={{ marginTop: 10 }}>
                        <button 
                          onClick={() => handleReject(content._id)}
                          style={{ 
                            marginRight: 10, 
                            padding: '8px 16px', 
                            backgroundColor: '#dc3545', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: 5, 
                            cursor: 'pointer' 
                          }}
                        >
                          确认驳回
                        </button>
                        <button 
                          onClick={() => {
                            setRejectingContentId(null);
                            setRejectNote('');
                          }}
                          style={{ 
                            padding: '8px 16px', 
                            backgroundColor: '#6c757d', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: 5, 
                            cursor: 'pointer' 
                          }}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {content.reviewNote && (
                    <div style={{ marginTop: 10, padding: 10, backgroundColor: '#e9ecef', borderRadius: 3 }}>
                      <strong>审核备注：</strong>{content.reviewNote}
                    </div>
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