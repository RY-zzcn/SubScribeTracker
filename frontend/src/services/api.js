import axios from 'axios'
import toast from 'react-hot-toast'

// 创建 axios 实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加全局请求头
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // 统一错误处理
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // 未授权，可能需要重新登录
          if (data.error?.includes('过期')) {
            toast.error('登录已过期，请重新登录')
            // 触发退出登录
            window.location.href = '/login'
          } else {
            toast.error(data.error || '认证失败')
          }
          break
          
        case 403:
          toast.error(data.error || '权限不足')
          break
          
        case 404:
          toast.error(data.error || '请求的资源不存在')
          break
          
        case 429:
          toast.error('请求过于频繁，请稍后再试')
          break
          
        case 500:
          toast.error('服务器错误，请稍后重试')
          break
          
        default:
          toast.error(data.error || '请求失败')
      }
    } else if (error.request) {
      // 网络错误
      toast.error('网络连接失败，请检查网络设置')
    } else {
      // 其他错误
      toast.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

export default api