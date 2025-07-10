# Cloudflare Workers API 入口文件
# 用于处理后端 API 请求

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    
    // 处理 CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    // 处理 OPTIONS 请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // 简单的演示 API 响应
    if (url.pathname.startsWith('/api/')) {
      const path = url.pathname.replace('/api', '')
      
      try {
        // 注册接口
        if (path === '/auth/register' && request.method === 'POST') {
          const body = await request.json()
          
          // 简单验证
          if (!body.name || !body.email || !body.password) {
            return new Response(JSON.stringify({ error: '请填写所有必填字段' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          // 模拟注册成功
          const user = {
            id: Date.now(),
            name: body.name,
            email: body.email,
            settings: {
              theme: 'light',
              currency: 'CNY',
              notifications: { email: true, push: true, reminderDays: [7, 3, 1] },
              customCategories: ['娱乐', '工作', '学习', '生活', '其他']
            },
            createdAt: new Date().toISOString()
          }

          // 生成简单的 token (生产环境需要使用真正的 JWT)
          const token = btoa(JSON.stringify({ userId: user.id, email: user.email }))

          return new Response(JSON.stringify({
            message: '注册成功',
            user,
            token
          }), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // 登录接口
        if (path === '/auth/login' && request.method === 'POST') {
          const body = await request.json()
          
          // 演示账号
          const demoUsers = [
            { email: 'admin@subscribetracker.com', password: 'admin123', name: '管理员' },
            { email: 'demo@example.com', password: 'demo123', name: '演示用户' }
          ]

          const user = demoUsers.find(u => u.email === body.email && u.password === body.password)
          
          if (!user) {
            return new Response(JSON.stringify({ error: '邮箱或密码错误' }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          const userResponse = {
            id: Date.now(),
            name: user.name,
            email: user.email,
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

          return new Response(JSON.stringify({
            message: '登录成功',
            user: userResponse,
            token
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // 验证 token 接口
        if (path === '/auth/verify' && request.method === 'POST') {
          const authHeader = request.headers.get('Authorization')
          const token = authHeader?.replace('Bearer ', '')
          
          if (!token) {
            return new Response(JSON.stringify({ error: '未提供认证令牌' }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

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
              },
              lastLoginAt: new Date().toISOString(),
              createdAt: new Date().toISOString()
            }

            return new Response(JSON.stringify({
              valid: true,
              user
            }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          } catch (error) {
            return new Response(JSON.stringify({ error: '认证令牌无效' }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }
        }

        // 健康检查
        if (path === '/health') {
          return new Response(JSON.stringify({
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // 其他 API 接口（暂时返回占位响应）
        return new Response(JSON.stringify({
          message: '此接口正在开发中',
          path: path,
          method: request.method
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      } catch (error) {
        return new Response(JSON.stringify({
          error: '服务器内部错误',
          message: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // 其他请求返回 404
    return new Response('Not Found', { status: 404 })
  }
}