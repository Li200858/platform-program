import React, { useState } from 'react';
import { useUserID } from './UserIDManager';

export default function UserSync({ onBack }) {
  const { userID, importUserID, exportUserID, resetUserID, getQRCodeData, parseQRCodeData } = useUserID();
  const [importID, setImportID] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
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

  const handleQRCodeToggle = () => {
    setShowQRCode(!showQRCode);
  };

  const qrData = getQRCodeData();

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
        background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)', 
        borderRadius: 12,
        border: '1px solid #bbdefb'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>当前用户ID</h3>
        <div style={{ 
          fontFamily: 'monospace', 
          fontSize: '14px', 
          color: '#424242',
          wordBreak: 'break-all',
          background: '#fff',
          padding: '10px',
          borderRadius: 6,
          border: '1px solid #e0e0e0'
        }}>
          {userID}
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          此ID用于跨设备同步您的数据
        </div>
      </div>

      {/* 导入用户ID */}
      <div style={{ marginBottom: 30 }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>导入用户ID</h3>
        <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
          <input
            type="text"
            value={importID}
            onChange={(e) => setImportID(e.target.value)}
            placeholder="粘贴要导入的用户ID"
            style={{ 
              flex: 1, 
              padding: '12px', 
              borderRadius: 8, 
              border: '2px solid #ecf0f1',
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
          从其他设备复制用户ID到这里进行数据同步
        </div>
      </div>

      {/* 导出用户ID */}
      <div style={{ marginBottom: 30 }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>导出用户ID</h3>
        <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
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
          <button
            onClick={handleQRCodeToggle}
            style={{
              padding: '12px 20px',
              background: showQRCode ? '#e74c3c' : '#9b59b6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {showQRCode ? '隐藏二维码' : '显示二维码'}
          </button>
        </div>
        <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
          复制用户ID到其他设备进行数据同步
        </div>
      </div>

      {/* 二维码显示 */}
      {showQRCode && qrData && (
        <div style={{ 
          marginBottom: 30, 
          padding: '20px', 
          background: '#f8f9fa', 
          borderRadius: 12,
          textAlign: 'center',
          border: '1px solid #e9ecef'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>用户同步二维码</h4>
          <div style={{ 
            background: '#fff', 
            padding: '20px', 
            borderRadius: 8, 
            display: 'inline-block',
            border: '2px solid #dee2e6'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}></div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
              扫描此二维码同步用户数据
            </div>
            <div style={{ 
              fontFamily: 'monospace', 
              fontSize: '10px', 
              color: '#999',
              wordBreak: 'break-all',
              maxWidth: '200px'
            }}>
              {JSON.stringify(qrData)}
            </div>
          </div>
        </div>
      )}

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

      {/* 消息显示 */}
      {message && (
        <div style={{ 
          padding: '15px', 
          background: message.includes('成功') ? '#d4edda' : '#f8d7da',
          color: message.includes('成功') ? '#155724' : '#721c24',
          borderRadius: 8,
          border: `1px solid ${message.includes('成功') ? '#c3e6cb' : '#f5c6cb'}`,
          marginBottom: '20px'
        }}>
          {message}
        </div>
      )}

      {/* 使用说明 */}
      <div style={{ 
        padding: '20px', 
        background: '#f8f9fa', 
        borderRadius: 12,
        border: '1px solid #e9ecef'
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>使用说明</h4>
        <div style={{ fontSize: '14px', color: '#666', lineHeight: 1.6 }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>1. 跨设备同步：</strong> 在设备A上复制用户ID，在设备B上导入该ID
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>2. 数据同步：</strong> 同步后，您的个人信息、收藏、作品等数据将在所有设备间保持一致
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>3. 安全提示：</strong> 请妥善保管您的用户ID，不要与他人分享
          </div>
          <div>
            <strong>4. 重置功能：</strong> 如果遇到问题，可以重置用户ID重新开始
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 15, justifyContent: 'flex-end', marginTop: 30 }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 24px',
            background: '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          返回
        </button>
      </div>
    </div>
  );
}
