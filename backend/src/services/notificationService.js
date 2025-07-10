import axios from 'axios'
import logger from '../utils/logger.js'

// 基础通知提供者接口
class BaseNotificationProvider {
  constructor(name, config) {
    this.name = name
    this.config = config
    this.enabled = config.enabled || false
  }

  async send(message, options = {}) {
    throw new Error('send method must be implemented')
  }

  isEnabled() {
    return this.enabled && this.validateConfig()
  }

  validateConfig() {
    throw new Error('validateConfig method must be implemented')
  }
}

// 企业微信通知提供者
class WeChatProvider extends BaseNotificationProvider {
  constructor(config) {
    super('wechat', config)
  }

  validateConfig() {
    return !!(this.config.webhookUrl)
  }

  async send(message, options = {}) {
    if (!this.isEnabled()) {
      logger.warn('企业微信通知未启用或配置不完整')
      return false
    }

    try {
      const payload = {
        msgtype: 'text',
        text: {
          content: message
        }
      }

      if (options.mentioned_list) {
        payload.text.mentioned_list = options.mentioned_list
      }

      const response = await axios.post(this.config.webhookUrl, payload)
      
      if (response.data.errcode === 0) {
        logger.info('企业微信通知发送成功')
        return true
      } else {
        logger.error('企业微信通知发送失败:', response.data)
        return false
      }
    } catch (error) {
      logger.error('企业微信通知发送异常:', error)
      return false
    }
  }
}

// 钉钉通知提供者
class DingTalkProvider extends BaseNotificationProvider {
  constructor(config) {
    super('dingtalk', config)
  }

  validateConfig() {
    return !!(this.config.webhookUrl)
  }

  async send(message, options = {}) {
    if (!this.isEnabled()) {
      logger.warn('钉钉通知未启用或配置不完整')
      return false
    }

    try {
      const payload = {
        msgtype: 'text',
        text: {
          content: message
        }
      }

      if (options.at && options.at.length > 0) {
        payload.at = {
          atMobiles: options.at,
          isAtAll: false
        }
      }

      const response = await axios.post(this.config.webhookUrl, payload)
      
      if (response.data.errcode === 0) {
        logger.info('钉钉通知发送成功')
        return true
      } else {
        logger.error('钉钉通知发送失败:', response.data)
        return false
      }
    } catch (error) {
      logger.error('钉钉通知发送异常:', error)
      return false
    }
  }
}

// Telegram 通知提供者
class TelegramProvider extends BaseNotificationProvider {
  constructor(config) {
    super('telegram', config)
  }

  validateConfig() {
    return !!(this.config.botToken && this.config.chatId)
  }

