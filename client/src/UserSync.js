import React, { useState } from 'react';
import { useUserID } from './UserIDManager';

export default function UserSync({ onBack }) {
  const { userID, importUserID, exportUserID, resetUserID } = useUserID();
  const [importID, setImportID] = useState('');
  const [message, setMessage] = useState('');
  const [currentUserInfo, setCurrentUserInfo] = useState(null);

  // 加载当前用户信息
  React.useEffect(() => {
    const loadCurrentUserInfo = async () => {
      if (userID) {
        try {
          const api = (await import('./api')).default;
          const userData = await api.user.getByID(userID);
          if (userData && userData.name && userData.class) {
            setCurrentUserInfo(userData);
          }
        } catch (error) {
          console.log('无法获取当前用户信息:', error.message);
        }
      }
    };
    
    loadCurrentUserInfo();
  }, [userID]);

  const handleImport = async () => {
    if (!importID.trim()) {
      setMessage('请输入要导入的用户ID');
      return;
    }

    try {
      setMessage('正在验证用户ID并导入用户信息...');
      
      // 先验证用户ID是否存在
      const api = (await import('./api')).default;
      const userData = await api.user.getByID(importID.trim());
      
      if (!userData || !userData.name || !userData.class) {
        setMessage('该用户ID不存在或信息不完整，请检查ID是否正确');
        return;
      }
      
      // 验证通过后导入
      await importUserID(importID.trim());
      setMessage(`用户ID导入成功！已绑定到用户：${userData.name} (${userData.class})。页面将自动刷新以显示最新信息。`);
      setImportID('');
      
      // 延迟刷新页面，让用户看到成功消息
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      if (error.message.includes('404')) {
        setMessage('该用户ID不存在，请检查ID是否正确');
      } else {
        setMessage('导入失败：' + error.message);
      }
    }
  };

  const handleExport = () => {
    try {
      const exportedID = exportUserID();
      navigator.clipboard.writeText(exportedID).then(() => {
        setMessage('用户ID已复制到剪贴板！');
      }).catch(() => {
        setMessage('用户ID：' + exportedID);
      });
    } catch (error) {
      setMessage('导出失败：' + error.message);
    }
  };

  const handleReset = () => {
    if (window.confirm('确定要重置用户ID吗？这将清除所有本地数据，需要重新导入。')) {
      try {
        resetUserID();
        setMessage('用户ID已重置！');
      } catch (error) {
        setMessage('重置失败：' + error.message);
      }
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
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
        <h2 style={{ margin: 0, color: '#2c3e50' }}>用户数据同步</h2>
      </div>

      {/* 当前用户ID显示 */}
      <div style={{ 
        marginBottom: 30, 
        padding: '20px', 
        background: '#f8f9fa', 
        borderRadius: 12,
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>当前用户ID</h3>
        <div style={{ 
          fontFamily: 'monospace', 
          fontSize: '16px', 
          color: '#2c3e50',
          wordBreak: 'break-all',
          background: '#fff',
          padding: '10px',
          borderRadius: 6,
          border: '1px solid #dee2e6'
        }}>
          {userID}
        </div>
        <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '8px' }}>
          此ID用于跨设备同步您的数据
        </div>
        
        {/* 显示当前绑定的用户信息 */}
        {currentUserInfo ? (
          <div style={{ 
            marginTop: '15px', 
            padding: '15px', 
            background: '#e8f5e8', 
            borderRadius: 8,
            border: '1px solid #c3e6c3'
          }}>
            <div style={{ fontSize: '14px', color: '#27ae60', fontWeight: 'bold', marginBottom: '5px' }}>
              [已绑定] 已绑定用户信息
            </div>
            <div style={{ fontSize: '13px', color: '#2c3e50' }}>
              <strong>姓名：</strong>{currentUserInfo.name}
            </div>
            <div style={{ fontSize: '13px', color: '#2c3e50' }}>
              <strong>班级：</strong>{currentUserInfo.class}
            </div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
              此ID已与上述用户信息绑定，导入此ID将自动获取该用户信息
            </div>
          </div>
        ) : (
          <div style={{ 
            marginTop: '15px', 
            padding: '15px', 
            background: '#fff3cd', 
            borderRadius: 8,
            border: '1px solid #ffeaa7'
          }}>
            <div style={{ fontSize: '14px', color: '#856404', fontWeight: 'bold', marginBottom: '5px' }}>
              [警告] 未绑定用户信息
            </div>
            <div style={{ fontSize: '12px', color: '#856404' }}>
              此ID尚未绑定任何用户信息，需要先在个人信息页面填写姓名和班级
            </div>
          </div>
        )}
      </div>

      {/* 消息显示 */}
      {message && (
        <div style={{ 
          marginBottom: 20, 
          padding: '15px', 
          background: message.includes('成功') ? '#d4edda' : '#f8d7da',
          color: message.includes('成功') ? '#155724' : '#721c24',
          borderRadius: 8,
          border: `1px solid ${message.includes('成功') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}

      {/* 导入用户ID */}
      <div style={{ marginBottom: 30 }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>导入用户ID</h3>
        <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
          <input
            type="text"
            value={importID}
            onChange={(e) => setImportID(e.target.value)}
            placeholder="请输入要导入的用户ID"
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: 8,
              fontSize: '14px'
            }}
          />
          <button
            onClick={handleImport}
            style={{
              padding: '12px 20px',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            导入
          </button>
        </div>
        <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
          在其他设备上复制用户ID，然后在此处导入以同步数据
        </div>
      </div>

      {/* 导出用户ID */}
      <div style={{ marginBottom: 30 }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>导出用户ID</h3>
        <button
          onClick={handleExport}
          style={{
            padding: '12px 20px',
            background: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          复制用户ID
        </button>
        <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '8px' }}>
          复制用户ID到其他设备进行数据同步
        </div>
      </div>

      {/* 重置用户ID */}
      <div style={{ marginBottom: 30 }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>重置用户ID</h3>
        <button
          onClick={handleReset}
          style={{
            padding: '12px 20px',
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          重置用户ID
        </button>
        <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '8px' }}>
          重置后将清除所有本地数据，需要重新导入
        </div>
      </div>

      {/* 使用说明 */}
      <div style={{ 
        marginBottom: 30, 
        padding: '20px', 
        background: '#e8f4fd', 
        borderRadius: 12,
        border: '1px solid #bee5eb'
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#0c5460' }}>使用说明</h4>
        <div style={{ fontSize: '14px', color: '#0c5460', lineHeight: '1.6' }}>
          <p><strong>1. 同步数据：</strong>在手机或其他设备上复制用户ID，然后在此处导入</p>
          <p><strong>2. 导出ID：</strong>点击"复制用户ID"按钮，将ID分享给其他设备</p>
          <p><strong>3. 重置ID：</strong>如果需要重新开始，可以重置用户ID</p>
          <p><strong>注意：</strong>用户ID是纯数字格式，用于唯一标识您的账户</p>
        </div>
      </div>
    </div>
  );
}