import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Joi from 'joi'
import User from '../models/User.js'
import logger from '../utils/logger.js'

const router = express.Router()

// 验证模式
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required()
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
})

// 注册
router.post('/register', async (req, res) => {
  try {
    // 验证输入
    const { error, value } = registerSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ 
        error: error.details[0].message 
      })
    }

    const { name, email, password } = value

    // 检查用户是否已存在
    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ 
        error: '该邮箱已被注册' 
      })
    }

    // 加密密码
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // 创建用户
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    })

    // 生成 JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    // 返回用户信息 (不包含密码)
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      settings: user.settings,
      createdAt: user.createdAt
    }

    logger.info(`新用户注册: ${email}`)

    res.status(201).json({
      message: '注册成功',
      user: userResponse,
      token
    })
  } catch (error) {
    logger.error('注册失败:', error)
    res.status(500).json({ 
      error: '服务器内部错误' 
    })
  }
})

// 登录
router.post('/login', async (req, res) => {
  try {
    // 验证输入
    const { error, value } = loginSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ 
        error: error.details[0].message 
      })
    }

    const { email, password } = value

    // 查找用户
    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(401).json({ 
        error: '邮箱或密码错误' 
      })
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: '邮箱或密码错误' 
      })
    }

    // 检查账户状态
    if (!user.isActive) {
      return res.status(401).json({ 
        error: '账户已被禁用' 
      })
    }

    // 更新最后登录时间
    await user.update({ lastLoginAt: new Date() })

    // 生成 JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    // 返回用户信息 (不包含密码)
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      settings: user.settings,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    }

    logger.info(`用户登录: ${email}`)

    res.json({
      message: '登录成功',
      user: userResponse,
      token
    })
  } catch (error) {
    logger.error('登录失败:', error)
    res.status(500).json({ 
      error: '服务器内部错误' 
    })
  }
})

// 验证 token
router.post('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ 
        error: '未提供认证令牌' 
      })
    }

    // 验证 JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // 查找用户
    const user = await User.findByPk(decoded.userId)
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: '用户不存在或已被禁用' 
      })
    }

    // 返回用户信息
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      settings: user.settings,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    }

    res.json({
      valid: true,
      user: userResponse
    })
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: '认证令牌无效或已过期' 
      })
    }
    
    logger.error('令牌验证失败:', error)
    res.status(500).json({ 
      error: '服务器内部错误' 
    })
  }
})

// 刷新 token
router.post('/refresh', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ 
        error: '未提供认证令牌' 
      })
    }

    // 验证 JWT (允许过期)
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true })
    
    // 查找用户
    const user = await User.findByPk(decoded.userId)
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: '用户不存在或已被禁用' 
      })
    }

    // 生成新的 JWT
    const newToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      message: '令牌刷新成功',
      token: newToken
    })
  } catch (error) {
    logger.error('令牌刷新失败:', error)
    res.status(401).json({ 
      error: '令牌刷新失败' 
    })
  }
})

// 退出登录 (客户端处理，服务端记录日志)
router.post('/logout', (req, res) => {
  // 在实际应用中，可以将 token 加入黑名单
  // 这里只是记录日志
  logger.info('用户退出登录')
  
  res.json({
    message: '退出登录成功'
  })
})

export default router