import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'
import User from './User.js'

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'CNY'
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  cycle: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      unit: 'month',
      value: 1
    }
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATEONLY,
    defaultValue: null
  },
  nextPaymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  autoRenewal: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  reminderSent: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  website: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  icon: {
    type: DataTypes.STRING,
    defaultValue: ''
  }
}, {
  tableName: 'subscriptions',
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['nextPaymentDate']
    },
    {
      fields: ['isActive']
    }
  ]
})

// 定义关联关系
User.hasMany(Subscription, { foreignKey: 'userId', as: 'subscriptions' })
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' })

export default Subscription