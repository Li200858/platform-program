# ✅ MongoDB集群删除检查清单

## 🚨 删除前必须确认

### 1. 数据备份
- [ ] 确认没有重要数据需要保留
- [ ] 如果需要，先导出数据
- [ ] 确认所有用户数据已处理

### 2. 应用程序状态
- [ ] 停止所有使用该集群的应用程序
- [ ] 确认没有正在运行的部署
- [ ] 通知团队成员

### 3. 替代方案
- [ ] 确认有新的数据库可用
- [ ] 更新所有环境变量
- [ ] 测试新数据库连接

## 🗑️ 删除步骤

### 步骤1: 登录MongoDB Atlas
1. 访问 [cloud.mongodb.com](https://cloud.mongodb.com)
2. 使用您的账号登录

### 步骤2: 找到要删除的集群
1. 在项目概览页面找到集群
2. 点击集群名称进入详情

### 步骤3: 删除集群
1. 点击集群名称旁边的 "..." 菜单
2. 选择 "Terminate Cluster" 或 "删除集群"
3. 输入集群名称确认删除
4. 等待删除完成

## ⚠️ 重要提醒

- **删除是不可逆的**
- **所有数据将永久丢失**
- **删除后无法恢复**

## 🔄 删除后操作

### 1. 更新环境变量
```bash
# 如果使用新集群，更新MONGODB_URI
MONGODB_URI=mongodb+srv://username:password@new-cluster.mongodb.net/database?retryWrites=true&w=majority
```

### 2. 测试新配置
```bash
# 测试数据库连接
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ 数据库连接成功'))
  .catch(err => console.error('❌ 数据库连接失败:', err));
"
```

## 📞 需要帮助？

如果遇到问题：
- 查看MongoDB Atlas文档
- 联系MongoDB支持
- 检查网络连接
