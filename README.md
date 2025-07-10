# SubScribe - 订阅管理平台

<div align="center">

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FRY-zzcn%2FSubScribeTracker&env=JWT_SECRET,GEMINI_API_KEY&envDescription=Required%20environment%20variables%20for%20SubScribe&envLink=https%3A%2F%2Fgithub.com%2FRY-zzcn%2FSubScribeTracker%23environment-variables)

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/RY-zzcn/SubScribeTracker)

![Version](https://img.shields.io/github/v/release/RY-zzcn/SubScribeTracker)
![License](https://img.shields.io/github/license/RY-zzcn/SubScribeTracker)
![Stars](https://img.shields.io/github/stars/RY-zzcn/SubScribeTracker)

</div>

## 🚀 功能特性

- **💳 订阅管理**: 完整的 CRUD 功能，支持自定义周期和分类
- **📊 智能仪表盘**: 直观的数据可视化和支出分析
- **🔔 多渠道通知**: 支持企业微信、钉钉、Telegram、WX Pusher 等
- **🤖 AI 消费洞察**: 集成 Gemini API 提供智能消费建议
- **🎨 高度可定制**: 自定义分类、标签和界面主题
- **🔐 数据安全**: 用户认证和数据隔离
- **☁️ 多种部署**: 支持 Vercel、Cloudflare、Docker 等多种部署方式

## 🎯 一键部署

### Vercel 部署
点击上方按钮一键部署到 Vercel，或手动执行：

```bash
# Fork 本仓库后
vercel --prod
```

### Cloudflare Pages 部署
点击上方按钮一键部署到 Cloudflare Pages，或手动执行：

```bash
# 使用 Wrangler CLI
wrangler pages deploy frontend/dist --project-name=subscribetracker
```

### Docker 部署
```bash
# 克隆仓库
git clone https://github.com/RY-zzcn/SubScribeTracker.git
cd SubScribeTracker

# 使用 Docker Compose
docker-compose up -d
```

### 传统部署
```bash
# 克隆仓库
git clone https://github.com/RY-zzcn/SubScribeTracker.git
cd SubScribeTracker

# 安装依赖
npm run install:all

# 构建项目
npm run build

# 启动服务
npm start
```

## ⚙️ 环境变量

| 变量名 | 描述 | 必需 | 默认值 |
|--------|------|------|--------|
| `JWT_SECRET` | JWT 签名密钥 | ✅ | - |
| `DATABASE_URL` | 数据库连接 URL | ❌ | `sqlite:./database.sqlite` |
| `GEMINI_API_KEY` | Gemini AI API 密钥 | ❌ | - |
| `WECHAT_WEBHOOK_URL` | 企业微信 Webhook URL | ❌ | - |
| `DINGTALK_WEBHOOK_URL` | 钉钉 Webhook URL | ❌ | - |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token | ❌ | - |
| `WXPUSHER_APP_TOKEN` | WX Pusher App Token | ❌ | - |

## 🏗️ 本地开发

```bash
# 克隆项目
git clone https://github.com/RY-zzcn/SubScribeTracker.git
cd SubScribeTracker

# 安装依赖
npm run install:all

# 启动开发服务器
npm run dev
```

## 📁 项目结构

```
SubScribeTracker/
├── frontend/              # React 前端
│   ├── src/
│   │   ├── components/    # 组件
│   │   ├── pages/         # 页面
│   │   ├── services/      # API 服务
│   │   └── stores/        # 状态管理
│   ├── package.json
│   └── vite.config.js
├── backend/               # Node.js 后端
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # 路由
│   │   ├── services/      # 服务层
│   │   └── utils/         # 工具函数
│   ├── package.json
│   └── server.js
├── api/                   # Vercel Functions
├── functions/             # Cloudflare Functions
├── docker/                # Docker 配置
├── deploy/                # 部署脚本
├── vercel.json           # Vercel 配置
├── wrangler.toml         # Cloudflare 配置
└── docker-compose.yml    # Docker Compose
```

## 🔧 配置说明

### 通知渠道配置

#### 企业微信
1. 创建企业微信机器人
2. 获取 Webhook URL
3. 设置环境变量 `WECHAT_WEBHOOK_URL`

#### 钉钉
1. 创建钉钉机器人
2. 获取 Webhook URL
3. 设置环境变量 `DINGTALK_WEBHOOK_URL`

#### Telegram
1. 创建 Telegram Bot
2. 获取 Bot Token
3. 设置环境变量 `TELEGRAM_BOT_TOKEN`

#### WX Pusher
1. 注册 WX Pusher 账号
2. 获取 App Token
3. 设置环境变量 `WXPUSHER_APP_TOKEN`

## 🤖 AI 功能

集成 Google Gemini API 提供：
- 智能消费分析
- 订阅优化建议
- 消费趋势预测
- 预算规划建议

## 🛠️ 技术栈

- **前端**: React 18 + Vite + Tailwind CSS
- **后端**: Node.js + Express + JWT
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **部署**: Vercel / Cloudflare Pages / Docker
- **AI**: Google Gemini API

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 🙏 致谢

感谢所有贡献者和开源社区的支持！

---

<div align="center">
  <p>如果这个项目对您有帮助，请给一个 ⭐️ Star！</p>
</div>