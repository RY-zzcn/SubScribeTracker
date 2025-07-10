# 快速部署解决方案

## 当前状态
✅ 前端已部署到 Cloudflare Pages  
❌ 后端 API 还未部署

## 演示账号
由于后端 API 未部署，可以使用以下演示账号：

**管理员账号：**
- 邮箱：`admin@subscribetracker.com`
- 密码：`admin123`

**普通用户：**
- 邮箱：`demo@example.com`
- 密码：`demo123`

## 完整部署步骤

### 方法一：部署 Cloudflare Workers API（推荐）

1. **安装 Wrangler CLI**
```bash
npm install -g wrangler
wrangler login
```

2. **部署 API Worker**
```bash
# 在项目根目录执行
wrangler deploy --config wrangler.worker.toml
```

3. **配置路由**
在 Cloudflare Dashboard 中：
- 进入 Workers & Pages
- 添加自定义域名路由：`your-domain.com/api/*`

### 方法二：使用现有的后端服务

1. **部署到 Vercel**（包含完整后端）
```bash
vercel --prod
```

2. **部署到传统 VPS**
```bash
chmod +x deploy/deploy.sh
sudo ./deploy/deploy.sh
```

### 方法三：本地开发测试

1. **启动完整开发环境**
```bash
npm run install:all
npm run dev
```

2. **访问本地应用**
- 前端：http://localhost:3000
- 后端：http://localhost:3001

## 环境变量配置

创建 `.env` 文件：
```env
JWT_SECRET=your-super-secret-jwt-key
DATABASE_URL=sqlite:./data/database.sqlite
GEMINI_API_KEY=your-gemini-api-key
WECHAT_WEBHOOK_URL=your-wechat-webhook-url
DINGTALK_WEBHOOK_URL=your-dingtalk-webhook-url
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
WXPUSHER_APP_TOKEN=your-wxpusher-app-token
```

## 注意事项

1. **Cloudflare Pages** 只部署静态前端，需要单独部署 API
2. **Vercel** 可以同时部署前端和后端
3. **完整功能** 需要后端 API 支持数据库和通知服务

## 推荐部署方案

**生产环境：** Vercel（一键部署，包含前后端）  
**测试环境：** Cloudflare Pages + Workers  
**本地开发：** npm run dev