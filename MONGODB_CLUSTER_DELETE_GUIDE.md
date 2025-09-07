# 🗑️ MongoDB集群删除指南

## ⚠️ 重要警告

**删除集群是不可逆的操作！** 一旦删除，所有数据将永久丢失。

## 📋 删除前检查清单

### 1. 数据备份检查
- [ ] 确认是否需要备份数据
- [ ] 检查是否有重要数据需要导出
- [ ] 确认所有应用程序已停止使用该集群

### 2. 应用程序检查
- [ ] 停止所有使用该数据库的应用程序
- [ ] 更新应用程序配置（如果需要）
- [ ] 通知团队成员

### 3. 替代方案确认
- [ ] 确认有新的数据库集群可用
- [ ] 更新环境变量配置
- [ ] 测试新集群连接

## 🗑️ 删除步骤

### 方法一：通过MongoDB Atlas控制台删除

1. **登录MongoDB Atlas**
   - 访问 [cloud.mongodb.com](https://cloud.mongodb.com)
   - 使用您的账号登录

2. **选择要删除的集群**
   - 在项目概览页面找到要删除的集群
   - 点击集群名称进入详情页面

3. **进入删除选项**
   - 点击集群名称旁边的 "..." 菜单
   - 选择 "Terminate Cluster" 或 "删除集群"

4. **确认删除**
   - 系统会要求您输入集群名称进行确认
   - 仔细阅读警告信息
   - 输入集群名称确认删除

5. **等待删除完成**
   - 删除过程通常需要几分钟
   - 您会收到删除完成的邮件通知

### 方法二：通过MongoDB Atlas API删除

```bash
# 使用MongoDB Atlas API删除集群
curl -X DELETE \
  "https://cloud.mongodb.com/api/atlas/v1.0/groups/{PROJECT-ID}/clusters/{CLUSTER-NAME}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {API-KEY}"
```

## 🔄 删除后操作

### 1. 更新应用程序配置
```bash
# 更新环境变量
MONGODB_URI=mongodb+srv://username:password@new-cluster.mongodb.net/database?retryWrites=true&w=majority
```

### 2. 创建新集群（如果需要）
1. 在MongoDB Atlas中创建新集群
2. 配置数据库用户
3. 设置网络访问
4. 更新应用程序配置

### 3. 测试新配置
```bash
# 测试新数据库连接
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ 数据库连接成功'))
  .catch(err => console.error('❌ 数据库连接失败:', err));
"
```

## 🚨 常见问题

### Q: 删除集群后数据能恢复吗？
A: **不能**。删除集群是永久性的，数据无法恢复。

### Q: 删除集群会影响其他项目吗？
A: 不会。每个集群都是独立的，删除一个不会影响其他集群。

### Q: 删除集群后费用会立即停止吗？
A: 是的。删除集群后，相关费用会立即停止。

### Q: 如何确认集群已完全删除？
A: 检查MongoDB Atlas控制台，集群应该从列表中消失。

## 📞 需要帮助？

如果遇到问题：
1. 查看MongoDB Atlas文档
2. 联系MongoDB支持
3. 检查网络连接
4. 确认账号权限

## ⏰ 删除时间

- **免费集群**: 通常立即删除
- **付费集群**: 可能需要几分钟到几小时
- **大型集群**: 可能需要更长时间

删除完成后，您会收到邮件确认。
