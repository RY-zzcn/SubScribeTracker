import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING,
    defaultValue: null
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {
      theme: 'light',
      currency: 'CNY',
      language: 'zh-CN',
      notifications: {
        email: true,
        push: true,
        reminderDays: [7, 3, 1]
      },
      customCategories: ['娱乐', '工作', '学习', '生活', '其他'],
      customCSS: ''
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    defaultValue: null
  }
}, {
  tableName: 'users',
  timestamps: true,
  paranoid: true, // 软删除
  indexes: [
    {
      unique: true,
      fields: ['email']
    }
  ]
})

export default User