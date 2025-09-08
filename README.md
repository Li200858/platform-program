# 校园平台网站

一个功能完整的校园内容分享与管理系统，支持多类型内容发布、审核管理、用户互动等功能。

## 🚀 快速部署

### Railway + Vercel 部署方案

本项目采用前后端分离架构：
- **前端**: 部署到 Vercel
- **后端**: 部署到 Railway
- **数据库**: MongoDB Atlas

### 部署步骤

#### 1. 后端部署 (Railway)
```bash
# 1. 访问 https://railway.app
# 2. 连接GitHub仓库
# 3. 创建新项目并选择此仓库
# 4. 配置环境变量
# 5. 部署
```

详细步骤请参考：[RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)

#### 2. 前端部署 (Vercel)
```bash
# 1. 访问 https://vercel.com
# 2. 连接GitHub仓库
# 3. 导入项目
# 4. 配置构建设置
# 5. 设置环境变量
# 6. 部署
```

详细步骤请参考：[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

## 🏗️ 技术架构

- **前端**: React.js + 原生CSS
- **后端**: Node.js + Express.js
- **数据库**: MongoDB Atlas
- **部署**: Railway (后端) + Vercel (前端)
- **认证**: JWT Token
- **文件存储**: 模拟上传（可扩展至云存储）

## 👥 用户角色

### 普通用户 (user)
- 发布各类内容
- 查看和互动
- 提交反馈意见

### 管理员 (admin)
- 审核用户内容
- 管理用户权限
- 查看所有数据

### 创始人 (founder)
- 最高权限
- 系统管理
- 用户权限分配

## 📝 核心功能

### 内容发布系统
- **学习资源**: PBL项目式学习、学术研究、学习笔记
- **艺术创作**: 绘画作品、摄影作品、设计作品
- **校园活动**: 社团活动、学术讲座、体育赛事
- **跨校联合**: 校际合作、交流项目、联合活动

### 内容审核系统
- 管理员审核流程
- 通过/驳回决定
- 审核备注系统
- 状态跟踪

### 用户管理系统
- 用户信息管理
- 角色权限分配
- 用户搜索功能
- 权限转让

### 意见反馈系统
- 分类反馈（教学、宿舍、食堂、环境）
- 多媒体附件支持
- 反馈状态跟踪
- 管理员回复

## 🔧 环境变量配置

### 后端环境变量 (Railway)
```bash
MONGODB_URI=mongodb+srv://用户名:密码@集群地址/数据库名?retryWrites=true&w=majority
JWT_SECRET=您的JWT密钥（至少32个字符）
FOUNDER_EMAILS=您的邮箱@example.com
PORT=5000
```

### 前端环境变量 (Vercel)
```bash
REACT_APP_API_URL=https://您的Railway域名
```

## 📁 项目结构

```
platform-program/
├── client/                 # 前端React应用
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── config.js       # 配置文件
│   │   └── ...
│   ├── package.json
│   └── ...
├── server/                 # 后端Node.js应用
│   ├── models/            # 数据模型
│   ├── index.js           # 服务器入口
│   ├── package.json
│   └── ...
├── railway.json           # Railway配置
├── vercel.json            # Vercel配置
├── Dockerfile             # Docker配置
└── README.md
```

## 🚀 本地开发

### 安装依赖
```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

### 启动开发服务器
```bash
# 启动后端服务器
cd server
npm run dev

# 启动前端开发服务器
cd client
npm start
```

### 环境配置
1. 复制 `server/env.example` 为 `server/.env`
2. 配置数据库连接和JWT密钥
3. 启动服务

## 📊 功能特性

### 性能优化
- React Hooks优化渲染
- 数据库连接池
- 查询结果缓存
- 懒加载和分页

### 安全机制
- JWT身份认证
- 角色权限控制
- 输入数据验证
- SQL注入防护

### 用户体验
- 响应式设计
- 加载状态提示
- 错误边界处理
- 友好的错误信息

## 🔮 扩展功能

### 计划中的功能
- 评论和点赞系统
- 内容推荐算法
- 消息通知系统
- 移动端应用

### 技术升级
- 微服务架构
- 容器化部署
- 实时通信
- 大数据分析

## 📞 支持

如果遇到问题，可以：
1. 查看部署指南文档
2. 检查GitHub Issues
3. 查看Railway/Vercel官方文档

## 📄 许可证

本项目采用 MIT 许可证。

---

**一个功能完整、技术先进的校园内容管理平台，支持多角色协作、内容审核、用户管理等核心功能。**