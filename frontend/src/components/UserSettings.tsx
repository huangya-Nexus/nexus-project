import { useState, useEffect } from 'react'

interface UserSettingsProps {
  onClose: () => void
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function UserSettings({ onClose }: UserSettingsProps) {
  const [user, setUser] = useState<any>(null)
  const [name, setName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const getToken = () => localStorage.getItem('token') || ''

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      const data = await res.json()
      if (data.user) {
        setUser(data.user)
        setName(data.user.name || '')
      }
    } catch (err) {
      setError('获取用户信息失败')
    }
  }

  const handleUpdateProfile = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ name })
      })

      if (!res.ok) throw new Error('更新失败')

      setMessage('个人信息更新成功！')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError('更新失败')
    }
    setLoading(false)
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (newPassword.length < 6) {
      setError('新密码至少需要6位')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 这里需要后端支持修改密码 API
      setMessage('密码修改功能开发中...')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError('修改密码失败')
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
      height: '100vh',
      background: 'white',
      boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
      zIndex: 1000,
      overflow: 'auto'
    }}>
      {/* 头部 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <h3 style={{ margin: 0 }}>⚙️ 用户设置</h3>
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer'
          }}
        >
          ×
        </button>
      </div>

      {/* 内容 */}
      <div style={{ padding: '20px' }}>
        {error && (
          <div style={{
            padding: '12px',
            background: '#ff6b6b',
            color: 'white',
            borderRadius: '8px',
            marginBottom: '15px'
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{
            padding: '12px',
            background: '#51cf66',
            color: 'white',
            borderRadius: '8px',
            marginBottom: '15px'
          }}>
            {message}
          </div>
        )}

        {/* 用户信息 */}
        <div style={{ marginBottom: '30px' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>基本信息</h4>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>
              邮箱
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                background: '#f5f5f5',
                color: '#999'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>
              昵称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入昵称"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px'
              }}
            />
          </div>

          <button
            onClick={handleUpdateProfile}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '保存中...' : '保存修改'}
          </button>
        </div>

        {/* 配额信息 */}
        <div style={{ 
          marginBottom: '30px',
          padding: '15px',
          background: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <h4 style={{ margin: '0 0 15px 0' }}>📊 使用配额</h4>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '14px' }}>AI 调用次数</span>
              <span style={{ fontSize: '14px' }}>{user?.aiQuotaUsed || 0} / {user?.aiQuotaMonthly || 100}</span>
            </div>
            <div style={{
              height: '8px',
              background: '#e0e0e0',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${((user?.aiQuotaUsed || 0) / (user?.aiQuotaMonthly || 100)) * 100}%`,
                height: '100%',
                background: '#667eea',
                borderRadius: '4px'
              }} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '14px' }}>图谱数量</span>
              <span style={{ fontSize: '14px' }}>使用中 / {user?.graphQuota || 10}</span>
            </div>
          </div>
        </div>

        {/* 修改密码 */}
        <div>
          <h4 style={{ margin: '0 0 15px 0' }}>🔒 修改密码</h4>
          
          <div style={{ marginBottom: '15px' }}>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="当前密码"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                marginBottom: '10px'
              }}
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="新密码（至少6位）"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                marginBottom: '10px'
              }}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="确认新密码"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px'
              }}
            />
          </div>

          <button
            onClick={handleChangePassword}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#ccc' : '#333',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '修改中...' : '修改密码'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserSettings
