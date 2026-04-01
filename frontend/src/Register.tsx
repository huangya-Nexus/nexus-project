interface RegisterProps {
  onNavigate: (page: 'home' | 'login' | 'register' | 'dashboard') => void
}

function Register({ onNavigate }: RegisterProps) {
  const handleRegister = () => {
    // 这里可以添加实际的注册逻辑
    onNavigate('dashboard')
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

      {/* 注册卡片 */}
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
          创建您的知识图谱账号
        </p>

        {/* 邮箱输入 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#555' }}>
            邮箱
          </label>
          <input 
            type="email"
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
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#555' }}>
            密码
          </label>
          <input 
            type="password"
            placeholder="设置密码（至少6位）"
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

        {/* 确认密码 */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#555' }}>
            确认密码
          </label>
          <input 
            type="password"
            placeholder="再次输入密码"
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

        {/* 注册按钮 */}
        <button 
          onClick={handleRegister}
          style={{
            width: '100%',
            padding: '15px',
            border: 'none',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          注册账号
        </button>

        {/* 登录链接 */}
        <p style={{
          textAlign: 'center',
          marginTop: '20px',
          color: '#666'
        }}>
          已有账号？
          <button 
            onClick={() => onNavigate('login')}
            style={{ 
              color: '#667eea', 
              textDecoration: 'none',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            去登录
          </button>
        </p>
      </div>
    </div>
  )
}

export default Register
