import cron from 'node-cron'
import { Op } from 'sequelize'
import Subscription from '../models/Subscription.js'
import User from '../models/User.js'
import notificationManager, { initializeNotificationProviders, getNotificationConfig } from './notificationService.js'
import logger from '../utils/logger.js'

// 初始化通知提供者
initializeNotificationProviders(getNotificationConfig())

// 计算下次付款日期
function calculateNextPaymentDate(startDate, cycle) {
  const start = new Date(startDate)
  const now = new Date()
  
  let next = new Date(start)
  
  while (next <= now) {
    switch (cycle.unit) {
      case 'day':
        next.setDate(next.getDate() + cycle.value)
        break
      case 'week':
        next.setDate(next.getDate() + (cycle.value * 7))
        break
      case 'month':
        next.setMonth(next.getMonth() + cycle.value)
        break
      case 'year':
        next.setFullYear(next.getFullYear() + cycle.value)
        break
    }
  }
  
  return next
}

// 获取订阅的显示名称
function getSubscriptionDisplayName(subscription) {
  return subscription.name || '未命名订阅'
}

// 格式化货币
function formatCurrency(amount, currency = 'CNY') {
  const symbols = {
    CNY: '¥',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥'
  }
  
  const symbol = symbols[currency] || currency
  return `${symbol}${amount}`
}

// 格式化周期
function formatCycle(cycle) {
  const units = {
    day: '天',
    week: '周',
    month: '月',
    year: '年'
  }
  
  const unit = units[cycle.unit] || cycle.unit
  return cycle.value === 1 ? `每${unit}` : `每${cycle.value}${unit}`
}

// 生成提醒消息
function generateReminderMessage(subscription, daysUntilRenewal) {
  const name = getSubscriptionDisplayName(subscription)
  const price = formatCurrency(subscription.price, subscription.currency)
  const cycle = formatCycle(subscription.cycle)
  const nextPaymentDate = new Date(subscription.nextPaymentDate).toLocaleDateString('zh-CN')
  
  let timeText = ''
  if (daysUntilRenewal === 0) {
    timeText = '今天'
  } else if (daysUntilRenewal === 1) {
    timeText = '明天'
  } else {
    timeText = `${daysUntilRenewal}天后`
  }
  
  return `📋 订阅续费提醒

🔔 服务名称: ${name}
💰 订阅费用: ${price} (${cycle})
📅 续费日期: ${nextPaymentDate} (${timeText})
🏷️ 分类: ${subscription.category}

请及时处理订阅续费，避免服务中断。`
}

// 检查即将到期的订阅
async function checkUpcomingRenewals() {
  try {
    logger.info('开始检查即将到期的订阅')
    
    const now = new Date()
    const checkDate = new Date(now)
    checkDate.setDate(checkDate.getDate() + 7) // 检查未来7天的订阅
    
    // 查询即将到期的订阅
    const upcomingSubscriptions = await Subscription.findAll({
      where: {
        isActive: true,
        nextPaymentDate: {
          [Op.between]: [now.toISOString().split('T')[0], checkDate.toISOString().split('T')[0]]
        }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'name', 'settings']
      }]
    })
    
    logger.info(`找到 ${upcomingSubscriptions.length} 个即将到期的订阅`)
    
    for (const subscription of upcomingSubscriptions) {
      const user = subscription.user
      const nextPaymentDate = new Date(subscription.nextPaymentDate)
      const daysUntilRenewal = Math.ceil((nextPaymentDate - now) / (1000 * 60 * 60 * 24))
      
      // 检查用户的提醒设置
      const reminderDays = user.settings?.notifications?.reminderDays || [7, 3, 1]
      const today = now.toISOString().split('T')[0]
      
      // 检查是否应该发送提醒
      const shouldSendReminder = reminderDays.includes(daysUntilRenewal)
      const reminderKey = `${today}_${daysUntilRenewal}`
      const alreadySent = subscription.reminderSent && subscription.reminderSent[reminderKey]
      
      if (shouldSendReminder && !alreadySent) {
        logger.info(`为用户 ${user.email} 发送订阅 ${subscription.name} 的提醒 (${daysUntilRenewal}天)`)
        
        // 生成提醒消息
        const message = generateReminderMessage(subscription, daysUntilRenewal)
        
        // 发送通知
        const success = await notificationManager.sendToAll(message, {
          summary: `${subscription.name} 即将到期`,
          mentioned_list: [], // 企业微信@人员列表
          at: [] // 钉钉@人员列表
        })
        
        if (success) {
          // 更新提醒发送记录
          const updatedReminderSent = { ...subscription.reminderSent, [reminderKey]: true }
          await subscription.update({ reminderSent: updatedReminderSent })
          
          logger.info(`订阅 ${subscription.name} 的提醒发送成功`)
        } else {
          logger.error(`订阅 ${subscription.name} 的提醒发送失败`)
        }
      }
    }
    
    logger.info('订阅检查完成')
  } catch (error) {
    logger.error('检查订阅时发生错误:', error)
  }
}

// 更新过期订阅的下次付款日期
async function updateExpiredSubscriptions() {
  try {
    logger.info('开始更新过期订阅的下次付款日期')
    
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    // 查询已过期的订阅
    const expiredSubscriptions = await Subscription.findAll({
      where: {
        isActive: true,
        nextPaymentDate: {
          [Op.lt]: today
        }
      }
    })
    
    logger.info(`找到 ${expiredSubscriptions.length} 个过期订阅`)
    
    for (const subscription of expiredSubscriptions) {
      // 计算新的下次付款日期
      const newNextPaymentDate = calculateNextPaymentDate(subscription.startDate, subscription.cycle)
      
      await subscription.update({
        nextPaymentDate: newNextPaymentDate.toISOString().split('T')[0],
        reminderSent: {} // 清空提醒记录
      })
      
      logger.info(`更新订阅 ${subscription.name} 的下次付款日期为 ${newNextPaymentDate.toISOString().split('T')[0]}`)
    }
    
    logger.info('过期订阅更新完成')
  } catch (error) {
    logger.error('更新过期订阅时发生错误:', error)
  }
}

// 启动定时任务
export function startScheduledTasks() {
  // 每天早上 9:00 检查即将到期的订阅
  cron.schedule('0 9 * * *', async () => {
    logger.info('执行定时任务: 检查即将到期的订阅')
    await checkUpcomingRenewals()
  }, {
    timezone: 'Asia/Shanghai'
  })
  
  // 每天凌晨 2:00 更新过期订阅
  cron.schedule('0 2 * * *', async () => {
    logger.info('执行定时任务: 更新过期订阅')
    await updateExpiredSubscriptions()
  }, {
    timezone: 'Asia/Shanghai'
  })
  
  // 每小时检查一次 (开发和测试用)
  if (process.env.NODE_ENV === 'development') {
    cron.schedule('0 * * * *', async () => {
      logger.info('执行定时任务: 每小时检查 (开发模式)')
      await checkUpcomingRenewals()
    })
  }
  
  logger.info('定时任务启动成功')
}

// 手动触发检查 (供 API 调用)
export async function manualCheckRenewals() {
  await checkUpcomingRenewals()
  await updateExpiredSubscriptions()
}

// 测试通知发送
export async function testNotification(message = '这是一条测试消息') {
  return await notificationManager.sendToAll(message, {
    summary: '测试通知'
  })
}

export default {
  checkUpcomingRenewals,
  updateExpiredSubscriptions,
  startScheduledTasks,
  manualCheckRenewals,
  testNotification
}