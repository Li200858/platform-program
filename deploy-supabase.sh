#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}  校园艺术平台 - Supabase 部署脚本    ${NC}"
echo -e "${GREEN}=======================================${NC}"

# 检查是否安装了必要的工具
echo -e "${YELLOW}🔍 检查部署环境...${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ 错误: 未安装 Node.js/npm${NC}"
    exit 1
fi

if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}📦 安装 Vercel CLI...${NC}"
    npm install -g vercel
fi

# 创建 Supabase 配置文件
echo -e "${YELLOW}📝 创建 Supabase 配置...${NC}"

# 创建 supabase 目录
mkdir -p supabase

# 创建 Supabase 配置文件
cat > supabase/config.toml << 'EOF'
# A string used to distinguish different Supabase projects on the same host. Defaults to the
# working directory name when running `supabase init`.
project_id = "platform-program"

[api]
enabled = true
# Port to use for the API URL.
port = 54321
# Schemas to expose in your API. Tables, views and stored procedures in this schema will get API
# endpoints. public and storage are always included.
schemas = ["public", "storage", "graphql_public"]
# Extra schemas to add to the search_path of every request. public is always included.
extra_search_path = ["public", "extensions"]
# The maximum number of rows returned from a table or view. Limits payload size
# for accidental or malicious requests.
max_rows = 1000

[db]
# Port to use for the local database URL.
port = 54322
# Port used by db diff command to initialize the shadow database.
shadow_port = 54320
# The database major version to use. This has to be the same as your remote database's. Run `SHOW
# server_version_num;` on the remote database to check.
major_version = 15

[db.pooler]
enabled = false
# Port to use for the local connection pooler.
port = 54329
# Specifies when a server connection can be reused by other clients.
# Configure one of the supported pooler modes: `transaction`, `session`.
pool_mode = "transaction"
# How many server connections to allow per user/database pair.
default_pool_size = 20
# Maximum number of client connections allowed.
max_client_conn = 100

[realtime]
enabled = true
# Bind realtime via either IPv4 or IPv6. (default: IPv6)
# ip_version = "IPv6"

[studio]
enabled = true
# Port to use for Supabase Studio.
port = 54323
# External URL of the API server that frontend connects to.
api_url = "http://localhost:54321"

# Email testing server. Emails sent with the local dev setup are not actually sent - rather, they
# are monitored, and you can view the emails that would have been sent from the web interface.
[inbucket]
enabled = true
# Port to use for the email testing server web interface.
port = 54324
# Uncomment to expose additional ports for testing user applications that send emails.
# smtp_port = 54325
# pop3_port = 54326

[storage]
enabled = true
# The maximum file size allowed (e.g. "5MB", "500KB").
file_size_limit = "50MiB"

[auth]
enabled = true
# The base URL of your website. Used as an allow-list for redirects and for constructing URLs used
# in emails.
site_url = "http://localhost:3000"
# A list of *exact* URLs that auth providers are permitted to redirect to post authentication.
additional_redirect_urls = ["https://localhost:3000"]
# How long tokens are valid for, in seconds. Defaults to 3600 (1 hour), maximum 604800 (1 week).
jwt_expiry = 3600
# If disabled, the refresh token will never expire.
enable_refresh_token_rotation = true
# Allows refresh tokens to be reused after expiry, up to the specified interval in seconds.
# Requires enable_refresh_token_rotation = true.
refresh_token_reuse_interval = 10
# Allow/disallow new user signups to your project.
enable_signup = true

[auth.email]
# Allow/disallow new user signups via email to your project.
enable_signup = true
# If enabled, a user will be required to confirm any email change on both the old, and new email
# addresses. If disabled, only the new email is required to confirm.
double_confirm_changes = true
# If enabled, users need to confirm their email address before signing in.
enable_confirmations = false

# Uncomment to customize email template
# [auth.email.template.invite]
# subject = "You have been invited"
# content_path = "./supabase/templates/invite.html"

[auth.sms]
# Allow/disallow new user signups via SMS to your project.
enable_signup = true
# If enabled, users need to confirm their phone number before signing in.
enable_confirmations = false

# Configure one of the supported SMS providers: `twilio`, `messagebird`, `textlocal`, `vonage`.
[auth.sms.twilio]
enabled = false
account_sid = ""
message_service_sid = ""
# DO NOT commit your Twilio auth token to git. Use environment variable substitution instead:
auth_token = "env(SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN)"

# Use pre-defined map of phone number to OTP for testing.
[auth.sms.test_otp]
# 4152127777 = "123456"

# Configure one of the supported captcha providers: `hcaptcha`, `turnstile`.
[auth.captcha]
enabled = false
provider = "hcaptcha"
secret = "env(SUPABASE_AUTH_CAPTCHA_SECRET)"

# Use pre-defined map of challenge to solution for testing.
[auth.captcha.test_challenge]
# test = "test"

# Configure one of the supported MFA providers: `totp`.
[auth.mfa]
enabled = false
issuer = "supabase"

# Configure one of the supported SSO providers: `saml`.
[auth.sso]
enabled = false
# The entity ID of the Identity Provider.
entity_id = "https://example.com/sso"
# The URL of the Identity Provider's SSO endpoint.
sso_url = "https://example.com/sso"
# The X.509 certificate used to verify the Identity Provider's SAML response.
x509_cert = "env(SUPABASE_AUTH_SSO_X509_CERT)"
# The attribute mapping between the Identity Provider and Supabase.
attribute_mapping = "email=mail,phone=telephone"

# Configure one of the supported OAuth providers: `apple`, `azure`, `bitbucket`, `discord`,
# `facebook`, `github`, `gitlab`, `google`, `keycloak`, `linkedin`, `notion`, `twitch`, `twitter`,
# `slack`, `spotify`, `workos`, `zoom`.
[auth.external.apple]
enabled = false
client_id = ""
# DO NOT commit your OAuth provider secret to git. Use environment variable substitution instead:
secret = "env(SUPABASE_AUTH_EXTERNAL_APPLE_SECRET)"
# Overrides the default auth redirectUrl.
redirect_uri = ""
# Overrides the default auth provider URL. Used to support self-hosted gitlab, single-tenant Azure,
# or any other third-party OIDC providers.
url = ""

[auth.external.azure]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_AZURE_SECRET)"
# Overrides the default auth redirectUrl.
redirect_uri = ""
# Overrides the default auth provider URL. Used to support self-hosted gitlab, single-tenant Azure,
# or any other third-party OIDC providers.
url = ""

[auth.external.bitbucket]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_BITBUCKET_SECRET)"
# Overrides the default auth redirectUrl.
redirect_uri = ""

[auth.external.discord]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_DISCORD_SECRET)"
# Overrides the default auth redirectUrl.
redirect_uri = ""

[auth.external.facebook]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_FACEBOOK_SECRET)"
# Overrides the default auth redirectUrl.
redirect_uri = ""

[auth.external.github]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET)"
# Overrides the default auth redirectUrl.
redirect_uri = ""

[auth.external.gitlab]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_GITLAB_SECRET)"
# Overrides the default auth redirectUrl.
redirect_uri = ""
# Overrides the default auth provider URL. Used to support self-hosted gitlab, single-tenant Azure,
# or any other third-party OIDC providers.
url = ""

[auth.external.google]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
# Overrides the default auth redirectUrl.
redirect_uri = ""

[auth.external.keycloak]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_KEYCLOAK_SECRET)"
# Overrides the default auth redirectUrl.
redirect_uri = ""
# Overrides the default auth provider URL. Used to support self-hosted gitlab, single-tenant Azure,
# or any other third-party OIDC providers.
url = ""

[auth.external.linkedin]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_LINKEDIN_SECRET)"
# Overrides the default auth redirectUrl.
redirect_uri = ""

[auth.external.notion]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_NOTION_SECRET)"
# Overrides the default auth redirectUrl.
redirect_uri = ""

[auth.external.twitch]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_TWITCH_SECRET)"
# Overrides the default auth redirectUrl.
redirect_uri = ""

[auth.external.twitter]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_TWITTER_SECRET)"
# Overrides the default auth redirectUrl.
redirect_uri = ""

[auth.external.slack]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_SLACK_SECRET)"
# Overrides the default auth redirectUrl.
redirect_uri = ""

[auth.external.spotify]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_SPOTIFY_SECRET)"
# Overrides the default auth redirectUrl.
redirect_uri = ""

[auth.external.workos]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_WORKOS_SECRET)"
# Overrides the default auth redirectUrl.
redirect_uri = ""

[auth.external.zoom]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_ZOOM_SECRET)"
# Overrides the default auth redirectUrl.
redirect_uri = ""

[edge_functions]
enabled = true
EOF

# 创建数据库迁移文件
echo -e "${YELLOW}📝 创建数据库迁移文件...${NC}"

mkdir -p supabase/migrations

# 创建初始迁移文件
cat > supabase/migrations/20250122000000_initial_schema.sql << 'EOF'
-- 创建用户表
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    class VARCHAR(255) NOT NULL,
    avatar TEXT,
    user_id VARCHAR(255) UNIQUE,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建艺术作品表
CREATE TABLE arts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    author_class VARCHAR(255) NOT NULL,
    media TEXT[],
    likes INTEGER DEFAULT 0,
    favorites INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建活动表
CREATE TABLE activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    author_class VARCHAR(255) NOT NULL,
    media TEXT[],
    likes INTEGER DEFAULT 0,
    favorites INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建反馈表
CREATE TABLE feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    author_class VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建点赞表
CREATE TABLE likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    art_id UUID REFERENCES arts(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, art_id),
    UNIQUE(user_id, activity_id)
);

-- 创建收藏表
CREATE TABLE favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    art_id UUID REFERENCES arts(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, art_id),
    UNIQUE(user_id, activity_id)
);

-- 创建评论表
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    author_class VARCHAR(255) NOT NULL,
    art_id UUID REFERENCES arts(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_arts_author ON arts(author);
CREATE INDEX idx_arts_created_at ON arts(created_at);
CREATE INDEX idx_activities_author ON activities(author);
CREATE INDEX idx_activities_created_at ON activities(created_at);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_comments_art_id ON comments(art_id);
CREATE INDEX idx_comments_activity_id ON comments(activity_id);

-- 启用行级安全
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE arts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 创建策略（允许所有操作，生产环境需要更严格的策略）
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON arts FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON activities FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON feedback FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON likes FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON favorites FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON comments FOR ALL USING (true);
EOF

# 创建环境变量文件
echo -e "${YELLOW}📝 创建环境变量文件...${NC}"

cat > .env.local << 'EOF'
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000
EOF

cat > .env.example << 'EOF'
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000
EOF

# 创建 Vercel 配置文件
echo -e "${YELLOW}📝 创建 Vercel 配置...${NC}"

cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    },
    {
      "src": "server/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/client/$1"
    }
  ],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key"
  }
}
EOF

# 创建部署说明
echo -e "${YELLOW}📝 创建部署说明...${NC}"

cat > DEPLOY_SUPABASE.md << 'EOF'
# 校园艺术平台 - Supabase 部署指南

## 🚀 部署步骤

### 1. 设置 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 获取项目 URL 和 API 密钥
4. 在 Supabase 控制台中运行数据库迁移

### 2. 配置环境变量

1. 复制 `.env.example` 到 `.env.local`
2. 填入您的 Supabase 配置

### 3. 部署到 Vercel

1. 安装 Vercel CLI: `npm install -g vercel`
2. 登录 Vercel: `vercel login`
3. 部署项目: `vercel --prod`

## 🔧 优势

- **免费层支持**: Supabase 提供 500MB 数据库和 1GB 文件存储
- **实时功能**: 支持实时数据同步
- **文件存储**: 内置文件存储服务
- **认证系统**: 内置用户认证
- **自动扩展**: 自动处理流量增长

## 📊 成本对比

| 服务 | 免费层 | 付费层 |
|------|--------|--------|
| Supabase | 500MB DB + 1GB 存储 | $25/月 |
| Vercel | 100GB 带宽 | $20/月 |
| **总计** | **完全免费** | **$45/月** |

## 🆚 与之前方案对比

| 特性 | Vercel+Railway+Cloudinary | Vercel+Supabase |
|------|---------------------------|-----------------|
| 成本 | $20+$5+$25 = $50/月 | $45/月 |
| 复杂度 | 3个平台 | 2个平台 |
| 文件存储 | 需要 Cloudinary | 内置 |
| 数据库 | 需要 Railway | 内置 |
| 实时功能 | 需要额外配置 | 内置 |
| 认证 | 需要自己实现 | 内置 |

## 🎯 推荐理由

1. **简化架构**: 减少平台数量
2. **降低成本**: 更便宜的方案
3. **更好集成**: 所有服务在一个平台
4. **实时功能**: 支持实时数据同步
5. **易于维护**: 更简单的部署流程
EOF

echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}  🎉 Supabase 部署配置完成！          ${NC}"
echo -e "${GREEN}=======================================${NC}"

echo -e "${BLUE}📝 下一步操作:${NC}"
echo -e "1. 访问 https://supabase.com 创建项目"
echo -e "2. 在 Supabase 控制台中运行数据库迁移"
echo -e "3. 配置环境变量"
echo -e "4. 运行 vercel --prod 部署"

echo -e "${YELLOW}💡 优势:${NC}"
echo -e "• 免费层支持 500MB 数据库 + 1GB 文件存储"
echo -e "• 内置文件存储和认证系统"
echo -e "• 支持实时数据同步"
echo -e "• 比之前方案更便宜更简单"

echo -e "${GREEN}=======================================${NC}"
