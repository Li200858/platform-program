import React, { useEffect, useState } from 'react';
import Avatar from './Avatar';
import FilePreview from './FilePreview';
import api from './api';

const apiBase =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://platform-program.onrender.com'
    : 'http://localhost:5000');

export default function UserPublicProfile({ viewer, target, onBack }) {
  const [klass, setKlass] = useState(target.class || '');
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const name = target.name;

  const isSelf = viewer && viewer.name === name;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const infoP = api.user.publicInfo(name);
        const listP = api.art.getMyWorks(name);
        const chkP =
          viewer && viewer.name
            ? api.follows.check(viewer.name, name)
            : Promise.resolve({ following: false });
        const [info, list, chk] = await Promise.all([infoP, listP, chkP]);
        if (cancelled) return;
        if (info && info.class) setKlass(info.class);
        setWorks(Array.isArray(list) ? list : []);
        setIsFollowing(!!chk.following);
      } catch {
        if (!cancelled) setWorks([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [name, viewer && viewer.name]);

  const toggleFollow = async () => {
    if (!viewer || !viewer.name || isSelf) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await api.follows.unfollow(viewer.name, name);
        setIsFollowing(false);
      } else {
        await api.follows.follow(viewer.name, name);
        setIsFollowing(true);
      }
    } catch (e) {
      window.alert(e.message || '操作失败');
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '24px auto', padding: '0 16px 48px' }}>
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <Avatar name={name} size={64} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <h2 style={{ margin: '0 0 6px', color: '#1a237e' }}>{name}</h2>
          {klass ? <div style={{ color: '#616161' }}>班级：{klass}</div> : null}
        </div>
        {viewer && viewer.name && !isSelf ? (
          <button
            type="button"
            onClick={toggleFollow}
            disabled={followLoading}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              background: isFollowing ? '#eceff1' : '#3949ab',
              color: isFollowing ? '#37474f' : '#fff',
              cursor: followLoading ? 'wait' : 'pointer',
              fontWeight: 600,
            }}
          >
            {followLoading ? '…' : isFollowing ? '已关注' : '关注'}
          </button>
        ) : null}
      </div>

      <h3 style={{ color: '#37474f', margin: '0 0 12px', fontSize: 18 }}>发布的作品</h3>
      {loading ? (
        <div style={{ color: '#888' }}>加载中…</div>
      ) : works.length === 0 ? (
        <div style={{ color: '#888' }}>暂无作品</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {works.map((item) => (
            <div
              key={item._id}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: 12,
                padding: 16,
                background: '#fafafa',
              }}
            >
              <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                {new Date(item.createdAt).toLocaleString()}
              </div>
              <h4 style={{ margin: '0 0 8px', color: '#263238' }}>{item.title}</h4>
              <p
                style={{
                  margin: '0 0 12px',
                  lineHeight: 1.6,
                  color: '#455a64',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {item.content}
              </p>
              {item.media && item.media.length > 0 ? (
                <FilePreview
                  urls={item.media}
                  apiBaseUrl={apiBase}
                  allowDownload={item.allowDownload !== false}
                />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
