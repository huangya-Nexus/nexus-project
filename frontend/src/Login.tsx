import { useState } from 'react'

interface LoginProps {
  onNavigate: (page: 'home' | 'login' | 'register' | 'dashboard') => void
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function Login({ onNavigate }: LoginProps) {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      setError('请输入邮箱和密码')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '登录失败')
        return
      }

      // 保存 token
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // 跳转到仪表盘
      onNavigate('dashboard')
    } catch (err) {
      setError('网络错误，请稍后重试')
    }

    setLoading(false)
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* 返回首页按钮 */}
      <button 
        onClick={() => onNavigate('home')}
        style={{
          position: 'absolute',
          top: '30px',
          left: '30px',
          color: 'white',
          textDecoration: 'none',
          fontSize: '18px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        ← 返回首页
      </button>

      {/* 登录卡片 */}
      <div style={{
        background: 'white',
        padding: '50px',
        borderRadius: '20px',
        width: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{
          textAlign: 'center',
          margin: '0 0 10px 0',
          color: '#333',
          fontSize: '32px'
        }}>
          🧠 知链 Nexus
        </h2>
        <p style={{
          textAlign: 'center',
          margin: '0 0 30px 0',
          color: '#666'
        }}>
          欢迎回来，继续构建您的知识体系
        </p>

        {error && (
          <div style={{
            padding: '12px',
            background: '#ff6b6b',
            color: 'white',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* 邮箱输入 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#555' }}>
            邮箱
          </label>
          <input 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{
              width: '100%',
              padding: '15px',
              border: '2px solid #e0e0e0',
              borderRadius: '10px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* 密码输入 */}
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#555' }}>
            密码
          </label>
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入密码"
            style={{
              width: '100%',
              padding: '15px',
              border: '2px solid #e0e0e0',
              borderRadius: '10px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* 忘记密码 */}
        <div style={{ textAlign: 'right', marginBottom: '30px' }}>
          <a href="#" style={{ color: '#667eea', textDecoration: 'none', fontSize: '14px' }}>
            忘记密码？
          </a>
        </div>

        {/* 登录按钮 */}
        <button 
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '15px',
            border: 'none',
            borderRadius: '10px',
            background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '登录中...' : '登录'}
        </button>

        {/* 注册链接 */}
        <p style={{
          textAlign: 'center',
          marginTop: '20px',
          color: '#666'
        }}>
          还没有账号？
          <button 
            onClick={() => onNavigate('register')}
            style={{ 
              color: '#667eea', 
              textDecoration: 'none',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            立即注册
          </button>
        </p>
      </div>
    </div>
  )
}

export default Login
