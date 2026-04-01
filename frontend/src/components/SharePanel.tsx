import { useState } from 'react'

interface SharePanelProps {
  graphId: string
  graphTitle: string
  onClose: () => void
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function SharePanel({ graphId, graphTitle, onClose }: SharePanelProps) {
  const [shareUrl, setShareUrl] = useState('')
  const [permission, setPermission] = useState('read')
  const [expiresIn, setExpiresIn] = useState('7d')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const getToken = () => localStorage.getItem('token') || ''

  const handleShare = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/share/${graphId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ permission, expiresIn })
      })

      if (!res.ok) throw new Error('创建分享链接失败')

      const data = await res.json()
      setShareUrl(data.shareUrl)
    } catch (err) {
      alert('创建分享链接失败')
    }
    setLoading(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }} onClick={onClose}>
      <div 
        style={{
          background: 'white',
          borderRadius: '16px',
          width: '500px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: 0 }}>🔗 分享图谱</h3>
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

        <div style={{ padding: '20px' }}>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            分享「{graphTitle}」，其他人可以通过链接查看或复制这个图谱。
          </p>

          {!shareUrl ? (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  权限设置
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setPermission('read')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: permission === 'read' ? '#667eea' : '#f3f4f6',
                      color: permission === 'read' ? 'white' : '#333',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    👀 仅查看
                  </button>
                  <button
                    onClick={() => setPermission('clone')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: permission === 'clone' ? '#667eea' : '#f3f4f6',
                      color: permission === 'clone' ? 'white' : '#333',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    📋 可复制
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  有效期
                </label>
                <select
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                >
                  <option value="1d">1天</option>
                  <option value="7d">7天</option>
                  <option value="30d">30天</option>
                  <option value="365d">1年</option>
                </select>
              </div>

              <button
                onClick={handleShare}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: loading ? '#ccc' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px'
                }}
              >
                {loading ? '生成中...' : '生成分享链接'}
              </button>
            </>
          ) : (
            <>
              <div style={{
                padding: '15px',
                background: '#f3f4f6',
                borderRadius: '8px',
                marginBottom: '20px',
                wordBreak: 'break-all'
              }}>
                {shareUrl}
              </div>

              <button
                onClick={copyToClipboard}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: copied ? '#22c55e' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  marginBottom: '10px'
                }}
              >
                {copied ? '✅ 已复制' : '📋 复制链接'}
              </button>

              <button
                onClick={() => setShareUrl('')}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: '#f3f4f6',
                  color: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                重新生成
              </button>
            </>
          )}

          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '13px', color: '#999', margin: 0 }}>
              💡 提示：分享后其他人可以查看图谱内容。
              {permission === 'clone' && ' 他们还可以将图谱复制到自己的账户。'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SharePanel
