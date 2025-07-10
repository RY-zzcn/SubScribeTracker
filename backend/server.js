import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// 路由导入
import authRoutes from './src/routes/auth.js'
import subscriptionRoutes from './src/routes/subscriptions.js'
import userRoutes from './src/routes/users.js'
import notificationRoutes from './src/routes/notifications.js'
import aiRoutes from './src/routes/ai.js'

// 中间件和工具
import { errorHandler } from './src/middleware/errorHandler.js'
import { authenticateToken } from './src/middleware/auth.js'
import { initDatabase } from './src/config/database.js'
import { startScheduledTasks } from './src/services/scheduler.js'
import logger from './src/utils/logger.js'

// 配置
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"]
    }
  }
}))

// CORS 配置
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com', 'https://your-domain.vercel.app']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}))

// 压缩
app.use(compression())

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 每个 IP 限制 100 个请求
  message: { error: '请求过于频繁，请稍后再试' }
})
app.use('/api/', limiter)

// 严格的 API 速率限制
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 认证相关接口更严格
  message: { error: '登录/注册请求过于频繁，请稍后再试' }
})
app.use('/api/auth/', strictLimiter)

// 解析 JSON
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 请求日志
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })
  next()
})

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  })
})

// API 路由
app.use('/api/auth', authRoutes)
app.use('/api/subscriptions', authenticateToken, subscriptionRoutes)
app.use('/api/users', authenticateToken, userRoutes)
app.use('/api/notifications', authenticateToken, notificationRoutes)
app.use('/api/ai', authenticateToken, aiRoutes)

// 静态文件服务 (生产环境)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../frontend/dist')))
  
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../frontend/dist/index.html'))
  })
}

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' })
})

// 错误处理中间件
app.use(errorHandler)

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库
    await initDatabase()
    logger.info('数据库连接成功')
    
    // 启动定时任务
    startScheduledTasks()
    logger.info('定时任务启动成功')
    
    // 启动服务器
    app.listen(PORT, () => {
      logger.info(`服务器运行在端口 ${PORT}`)
      logger.info(`环境: ${process.env.NODE_ENV || 'development'}`)
    })
  } catch (error) {
    logger.error('服务器启动失败:', error)
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGINT', () => {
  logger.info('收到 SIGINT 信号，正在关闭服务器...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  logger.info('收到 SIGTERM 信号，正在关闭服务器...')
  process.exit(0)
})

process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的 Promise 拒绝:', reason)
  process.exit(1)
})

startServer()

export default app