# 线上交流平台

## 功能概述

这是一个支持用户发布内容的线上交流平台，具有以下主要功能：

### 1. 用户信息管理
- 用户可以设置昵称、年纪、班级和头像
- 用户信息会在发布的内容下方显示
- 支持头像上传功能

### 2. 权限系统
- **创始人（founder）**：最高权限，可以指定管理员，转让创始人权限
- **管理员（admin）**：可以审核内容，管理用户权限
- **用户（user）**：普通用户，可以发布内容但需要审核

### 3. 内容审核系统
- 所有用户发布的内容都需要经过审核
- 内容分类：学习板块、PBL学习、艺术创作、跨校联合、活动策划等
- 创始人和管理员可以在审核区域查看、通过或驳回内容

## 本地开发

### 后端设置
```bash
cd server
npm install
```

### 前端设置
```bash
cd client
npm install
```

### 数据库设置
确保MongoDB已启动，然后运行：
```bash
cd server
node setup-founder.js
```

### 启动服务
```bash
# 启动后端（在server目录下）
npm start

# 启动前端（在client目录下）
npm start
```

## 部署到生产环境

### 快速部署
1. 查看 `QUICK_DEPLOY.md` 获取详细部署步骤
2. 运行部署脚本：
```bash
./deploy.sh
```

### 支持的部署平台
- **后端**: Vercel, Railway, Render, Heroku
- **前端**: Vercel, Netlify, GitHub Pages
- **数据库**: MongoDB Atlas (推荐)

## 使用说明

### 1. 设置创始人
有两种方式设置创始人：

#### 方式一：基于特定邮箱（推荐）
1. 在环境变量中设置 `FOUNDER_EMAILS=your-email@example.com`
2. 使用指定邮箱注册或登录，将自动获得创始人权限
3. 支持多个邮箱，用逗号分隔：`FOUNDER_EMAILS=email1@example.com,email2@example.com`

#### 方式二：传统方式
1. 先注册一个用户账号
2. 运行 `node setup-founder.js` 脚本
3. 第一个注册的用户将被设为创始人

#### 方式三：批量设置现有用户
运行 `node setup-founder-email.js` 脚本，将环境变量中指定的邮箱用户设为创始人

### 2. 用户权限管理
- 创始人可以在管理员面板中搜索用户邮箱
- 可以指定其他用户为管理员
- 可以转让创始人权限给其他用户

### 3. 内容发布流程
1. 用户登录后，进入相应板块
2. 点击"发布内容"按钮
3. 填写内容信息并选择分类
4. 提交后内容进入审核区域
5. 创始人或管理员在管理员面板中审核内容
6. 审核通过后内容正式显示在网站上

### 4. 管理员功能
- **用户管理**：查看所有用户，搜索用户，转让权限
- **内容审核**：查看待审核内容，通过或驳回内容

## API接口

### 用户相关
- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录
- `GET /api/me` - 获取当前用户信息
- `POST /api/me` - 更新用户信息

### 权限管理
- `GET /api/users/search` - 搜索用户（需要创始人或管理员权限）
- `POST /api/users/:id/transfer-role` - 转让权限
- `GET /api/users` - 获取所有用户（需要创始人或管理员权限）

### 内容审核
- `POST /api/pending-content` - 提交内容到审核区域
- `GET /api/pending-content` - 获取待审核内容列表
- `POST /api/pending-content/:id/review` - 审核内容

## 技术栈

### 后端
- Node.js + Express
- MongoDB + Mongoose
- JWT认证
- Multer文件上传

### 前端
- React
- 原生CSS样式
- Fetch API

## 注意事项

1. 确保MongoDB服务正在运行
2. 创始人权限只能转让给其他用户，不能删除
3. 内容审核通过后会自动创建到对应的正式内容表中
4. 文件上传功能支持图片格式
5. 用户信息修改后需要重新登录才能看到更新

## 文件结构

```
platform-program/
├── server/
│   ├── models/          # 数据模型
│   ├── index.js         # 后端主文件
│   ├── setup-founder.js # 创始人设置脚本
│   └── uploads/         # 上传文件存储
├── client/
│   └── src/
│       ├── App.js       # 主应用组件
│       ├── MyProfile.js # 用户资料页面
│       ├── AdminPanel.js # 管理员面板
│       └── ContentPublish.js # 内容发布页面
└── README.md
``` 