import logger from '../utils/logger.js'

export function errorHandler(err, req, res, next) {
  // 记录错误详情
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  })

  // 开发环境返回详细错误信息
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({
      error: '服务器内部错误',
      message: err.message,
      stack: err.stack
    })
  }

  // 生产环境只返回通用错误信息
  res.status(500).json({
    error: '服务器内部错误，请稍后重试'
  })
}