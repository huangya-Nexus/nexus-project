import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

interface SharedGraph {
  id: string
  title: string
  description: string | null
  category: string | null
  nodeCount: number
  edgeCount: number
  nodes: Array<{
    id: string
    title: string
    content: string
    summary: string | null
    keywords: string | null
    positionX: number | null
    positionY: number | null
  }>
  edges: Array<{
    id: string
    type: string
    label: string | null
    sourceId: string
    targetId: string
  }>
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function SharedGraphView() {
  const { shareToken } = useParams<{ shareToken: string }>()
  const navigate = useNavigate()
  const [graph, setGraph] = useState<SharedGraph | null>(null)
  const [permission, setPermission] = useState<string>('read')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cloning, setCloning] = useState(false)

  useEffect(() => {
    loadSharedGraph()
  }, [shareToken])

  const loadSharedGraph = async () => {
    try {
      const res = await fetch(`${API_URL}/api/share/token/${shareToken}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '加载失败')
      }
      const data = await res.json()
      setGraph(data.graph)
      setPermission(data.permission)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClone = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      alert('请先登录后再复制图谱')
      navigate('/login')
      return
    }

    setCloning(true)
    try {
      const res = await fetch(`${API_URL}/api/share/token/${shareToken}/clone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '复制失败')
      }

      await res.json()
      alert('✅ 图谱复制成功！')
      navigate('/dashboard')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setCloning(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>😕</div>
          <h2 style={{ marginBottom: '10px' }}>无法访问</h2>
          <p style={{ color: '#666' }}>{error}</p>
          <button
            onClick={() => navigate('/')}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  if (!graph) return null

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 顶部导航 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px 50px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>🧠 知链 Nexus</h1>
          <p style={{ margin: '5px 0 0 0', opacity: 0.8, fontSize: '14px' }}>
            查看分享的图谱
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {permission === 'clone' && (
            <button
              onClick={handleClone}
              disabled={cloning}
              style={{
                padding: '10px 20px',
                background: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: cloning ? 'not-allowed' : 'pointer'
              }}
            >
              {cloning ? '复制中...' : '📋 复制到我的账户'}
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            返回首页
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div style={{ padding: '30px 50px' }}>
        {/* 图谱信息 */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 10px 0' }}>{graph.title}</h2>
          {graph.description && (
            <p style={{ color: '#666', margin: '0 0 15px 0' }}>{graph.description}</p>
          )}
          <div style={{ display: 'flex', gap: '20px', color: '#999', fontSize: '14px' }}>
            <span>📚 {graph.nodeCount} 个知识点</span>
            <span>🔗 {graph.edgeCount} 个关联</span>
            {graph.category && <span>🏷️ {graph.category}</span>}
          </div>
        </div>

        {/* 知识点列表 */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0' }}>📖 知识点 ({graph.nodes.length})</h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            {graph.nodes.map((node, index) => (
              <div
                key={node.id}
                style={{
                  padding: '20px',
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  borderLeft: '4px solid #667eea'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '10px'
                }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    background: '#667eea',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px'
                  }}>
                    {index + 1}
                  </span>
                  <h4 style={{ margin: 0 }}>{node.title}</h4>
                </div>
                {node.summary && (
                  <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
                    {node.summary}
                  </p>
                )}
                {node.keywords && (
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {JSON.parse(node.keywords).map((keyword: string, i: number) => (
                      <span
                        key={i}
                        style={{
                          padding: '4px 8px',
                          background: '#e0e7ff',
                          color: '#667eea',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SharedGraphView