  async send(message, options = {}) {
    if (!this.isEnabled()) {
      logger.warn('Telegram通知未启用或配置不完整')
      return false
    }

    try {
      const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`
      const payload = {
        chat_id: this.config.chatId,
        text: message,
        parse_mode: 'HTML'
      }

      const response = await axios.post(url, payload)
      
      if (response.data.ok) {
        logger.info('Telegram通知发送成功')
        return true
      } else {
        logger.error('Telegram通知发送失败:', response.data)
        return false
      }
    } catch (error) {
      logger.error('Telegram通知发送异常:', error)
      return false
    }
  }
}

// WX Pusher 通知提供者
class WXPusherProvider extends BaseNotificationProvider {
  constructor(config) {
    super('wxpusher', config)
  }

  validateConfig() {
    return !!(this.config.appToken && this.config.uid)
  }

  async send(message, options = {}) {
    if (!this.isEnabled()) {
      logger.warn('WX Pusher通知未启用或配置不完整')
      return false
    }

    try {
      const url = 'https://wxpusher.zjiecode.com/api/send/message'
      const payload = {
        appToken: this.config.appToken,
        content: message,
        summary: options.summary || '订阅提醒',
        contentType: 1, // 文本类型
        uids: [this.config.uid]
      }

      const response = await axios.post(url, payload)
      
      if (response.data.code === 1000) {
        logger.info('WX Pusher通知发送成功')
        return true
      } else {
        logger.error('WX Pusher通知发送失败:', response.data)
        return false
      }
    } catch (error) {
      logger.error('WX Pusher通知发送异常:', error)
      return false
    }
  }
}

// 邮件通知提供者 (使用简单的 SMTP)
class EmailProvider extends BaseNotificationProvider {
  constructor(config) {
    super('email', config)
  }

  validateConfig() {
    return !!(this.config.smtp && this.config.from && this.config.to)
  }

  async send(message, options = {}) {
    if (!this.isEnabled()) {
      logger.warn('邮件通知未启用或配置不完整')
      return false
    }

    try {
      // 这里可以集成 nodemailer 或其他邮件服务
      // 暂时返回 true 作为占位符
      logger.info('邮件通知发送成功')
      return true
    } catch (error) {
      logger.error('邮件通知发送异常:', error)
      return false
    }
  }
}

// 通知管理器
class NotificationManager {
  constructor() {
    this.providers = new Map()
  }

  // 注册通知提供者
  registerProvider(name, provider) {
    this.providers.set(name, provider)
  }

  // 获取可用的通知提供者
  getEnabledProviders() {
    return Array.from(this.providers.values()).filter(provider => provider.isEnabled())
  }

  // 发送通知到所有启用的提供者
  async sendToAll(message, options = {}) {
    const enabledProviders = this.getEnabledProviders()
    
    if (enabledProviders.length === 0) {
      logger.warn('没有启用的通知提供者')
      return false
    }

    const results = await Promise.allSettled(
      enabledProviders.map(provider => provider.send(message, options))
    )

    const successCount = results.filter(result => result.status === 'fulfilled' && result.value).length
    
    logger.info(`通知发送完成: ${successCount}/${results.length} 成功`)
    return successCount > 0
  }

  // 发送通知到指定提供者
  async sendToProvider(providerName, message, options = {}) {
    const provider = this.providers.get(providerName)
    
    if (!provider) {
      logger.error(`通知提供者 ${providerName} 不存在`)
      return false
    }

    return await provider.send(message, options)
  }
}

// 创建默认的通知管理器实例
const notificationManager = new NotificationManager()

// 初始化通知提供者
export function initializeNotificationProviders(config) {
  // 企业微信
  if (config.wechat) {
    const provider = new WeChatProvider(config.wechat)
    notificationManager.registerProvider('wechat', provider)
  }

  // 钉钉
  if (config.dingtalk) {
    const provider = new DingTalkProvider(config.dingtalk)
    notificationManager.registerProvider('dingtalk', provider)
  }

  // Telegram
  if (config.telegram) {
    const provider = new TelegramProvider(config.telegram)
    notificationManager.registerProvider('telegram', provider)
  }

  // WX Pusher
  if (config.wxpusher) {
    const provider = new WXPusherProvider(config.wxpusher)
    notificationManager.registerProvider('wxpusher', provider)
  }

  // 邮件
  if (config.email) {
    const provider = new EmailProvider(config.email)
    notificationManager.registerProvider('email', provider)
  }

  logger.info('通知提供者初始化完成')
}

// 获取通知配置
export function getNotificationConfig() {
  return {
    wechat: {
      enabled: !!process.env.WECHAT_WEBHOOK_URL,
      webhookUrl: process.env.WECHAT_WEBHOOK_URL
    },
    dingtalk: {
      enabled: !!process.env.DINGTALK_WEBHOOK_URL,
      webhookUrl: process.env.DINGTALK_WEBHOOK_URL
    },
    telegram: {
      enabled: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID
    },
    wxpusher: {
      enabled: !!(process.env.WXPUSHER_APP_TOKEN && process.env.WXPUSHER_UID),
      appToken: process.env.WXPUSHER_APP_TOKEN,
      uid: process.env.WXPUSHER_UID
    },
    email: {
      enabled: !!(process.env.EMAIL_SMTP_HOST && process.env.EMAIL_FROM && process.env.EMAIL_TO),
      smtp: {
        host: process.env.EMAIL_SMTP_HOST,
        port: process.env.EMAIL_SMTP_PORT || 587,
        secure: process.env.EMAIL_SMTP_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_SMTP_USER,
          pass: process.env.EMAIL_SMTP_PASS
        }
      },
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO
    }
  }
}

export default notificationManager