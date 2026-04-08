import React, { useEffect, useState, useContext } from 'react';
import Avatar from './Avatar';
import api from './api';
import { UserProfileContext } from './UserProfileContext';

export default function MyFollows({ userInfo, onBack }) {
  const { openUserProfile } = useContext(UserProfileContext);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userInfo || !userInfo.name) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.follows.list(userInfo.name);
        if (!cancelled) setList(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setList([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userInfo]);

  if (!userInfo || !userInfo.name) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>请先登录</div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: '24px auto', padding: '0 16px 48px' }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          marginBottom: 16,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontSize: 16,
          color: '#3949ab',
        }}
      >
        ← 返回
      </button>
      <h2 style={{ margin: '0 0 8px', color: '#1a237e' }}>我的关注</h2>
      <p style={{ color: '#757575', fontSize: 14, margin: '0 0 20px', lineHeight: 1.5 }}>
        点击用户可查看对方发布的全部作品。本页不展示粉丝数或关注数。
      </p>
      {loading ? (
        <div style={{ color: '#888' }}>加载中…</div>
      ) : list.length === 0 ? (
        <div style={{ color: '#888' }}>你还没有关注任何人</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {list.map((u) => (
            <li key={u.name} style={{ marginBottom: 10 }}>
              <button
                type="button"
                onClick={() => openUserProfile(u.name, u.class)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  border: '1px solid #e8eaf6',
                  borderRadius: 12,
                  background: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxSizing: 'border-box',
                }}
              >
                <Avatar name={u.name} size={48} />
                <div>
                  <div style={{ fontWeight: 700, color: '#263238', fontSize: 16 }}>{u.name}</div>
                  {u.class ? (
                    <div style={{ fontSize: 13, color: '#78909c', marginTop: 4 }}>{u.class}</div>
                  ) : null}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
