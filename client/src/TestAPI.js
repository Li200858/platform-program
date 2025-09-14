// 测试API配置的组件
import React from 'react';

export default function TestAPI() {
  const testAPI = async () => {
    console.log('环境变量 REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    console.log('使用的API URL:', apiUrl);
    
    try {
      const response = await fetch(`${apiUrl}/api/health`);
      const data = await response.json();
      console.log('API健康检查结果:', data);
    } catch (error) {
      console.error('API测试失败:', error);
    }
  };

  return (
    <div style={{ padding: '20px', background: '#f0f0f0', margin: '20px' }}>
      <h3>API配置测试</h3>
      <button onClick={testAPI} style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
        测试API配置
      </button>
      <div style={{ marginTop: '10px' }}>
        <p>REACT_APP_API_URL: {process.env.REACT_APP_API_URL || '未设置'}</p>
        <p>NODE_ENV: {process.env.NODE_ENV}</p>
      </div>
    </div>
  );
}
