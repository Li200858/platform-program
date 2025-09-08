import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 20,
          margin: 20,
          border: '1px solid #dc3545',
          borderRadius: 8,
          backgroundColor: '#f8d7da',
          color: '#721c24'
        }}>
          <h3>出现错误</h3>
          <p>页面加载时出现错误，请刷新页面重试。</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            刷新页面
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: 10 }}>
              <summary>错误详情</summary>
              <pre style={{ fontSize: 12, marginTop: 10 }}>
                {this.state.error?.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
