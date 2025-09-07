# 🔧 网站维护与交接指南

## 📋 目录
1. [快速更新指南](#快速更新指南)
2. [Bug修复流程](#bug修复流程)
3. [新功能添加](#新功能添加)
4. [环境变量管理](#环境变量管理)
5. [数据库维护](#数据库维护)
6. [网站交接流程](#网站交接流程)
7. [常见问题解决](#常见问题解决)
8. [紧急情况处理](#紧急情况处理)

---

## 🚀 快速更新指南

### 方法一：通过GitHub更新（推荐）
```bash
# 1. 修改本地代码
# 2. 提交到GitHub
git add .
git commit -m "描述你的修改"
git push origin main

# 3. Netlify会自动重新部署
```

### 方法二：直接修改Netlify函数
1. 登录 [Netlify控制台](https://app.netlify.com)
2. 选择你的项目
3. 点击 "Functions" 标签
4. 选择要修改的函数
5. 直接编辑代码
6. 点击 "Save" 保存

### 方法三：重新上传部署包
1. 修改本地代码
2. 将整个 `deploy-package` 文件夹拖拽到Netlify
3. 等待部署完成

---

## 🐛 Bug修复流程

### 1. 识别问题
- 查看Netlify函数日志
- 检查用户反馈
- 测试网站功能

### 2. 定位问题
```javascript
// 在代码中添加详细日志
console.error('具体错误信息:', error);
console.log('调试信息:', debugData);
```

### 3. 修复问题
```javascript
// 例如：修复登录错误
try {
  await connectDB();
  // 数据库操作
} catch (error) {
  console.error('数据库连接失败:', error);
  return {
    statusCode: 500,
    headers: corsHeaders,
    body: JSON.stringify({ 
      error: '数据库连接失败，请稍后重试',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  };
}
```

### 4. 测试修复
- 在本地测试
- 部署到测试环境
- 验证修复效果

---

## ✨ 新功能添加

### 1. 添加新的API端点
```javascript
// 在 deploy-package/netlify/functions/ 目录下创建新文件
// 例如：new-feature.js

const mongoose = require('mongoose');

exports.handler = async (event, context) => {
  // 处理CORS
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    // 你的新功能代码
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: '新功能成功' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: '服务器错误' })
    };
  }
};
```

### 2. 更新前端界面
```javascript
// 在 client/src/ 目录下修改React组件
// 例如：添加新的页面组件

import React, { useState } from 'react';

export default function NewFeature() {
  const [data, setData] = useState(null);

  const handleAction = async () => {
    try {
      const response = await fetch('/api/new-feature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ /* 数据 */ })
      });
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('请求失败:', error);
    }
  };

  return (
    <div>
      <h2>新功能</h2>
      <button onClick={handleAction}>执行操作</button>
      {data && <div>{JSON.stringify(data)}</div>}
    </div>
  );
}
```

### 3. 更新路由配置
```javascript
// 在 App.js 中添加新路由
// 在 netlify.toml 中添加新的重定向规则

[[redirects]]
  from = "/api/new-feature"
  to = "/.netlify/functions/new-feature"
  status = 200
```

---

## ⚙️ 环境变量管理

### 必需的环境变量
```bash
# MongoDB连接字符串
MONGODB_URI=mongodb+srv://用户名:密码@集群地址.mongodb.net/数据库名?retryWrites=true&w=majority

# JWT认证密钥（至少32位）
JWT_SECRET=你的32位随机字符串

# 创始人邮箱（可选，用逗号分隔）
FOUNDER_EMAILS=founder1@example.com,founder2@example.com
```

### 修改环境变量
1. 登录Netlify控制台
2. 选择项目
3. 点击 "Site settings"
4. 点击 "Environment variables"
5. 添加或修改变量
6. 点击 "Save"
7. 重新部署网站

### 环境变量检查
访问 `/api/env-check` 端点检查环境变量配置状态

---

## 🗄️ 数据库维护

### 查看数据库
1. 登录 [MongoDB Atlas](https://cloud.mongodb.com)
2. 选择你的集群
3. 点击 "Browse Collections"
4. 查看数据

### 备份数据
1. 在MongoDB Atlas中点击 "Backups"
2. 创建手动备份
3. 或设置自动备份

### 数据迁移
```javascript
// 创建迁移脚本
const migrateData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // 例如：为所有用户添加新字段
    const users = await User.find({});
    for (let user of users) {
      if (!user.newField) {
        user.newField = 'defaultValue';
        await user.save();
      }
    }
    
    console.log('数据迁移完成');
  } catch (error) {
    console.error('迁移失败:', error);
  }
};
```

---

## 👥 网站交接流程

### 1. 准备交接材料

#### 技术资料
- [ ] GitHub仓库访问权限
- [ ] Netlify项目访问权限
- [ ] MongoDB Atlas访问权限
- [ ] 环境变量配置信息
- [ ] 域名管理权限（如果有）

#### 文档资料
- [ ] 项目架构说明
- [ ] 部署流程文档
- [ ] 功能使用说明
- [ ] 常见问题解决方案

### 2. 权限转移

#### GitHub权限转移
1. 进入GitHub仓库
2. 点击 "Settings"
3. 点击 "Manage access"
4. 点击 "Invite a collaborator"
5. 输入新管理员的GitHub用户名
6. 选择权限级别（建议选择 "Admin"）

#### Netlify权限转移
1. 登录Netlify控制台
2. 选择项目
3. 点击 "Site settings"
4. 点击 "Team"
5. 点击 "Invite members"
6. 输入新管理员的邮箱
7. 选择权限级别

#### MongoDB Atlas权限转移
1. 登录MongoDB Atlas
2. 点击 "Access Manager"
3. 点击 "Invite User"
4. 输入新管理员的邮箱
5. 选择角色（建议选择 "Project Owner"）

### 3. 交接清单

#### 必须交接的内容
- [ ] 所有账户的登录信息
- [ ] 环境变量配置
- [ ] 数据库连接信息
- [ ] 域名和SSL证书信息
- [ ] 支付账户信息（如果有）

#### 可选交接的内容
- [ ] 代码开发环境配置
- [ ] 测试数据
- [ ] 用户反馈记录
- [ ] 性能监控数据

---

## ❓ 常见问题解决

### 1. 网站无法访问
**可能原因：**
- Netlify部署失败
- 域名配置错误
- SSL证书问题

**解决方法：**
1. 检查Netlify部署状态
2. 查看部署日志
3. 重新部署网站

### 2. 登录/注册失败
**可能原因：**
- 环境变量未设置
- 数据库连接失败
- JWT密钥问题

**解决方法：**
1. 检查环境变量配置
2. 测试数据库连接
3. 访问 `/api/env-check` 检查配置

### 3. 文件上传失败
**可能原因：**
- 文件大小超限
- 文件格式不支持
- 存储空间不足

**解决方法：**
1. 检查文件大小限制
2. 验证文件格式
3. 清理存储空间

### 4. 内容审核功能异常
**可能原因：**
- 权限配置错误
- 数据库查询失败
- 前端状态同步问题

**解决方法：**
1. 检查用户权限
2. 验证数据库连接
3. 刷新页面状态

---

## 🚨 紧急情况处理

### 1. 网站完全无法访问
**立即行动：**
1. 登录Netlify控制台
2. 检查部署状态
3. 查看错误日志
4. 尝试重新部署

**备用方案：**
1. 使用备份版本重新部署
2. 联系Netlify技术支持
3. 临时使用其他部署平台

### 2. 数据丢失
**立即行动：**
1. 停止所有数据操作
2. 检查MongoDB Atlas备份
3. 恢复最新备份
4. 通知用户数据恢复情况

### 3. 安全漏洞
**立即行动：**
1. 立即下线网站
2. 检查代码漏洞
3. 修复安全问题
4. 重新部署安全版本

---

## 📞 联系支持

### Netlify支持
- 邮箱：support@netlify.com
- 文档：https://docs.netlify.com
- 社区：https://community.netlify.com

### MongoDB Atlas支持
- 邮箱：support@mongodb.com
- 文档：https://docs.atlas.mongodb.com
- 社区：https://community.mongodb.com

### GitHub支持
- 邮箱：support@github.com
- 文档：https://docs.github.com
- 社区：https://github.community

---

## 📝 更新日志

### 版本 1.0.0 (2024-01-01)
- 初始版本发布
- 基础功能实现
- 用户注册登录
- 内容发布审核

### 版本 1.1.0 (2024-01-15)
- 添加文件上传功能
- 优化用户界面
- 修复已知bug

### 版本 1.2.0 (2024-02-01)
- 添加搜索功能
- 改进内容审核流程
- 增强安全性

---

**最后更新：** 2024年1月
**维护者：** [你的姓名]
**联系方式：** [你的邮箱]
