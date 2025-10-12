import React, { useState, useEffect } from 'react';
import FilePreview from './FilePreview';
import api from './api';

export default function ResourceLibrary({ userInfo, isAdmin, onBack }) {
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    category: 'template',
    tags: [],
    files: [],
    isPublic: true
  });
  const [selectedFiles, setSelectedFiles] = useState([]); // 保存选择的文件

  // 保存草稿到localStorage
  const saveDraft = () => {
    const draft = {
      newResource,
      selectedFiles
    };
    localStorage.setItem('resource_draft', JSON.stringify(draft));
  };

  // 从localStorage恢复草稿
  const loadDraft = () => {
    const savedDraft = localStorage.getItem('resource_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setNewResource(draft.newResource || {
          title: '',
          description: '',
          category: 'template',
          tags: [],
          files: [],
          isPublic: true
        });
        setSelectedFiles(draft.selectedFiles || []);
      } catch (error) {
        console.error('恢复草稿失败:', error);
      }
    }
  };

  // 清除草稿
  const clearDraft = () => {
    localStorage.removeItem('resource_draft');
    setNewResource({
      title: '',
      description: '',
      category: 'template',
      tags: [],
      files: [],
      isPublic: true
    });
    setSelectedFiles([]);
  };

  // 组件加载时恢复草稿
  useEffect(() => {
    loadDraft();
  }, []);

  // 当表单数据变化时自动保存草稿
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft();
    }, 1000); // 1秒后保存，避免频繁保存

    return () => clearTimeout(timer);
  }, [newResource, selectedFiles]);

  useEffect(() => {
    loadResources();
    loadCategories();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await api.resources.getAll();
      setResources(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载资料失败:', error);
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await api.resources.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载分类失败:', error);
      setCategories([]);
    }
  };

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files.length) return;

    // 保存选择的文件
    setSelectedFiles(Array.from(files));

    setMessage('');
    // 只显示文件选择状态，不立即上传
    setNewResource(prev => ({ 
      ...prev, 
      files: Array.from(files).map(file => file.name) // 只保存文件名用于显示
    }));
    setMessage(`已选择 ${files.length} 个文件，点击"上传"按钮开始上传`);
  };

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);

  const handleUploadResource = async () => {
    if (!newResource.title.trim()) {
      setMessage('请输入资料标题');
      return;
    }

    // 检查是否有文件需要上传
    const fileInput = document.querySelector('input[type="file"]');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      setMessage('请选择要上传的文件');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setMessage('');
      
      const formData = new FormData();
      formData.append('title', newResource.title);
      formData.append('description', newResource.description);
      formData.append('category', newResource.category);
      formData.append('tags', JSON.stringify(newResource.tags));
      formData.append('isPublic', newResource.isPublic);
      formData.append('uploader', userInfo.name);
      
      let totalSize = 0;
      Array.from(fileInput.files).forEach(file => {
        formData.append('files', file);
        totalSize += file.size;
      });

      const startTime = Date.now();
      
      // 使用XMLHttpRequest获取上传进度
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
          const speed = e.loaded / ((Date.now() - startTime) / 1000);
          setUploadSpeed(speed);
          console.log(`📊 资料上传进度: ${percentComplete.toFixed(1)}% (${(speed / 1024 / 1024).toFixed(2)} MB/s)`);
        }
      });

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`HTTP ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('网络错误'));
        xhr.ontimeout = () => reject(new Error('上传超时'));
      });

      const baseUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://platform-program.onrender.com' : 'http://localhost:5000');
      xhr.open('POST', `${baseUrl}/api/resources/upload`, true);
      xhr.timeout = 1800000;
      xhr.send(formData);

      await uploadPromise;
      
      setMessage(` 资料上传成功！(${(totalSize / 1024 / 1024).toFixed(2)}MB)`);
      setUploadProgress(100);
      
      // 上传成功后清除草稿
      clearDraft();
      setTimeout(() => {
        setShowUpload(false);
        loadResources();
        setUploadProgress(0);
      }, 2000);
    } catch (error) {
      console.error('上传资料失败:', error);
      setMessage(' 上传资料失败：' + error.message);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!window.confirm('确定要删除这个资料吗？')) {
      return;
    }

    try {
      await api.resources.delete(resourceId);
      setMessage('资料删除成功！');
      loadResources();
    } catch (error) {
      console.error('删除资料失败:', error);
      setMessage('删除资料失败，请重试');
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      const apiBaseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://platform-program.onrender.com' 
        : 'http://localhost:5000';
      
      const downloadUrl = `${apiBaseUrl}/api/resources/file/${file.filename}`;
      
      // 创建一个临时的a标签来触发下载
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.originalName || file.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setMessage(`开始下载 ${file.originalName || file.filename}`);
    } catch (error) {
      console.error('下载文件失败:', error);
      setMessage('下载文件失败，请重试');
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'template': return '[模板]';
      case 'image': return '[图片]';
      case 'video': return '[视频]';
      case 'audio': return '[音频]';
      case 'document': return '[文档]';
      case 'tutorial': return '[教程]';
      default: return '[文件]';
    }
  };

  const getCategoryName = (category) => {
    switch (category) {
      case 'template': return '模板';
      case 'image': return '图片素材';
      case 'video': return '视频素材';
      case 'audio': return '音频素材';
      case 'document': return '文档资料';
      case 'tutorial': return '教程';
      default: return '其他';
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px', color: '#7f8c8d' }}>加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', background: '#fff', borderRadius: 15, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>学习资料库</h2>
        <button
          onClick={() => setShowUpload(true)}
          style={{
            padding: '12px 24px',
            background: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          + 上传资料
        </button>
      </div>

      {/* 搜索和筛选 */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 30, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            placeholder="搜索资料..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 8,
              border: '1px solid #ddd',
              fontSize: '14px'
            }}
          />
        </div>
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '12px',
              borderRadius: 8,
              border: '1px solid #ddd',
              fontSize: '14px',
              minWidth: '120px'
            }}
          >
            <option value="all">全部分类</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {getCategoryIcon(category)} {getCategoryName(category)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 消息显示 */}
      {message && (
        <div style={{ 
          marginBottom: 20, 
          padding: '10px 15px', 
          backgroundColor: message.includes('成功') ? '#d4edda' : '#f8d7da',
          color: message.includes('成功') ? '#155724' : '#721c24',
          borderRadius: 6,
          border: `1px solid ${message.includes('成功') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}

      {/* 资料统计 */}
      <div style={{ marginBottom: 20, padding: '15px', background: '#f8f9fa', borderRadius: 8 }}>
        <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap' }}>
          <div>
            <strong>总资料数：</strong>{resources.length}
          </div>
          <div>
            <strong>当前筛选：</strong>{filteredResources.length}
          </div>
          <div>
            <strong>分类数：</strong>{categories.length}
          </div>
        </div>
      </div>

      {/* 资料列表 */}
      {filteredResources.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#7f8c8d' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>[资料库]</div>
          <div style={{ fontSize: '20px', marginBottom: '10px' }}>
            {searchQuery || selectedCategory !== 'all' ? '没有找到相关资料' : '还没有资料'}
          </div>
          <div style={{ fontSize: '14px', marginBottom: '30px' }}>
            {searchQuery || selectedCategory !== 'all' ? '请尝试其他搜索条件' : '上传您的第一个学习资料'}
          </div>
          <button
            onClick={() => setShowUpload(true)}
            style={{
              padding: '12px 24px',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            上传资料
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
          {filteredResources.map(resource => (
            <div key={resource._id} style={{
              border: '1px solid #ecf0f1',
              borderRadius: 12,
              padding: 20,
              background: '#f8f9fa'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '24px' }}>{getCategoryIcon(resource.category)}</span>
                  <div>
                    <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '16px' }}>
                      {resource.title}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                      {getCategoryName(resource.category)}
                    </div>
                  </div>
                </div>
                {(userInfo && (resource.uploader === userInfo.name || isAdmin)) && (
                  <button
                    onClick={() => handleDeleteResource(resource._id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#e74c3c',
                      cursor: 'pointer',
                      fontSize: '18px'
                    }}
                  >
                    ×
                  </button>
                )}
              </div>

              <p style={{ margin: '0 0 15px 0', color: '#34495e', fontSize: '14px', lineHeight: 1.4 }}>
                {resource.description || '暂无描述'}
              </p>

              {resource.files && resource.files.length > 0 && (
                <div style={{ marginBottom: 15 }}>
                  <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: 8 }}>
                    文件 ({resource.files.length}):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {resource.files.map((file, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: '#f8f9fa',
                        borderRadius: 6,
                        border: '1px solid #e9ecef'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2c3e50' }}>
                            {file.originalName || file.filename}
                          </div>
                          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadFile(file)}
                          style={{
                            padding: '6px 12px',
                            background: '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          下载
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resource.tags && resource.tags.length > 0 && (
                <div style={{ marginBottom: 15 }}>
                  {resource.tags.slice(0, 5).map((tag, index) => (
                    <span key={index} style={{
                      display: 'inline-block',
                      background: '#ecf0f1',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: '10px',
                      margin: '1px 2px 1px 0',
                      color: '#2c3e50'
                    }}>
                      #{tag}
                    </span>
                  ))}
                  {resource.tags.length > 5 && (
                    <span style={{ fontSize: '10px', color: '#7f8c8d' }}>
                      +{resource.tags.length - 5}
                    </span>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#7f8c8d' }}>
                <span>{resource.uploader}</span>
                <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
              </div>

              <div style={{ marginTop: 10, fontSize: '12px', color: '#7f8c8d' }}>
                <span style={{
                  padding: '2px 6px',
                  borderRadius: 8,
                  background: resource.isPublic ? '#27ae60' : '#e74c3c',
                  color: 'white',
                  fontSize: '10px'
                }}>
                  {resource.isPublic ? '公开' : '私密'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 上传资料弹窗 */}
      {showUpload && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 15,
            padding: 30,
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: 20, color: '#2c3e50' }}>上传学习资料</h3>
            
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>资料标题 *</label>
              <input
                type="text"
                value={newResource.title}
                onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                placeholder="请输入资料标题"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 6,
                  border: '1px solid #ddd'
                }}
              />
            </div>

            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>分类</label>
              <select
                value={newResource.category}
                onChange={(e) => setNewResource(prev => ({ ...prev, category: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 6,
                  border: '1px solid #ddd'
                }}
              >
                <option value="template">模板</option>
                <option value="image">图片素材</option>
                <option value="video">视频素材</option>
                <option value="audio">音频素材</option>
                <option value="document">文档资料</option>
                <option value="tutorial">教程</option>
              </select>
            </div>

            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>描述</label>
              <textarea
                value={newResource.description}
                onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请描述这个资料..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>标签</label>
              <input
                type="text"
                placeholder="用逗号分隔多个标签，如：设计,创意,PPT"
                onChange={(e) => {
                  const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                  setNewResource(prev => ({ ...prev, tags }));
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 6,
                  border: '1px solid #ddd'
                }}
              />
            </div>

            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>上传文件 * (最大2GB)</label>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 6,
                  border: '1px solid #ddd'
                }}
              />
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: 5 }}>
                支持图片、视频、音频、文档等，单个文件最大2GB
              </div>
              
              {/* 上传进度条 */}
              {uploading && uploadProgress > 0 && (
                <div style={{ marginTop: '15px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    color: '#2c3e50',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>
                      📊 上传进度: {uploadProgress.toFixed(1)}%
                    </span>
                    <span style={{ color: '#3498db', fontWeight: '600' }}>
                      {uploadSpeed > 0 ? `⚡ ${(uploadSpeed / 1024 / 1024).toFixed(2)} MB/s` : '计算中...'}
                    </span>
                  </div>
                  
                  <div style={{
                    width: '100%',
                    height: '28px',
                    backgroundColor: '#ecf0f1',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                      background: uploadProgress === 100 
                        ? 'linear-gradient(90deg, #27ae60, #2ecc71)' 
                        : 'linear-gradient(90deg, #3498db, #5dade2)',
                      transition: 'width 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      <span style={{ 
                        color: 'white', 
                        fontWeight: 'bold', 
                        fontSize: '13px',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}>
                        {uploadProgress === 100 ? ' 完成' : `${uploadProgress.toFixed(0)}%`}
                      </span>
                    </div>
                  </div>
                  
                  {uploadProgress === 100 && (
                    <div style={{ 
                      marginTop: '10px', 
                      color: '#27ae60', 
                      fontSize: '14px',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      ✨ 资料上传成功！
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={newResource.isPublic}
                  onChange={(e) => setNewResource(prev => ({ ...prev, isPublic: e.target.checked }))}
                />
                <span>公开资料（其他人可以下载）</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowUpload(false)}
                style={{
                  padding: '10px 20px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={handleUploadResource}
                disabled={uploading}
                style={{
                  padding: '10px 20px',
                  background: uploading ? '#95a5a6' : '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: uploading ? 'not-allowed' : 'pointer'
                }}
              >
                {uploading ? '上传中...' : '上传'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
