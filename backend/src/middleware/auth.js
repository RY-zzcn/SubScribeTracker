import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import logger from '../utils/logger.js'

// JWT 认证中间件
export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: '访问被拒绝，需要认证令牌' 
      })
    }

    // 验证 JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // 查找用户
    const user = await User.findByPk(decoded.userId)
    if (!user) {
      return res.status(401).json({ 
        error: '用户不存在' 
      })
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        error: '账户已被禁用' 
      })
    }

    // 将用户信息添加到请求对象
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      settings: user.settings
    }

    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        error: '认证令牌无效' 
      })
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        error: '认证令牌已过期' 
      })
    }

    logger.error('认证中间件错误:', error)
    res.status(500).json({ 
      error: '服务器内部错误' 
    })
  }
}

// 可选认证中间件 (不强制要求认证)
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findByPk(decoded.userId)
      
      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          settings: user.settings
        }
      }
    }

    next()
  } catch (error) {
    // 认证失败但不阻止请求继续
    next()
  }
}

// 管理员权限检查中间件
export function requireAdmin(req, res, next) {
  if (!req.user || !req.user.settings?.isAdmin) {
    return res.status(403).json({ 
      error: '需要管理员权限' 
    })
  }
  next()
}

// 资源所有者检查中间件
export function requireOwnership(resourceUserIdField = 'userId') {
  return (req, res, next) => {
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField]
    
    if (!req.user) {
      return res.status(401).json({ 
        error: '需要认证' 
      })
    }
    
    if (req.user.id !== parseInt(resourceUserId) && !req.user.settings?.isAdmin) {
      return res.status(403).json({ 
        error: '访问被拒绝，只能访问自己的资源' 
      })
    }
    
    next()
  }
}