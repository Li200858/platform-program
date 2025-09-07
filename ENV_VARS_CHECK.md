# ⚙️ 环境变量配置检查

## 必需的环境变量

### 1. MONGODB_URI
```bash
# 格式示例
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database-name?retryWrites=true&w=majority
```

**检查要点**:
- [ ] 用户名和密码正确
- [ ] 集群地址正确
- [ ] 数据库名称正确
- [ ] 连接参数完整

### 2. JWT_SECRET
```bash
# 建议格式（32位以上随机字符串）
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
```

**检查要点**:
- [ ] 长度至少32位
- [ ] 包含字母、数字、特殊字符
- [ ] 不包含空格或换行符

### 3. FOUNDER_EMAILS（可选）
```bash
# 格式示例
FOUNDER_EMAILS=founder@example.com,admin@example.com
```

**检查要点**:
- [ ] 邮箱格式正确
- [ ] 多个邮箱用逗号分隔
- [ ] 没有多余的空格

## 在Netlify中设置环境变量

### 步骤
1. 登录 [Netlify控制台](https://app.netlify.com)
2. 选择您的项目
3. 点击 "Site settings"
4. 点击 "Environment variables"
5. 添加上述环境变量
6. 点击 "Save"
7. 重新部署网站

### 验证设置
部署后访问: `https://your-site.netlify.app/api/env-check`

## 安全建议

### 生产环境安全
- [ ] 使用强密码
- [ ] JWT密钥足够复杂
- [ ] 定期轮换密钥
- [ ] 不要在代码中硬编码密钥

### 备份配置
- [ ] 记录所有环境变量
- [ ] 保存到安全位置
- [ ] 准备恢复方案
