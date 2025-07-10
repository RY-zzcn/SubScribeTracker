import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,

      // 登录
      login: async (email, password) => {
        try {
          const response = await api.post('/auth/login', { email, password })
          const { user, token } = response.data
          
          set({ 
            user, 
            token, 
            isAuthenticated: true,
            isLoading: false 
          })
          
          // 设置 API 默认 header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          return { success: true }
        } catch (error) {
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
            isLoading: false 
          })
          
          // 设置 API 默认 header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.error || '注册失败'
          return { success: false, error: message }
        }
      },

      // 验证 token
      verifyToken: async () => {
        const { token } = get()
        
        if (!token) {
          set({ isLoading: false, isAuthenticated: false })
          return false
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
            isLoading: false 
          })
          
          delete api.defaults.headers.common['Authorization']
          return false
        }
      },

      // 刷新 token
      refreshToken: async () => {
        const { token } = get()
        
        if (!token) return false
        
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
          isLoading: false 
        })
        
        // 清除 API header
        delete api.defaults.headers.common['Authorization']
        
        // 调用后端退出接口
        api.post('/auth/logout').catch(() => {
          // 忽略错误，因为用户已经退出
        })
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
        user: state.user 
      })
    }
  )
)

// 初始化认证状态
useAuthStore.getState().initialize()