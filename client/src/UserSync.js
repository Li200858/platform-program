import React, { useState } from 'react';
import { useUserID } from './UserIDManager';

export default function UserSync({ onBack }) {
  const { userID, importUserID, exportUserID, resetUserID } = useUserID();
  const [importID, setImportID] = useState('');
  const [message, setMessage] = useState('');

  const handleImport = () => {
    if (!importID.trim()) {
      setMessage('请输入要导入的用户ID');
      return;
    }

    try {
      importUserID(importID.trim());
      setMessage('用户ID导入成功！现在可以同步您的数据了。');
      setImportID('');
    } catch (error) {
      setMessage('导入失败：' + error.message);
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