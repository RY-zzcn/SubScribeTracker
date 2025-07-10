import React from 'react'
import { 
  CreditCardIcon, 
  TrendingUpIcon, 
  CalendarIcon,
  DollarSignIcon 
} from 'lucide-react'

export default function Dashboard() {
  // 模拟数据
  const stats = [
    {
      name: '本月支出',
      value: '¥1,234',
      change: '+12%',
      changeType: 'increase',
      icon: DollarSignIcon
    },
    {
      name: '年度支出',
      value: '¥14,808',
      change: '+8%',
      changeType: 'increase',
      icon: TrendingUpIcon
    },
    {
      name: '活跃订阅',
      value: '8',
      change: '+2',
      changeType: 'increase',
      icon: CreditCardIcon
    },
    {
      name: '即将到期',
      value: '3',
      change: '本周',
      changeType: 'neutral',
      icon: CalendarIcon
    }
  ]

  const upcomingRenewals = [
    { name: 'Netflix', amount: '¥78', daysLeft: 3, category: '娱乐' },
    { name: 'Spotify', amount: '¥15', daysLeft: 5, category: '音乐' },
    { name: 'GitHub Pro', amount: '$4', daysLeft: 7, category: '工作' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
        <p className="text-gray-600">查看您的订阅概况和支出统计</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <div className="mt-4">
                <span className={`text-sm ${
                  stat.changeType === 'increase' 
                    ? 'text-green-600' 
                    : stat.changeType === 'decrease'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">较上月</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 即将到期 */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">即将到期</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {upcomingRenewals.map((renewal, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{renewal.name}</p>
                    <p className="text-sm text-gray-500">{renewal.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{renewal.amount}</p>
                    <p className="text-sm text-orange-600">{renewal.daysLeft}天后</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 支出分类 */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">支出分类</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {[
                { category: '娱乐', amount: '¥468', percentage: 38 },
                { category: '工作', amount: '¥356', percentage: 29 },
                { category: '学习', amount: '¥234', percentage: 19 },
                { category: '生活', amount: '¥176', percentage: 14 }
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.category}</span>
                    <span className="font-medium">{item.amount}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full" 
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}