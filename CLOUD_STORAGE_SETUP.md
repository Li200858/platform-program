# 云存储配置指南

## 🚀 概述

本应用现在支持三种存储方式：
1. **AWS S3** (推荐)
2. **Google Cloud Storage (GCS)**
3. **本地存储** (仅开发环境)

## 📋 配置步骤

### 方案1：AWS S3配置 (推荐)

#### 1. 创建AWS账户和S3存储桶
1. 访问 [AWS控制台](https://console.aws.amazon.com/)
2. 创建S3存储桶：
   - 存储桶名称：`your-platform-files` (全局唯一)
   - 区域：选择离用户最近的区域
   - 公共访问：允许公共读取

#### 2. 创建IAM用户
1. 进入IAM服务
2. 创建新用户：`platform-storage-user`
3. 附加策略：`AmazonS3FullAccess`
4. 创建访问密钥，下载CSV文件

#### 3. 配置环境变量
在Railway项目设置中添加：
```bash
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_S3_BUCKET_NAME=your-platform-files
AWS_REGION=us-east-1
```

#### 4. 配置CORS
在S3存储桶的权限设置中添加CORS配置：
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

### 方案2：Google Cloud Storage配置

#### 1. 创建GCP项目和存储桶
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用Cloud Storage API
4. 创建存储桶：
   - 名称：`your-platform-files`
   - 位置类型：区域
   - 存储类别：标准

#### 2. 创建服务账户
1. 进入IAM和管理 > 服务账户
2. 创建服务账户：`platform-storage-service`
3. 角色：`Storage Admin`
4. 创建密钥，下载JSON文件

#### 3. 获取访问令牌
```bash
# 使用gcloud CLI
gcloud auth application-default login
gcloud auth print-access-token
```

#### 4. 配置环境变量
在Railway项目设置中添加：
```bash
GCS_BUCKET_NAME=your-platform-files
GCS_ACCESS_TOKEN=your_access_token
```

### 方案3：本地存储 (仅开发)

本地存储无需额外配置，但文件不会持久化。

## 🔧 部署配置

### Railway环境变量设置

1. 进入Railway项目设置
2. 添加环境变量：
   - 选择方案1或方案2的变量
   - 确保所有必需变量都已设置

### 验证配置

部署后访问以下端点验证配置：
- `https://your-app.railway.app/api/storage-config`

## 📊 成本估算

### AWS S3
- **存储**: $0.023/GB/月
- **请求**: $0.0004/1000 PUT请求
- **传输**: 前1GB免费，之后$0.09/GB

### Google Cloud Storage
- **存储**: $0.020/GB/月
- **请求**: $0.004/1000 PUT请求
- **传输**: 前1GB免费，之后$0.12/GB

## 🚨 重要注意事项

1. **安全性**: 不要将访问密钥提交到代码仓库
2. **权限**: 使用最小权限原则
3. **备份**: 定期备份重要文件
4. **监控**: 设置成本和使用量监控

## 🔍 故障排除

### 常见问题

1. **文件上传失败**
   - 检查环境变量是否正确设置
   - 验证存储桶权限
   - 查看服务器日志

2. **文件无法访问**
   - 检查CORS配置
   - 验证文件URL格式
   - 确认存储桶公共访问设置

3. **成本过高**
   - 设置生命周期策略
   - 使用适当的存储类别
   - 监控使用量

### 调试端点

- `/api/storage-config` - 查看存储配置
- `/api/files` - 查看本地文件列表
- `/api/check-file/:filename` - 检查特定文件

## 📞 支持

如果遇到问题，请：
1. 检查服务器日志
2. 验证环境变量配置
3. 测试存储服务连接
4. 联系技术支持
