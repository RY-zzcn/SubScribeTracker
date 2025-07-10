import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api.js'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,
      isDemoMode: false,

      // 演示登录模式
      demoLogin: (email, password) => {
        const demoUsers = [
          { 
            email: 'admin@subscribetracker.com', 
            password: 'admin123', 
            name: '管理员',
            role: 'admin'
          },
          { 
            email: 'demo@example.com', 
            password: 'demo123', 
            name: '演示用户',
            role: 'user'
          }
        ]

        const user = demoUsers.find(u => u.email === email && u.password === password)
        
        if (!user) {
          return { success: false, error: '邮箱或密码错误' }
        }

        const userResponse = {
          id: Date.now(),
          name: user.name,
          email: user.email,
          role: user.role,
          settings: {
            theme: 'light',
            currency: 'CNY',
            notifications: { email: true, push: true, reminderDays: [7, 3, 1] },
            customCategories: ['娱乐', '工作', '学习', '生活', '其他']
          },
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }

        const token = btoa(JSON.stringify({ userId: userResponse.id, email: userResponse.email }))

        set({ 
          user: userResponse, 
          token, 
          isAuthenticated: true,
          isLoading: false,
          isDemoMode: true
        })

        return { success: true }
      },

      // 登录
      login: async (email, password) => {
        try {
          const response = await api.post('/auth/login', { email, password })
          const { user, token } = response.data
          
          set({ 
            user, 
            token, 
            isAuthenticated: true,
            isLoading: false,
            isDemoMode: false
          })
          
          // 设置 API 默认 header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          return { success: true }
        } catch (error) {
          // 如果 API 不可用，尝试演示模式
          if (error.message?.includes('网络连接失败') || error.code === 'NETWORK_ERROR') {
            console.warn('API 不可用，切换到演示模式')
            return get().demoLogin(email, password)
          }
          
          const message = error.response?.data?.error || '登录失败'
          return { success: false, error: message }
        }
      },

      // 注册
      register: async (name, email, password) => {
        try {
          const response = await api.post('/auth/register', { name, email, password })
          const { user, token } = response.data
          
          set({ 
            user, 
            token, 
            isAuthenticated: true,
            isLoading: false,
            isDemoMode: false
          })
          
          // 设置 API 默认 header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          return { success: true }
        } catch (error) {
          // 如果 API 不可用，自动创建演示账号
          if (error.message?.includes('网络连接失败') || error.code === 'NETWORK_ERROR') {
            console.warn('API 不可用，创建演示账号')
            
            const userResponse = {
              id: Date.now(),
              name,
              email,
              role: 'user',
              settings: {
                theme: 'light',
                currency: 'CNY',
                notifications: { email: true, push: true, reminderDays: [7, 3, 1] },
                customCategories: ['娱乐', '工作', '学习', '生活', '其他']
              },
              createdAt: new Date().toISOString()
            }

            const token = btoa(JSON.stringify({ userId: userResponse.id, email: userResponse.email }))

            set({ 
              user: userResponse, 
              token, 
              isAuthenticated: true,
              isLoading: false,
              isDemoMode: true
            })

            return { success: true }
          }
          
          const message = error.response?.data?.error || '注册失败'
          return { success: false, error: message }
        }
      },

      // 验证 token
      verifyToken: async () => {
        const { token, isDemoMode } = get()
        
        if (!token) {
          set({ isLoading: false, isAuthenticated: false })
          return false
        }
        
        // 演示模式直接验证
        if (isDemoMode) {
          try {
            const decoded = JSON.parse(atob(token))
            const user = {
              id: decoded.userId,
              name: '演示用户',
              email: decoded.email,
              settings: {
                theme: 'light',
                currency: 'CNY',
                notifications: { email: true, push: true, reminderDays: [7, 3, 1] },
                customCategories: ['娱乐', '工作', '学习', '生活', '其他']
              }
            }
            
            set({ 
              user, 
              isAuthenticated: true,
              isLoading: false 
            })
            
            return true
          } catch (error) {
            set({ 
              user: null, 
              token: null, 
              isAuthenticated: false,
              isLoading: false,
              isDemoMode: false
            })
            return false
          }
        }
        
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          const response = await api.post('/auth/verify')
          const { user } = response.data
          
          set({ 
            user, 
            isAuthenticated: true,
            isLoading: false 
          })
          
          return true
        } catch (error) {
          // Token 无效，清除存储的认证信息
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false,
            isLoading: false,
            isDemoMode: false
          })
          
          delete api.defaults.headers.common['Authorization']
          return false
        }
      },

      // 刷新 token
      refreshToken: async () => {
        const { token, isDemoMode } = get()
        
        if (!token) return false
        
        // 演示模式不需要刷新
        if (isDemoMode) return true
        
        try {
          const response = await api.post('/auth/refresh')
          const { token: newToken } = response.data
          
          set({ token: newToken })
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
          
          return true
        } catch (error) {
          // 刷新失败，退出登录
          get().logout()
          return false
        }
      },

      // 更新用户信息
      updateUser: (userData) => {
        set(state => ({
          user: { ...state.user, ...userData }
        }))
      },

      // 退出登录
      logout: () => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          isLoading: false,
          isDemoMode: false
        })
        
        // 清除 API header
        delete api.defaults.headers.common['Authorization']
        
        // 调用后端退出接口（如果不是演示模式）
        if (!get().isDemoMode) {
          api.post('/auth/logout').catch(() => {
            // 忽略错误，因为用户已经退出
          })
        }
      },

      // 初始化
      initialize: async () => {
        const { token } = get()
        
        if (token) {
          await get().verifyToken()
        } else {
          set({ isLoading: false })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user,
        isDemoMode: state.isDemoMode
      })
    }
  )
)

// 初始化认证状态
useAuthStore.getState().initialize()