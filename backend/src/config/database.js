import { Sequelize } from 'sequelize'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import logger from '../utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 数据库配置
const getDatabaseConfig = () => {
  const databaseUrl = process.env.DATABASE_URL

  if (databaseUrl) {
    // 生产环境或自定义数据库
    if (databaseUrl.startsWith('postgres')) {
      return {
        dialect: 'postgres',
        url: databaseUrl,
        dialectOptions: {
          ssl: process.env.NODE_ENV === 'production' ? {
            require: true,
            rejectUnauthorized: false
          } : false
        }
      }
    }
  }

  // 默认 SQLite 配置
  return {
    dialect: 'sqlite',
    storage: join(__dirname, '../../data/database.sqlite'),
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  }
}

// 创建 Sequelize 实例
const config = getDatabaseConfig()
const sequelize = config.url 
  ? new Sequelize(config.url, config)
  : new Sequelize({
      dialect: config.dialect,
      storage: config.storage,
      logging: config.logging,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    })

// 测试数据库连接
export async function testConnection() {
  try {
    await sequelize.authenticate()
    logger.info('数据库连接成功')
    return true
  } catch (error) {
    logger.error('数据库连接失败:', error)
    return false
  }
}

// 初始化数据库
export async function initDatabase() {
  try {
    // 创建表
    await sequelize.sync({ alter: true })
    logger.info('数据库表同步成功')
  } catch (error) {
    logger.error('数据库初始化失败:', error)
    throw error
  }
}

export default sequelize