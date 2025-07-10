import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  HomeIcon, 
  CreditCardIcon, 
  CogIcon, 
  UserIcon,
  LogOutIcon
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

const navigation = [
  { name: '仪表盘', href: '/', icon: HomeIcon },
  { name: '订阅管理', href: '/subscriptions', icon: CreditCardIcon },
  { name: '设置', href: '/settings', icon: CogIcon },
  { name: '个人资料', href: '/profile', icon: UserIcon },
]

export default function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="w-64 bg-white shadow-lg h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gradient">SubScribe</h1>
        <p className="text-sm text-gray-500 mt-1">订阅管理平台</p>
      </div>
      
      <nav className="mt-6">
        <div className="px-3">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 transition-colors
                  ${isActive 
                    ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <item.icon 
                  className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-500' : 'text-gray-400'}`} 
                />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="absolute bottom-0 w-full p-4 border-t">
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
        >
          <LogOutIcon className="mr-3 h-4 w-4" />
          退出登录
        </button>
      </div>
    </div>
  )
}