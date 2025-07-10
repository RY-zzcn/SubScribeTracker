import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useAuthStore } from '../stores/authStore'

export default function Register() {
  const [loading, setLoading] = useState(false)
  const { register: registerUser } = useAuthStore()
  const navigate = useNavigate()
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const result = await registerUser(data.name, data.email, data.password)
      if (result.success) {
        toast.success('注册成功！')
        navigate('/')
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gradient">SubScribe</h1>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            创建新账户
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            已有账户？{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              立即登录
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="name" className="sr-only">
              姓名
            </label>
            <input
              {...register('name', { 
                required: '请输入姓名',
                minLength: {
                  value: 2,
                  message: '姓名至少2个字符'
                }
              })}
              type="text"
              className="input"
              placeholder="姓名"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="sr-only">
              邮箱地址
            </label>
            <input
              {...register('email', { 
                required: '请输入邮箱地址',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: '请输入有效的邮箱地址'
                }
              })}
              type="email"
              className="input"
              placeholder="邮箱地址"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="password" className="sr-only">
              密码
            </label>
            <input
              {...register('password', { 
                required: '请输入密码',
                minLength: {
                  value: 6,
                  message: '密码至少6个字符'
                }
              })}
              type="password"
              className="input"
              placeholder="密码"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="sr-only">
              确认密码
            </label>
            <input
              {...register('confirmPassword', { 
                required: '请确认密码',
                validate: value => value === password || '两次输入的密码不一致'
              })}
              type="password"
              className="input"
              placeholder="确认密码"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner mr-2"></div>
                  注册中...
                </div>
              ) : (
                '注册'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}