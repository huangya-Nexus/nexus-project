import { useState, useEffect } from 'react'

interface SimpleSearchProps {
  query: string
  onClose: () => void
}

const API_URL = 'http://localhost:3001'

function SimpleSearch({ query, onClose }: SimpleSearchProps) {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    console.log('SimpleSearch mounted, query:', query)
    performSearch()
  }, [query])

  const performSearch = async () => {
    console.log('Starting search for:', query)
    setLoading(true)
    setError('')
    
    try {
      const url = `${API_URL}/api/search/public?q=${encodeURIComponent(query)}`
      console.log('Fetching:', url)
      
      const res = await fetch(url)
      console.log('Response status:', res.status)
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const data = await res.json()
      console.log('Search results:', data)
      setResults(data)
    } catch (err: any) {
      console.error('Search error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  console.log('Render - loading:', loading, 'error:', error, 'results:', results)

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'white',
          borderRadius: '16px',
          width: '700px',
          maxHeight: '80vh',
          padding: '30px',
          overflow: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>🔍 搜索结果: "{query}"</h2>
          <button onClick={onClose} style={{ fontSize: '20px', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '24px' }}>⏳ 搜索中...</div>
          </div>
        )}

        {error && (
          <div style={{ color: 'red', padding: '20px', background: '#fee', borderRadius: '8px' }}>
            ❌ 错误: {error}
          </div>
        )}

        {!loading && !error && results && (
          <div>
            <div style={{ marginBottom: '20px', color: '#666', fontWeight: 'bold' }}>
              ✅ 找到 {results.graphs?.total || 0} 个图谱, {results.nodes?.total || 0} 个知识点
            </div>

            {results.graphs?.items?.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ borderBottom: '2px solid #667eea', paddingBottom: '10px' }}>📚 图谱</h3>
                {results.graphs.items.map((graph: any) => (
                  <div key={graph.id} style={{ 
                    padding: '15px', 
                    marginBottom: '10px', 
                    background: '#f5f5f5', 
                    borderRadius: '8px',
                    borderLeft: '4px solid #667eea'
                  }}>
                    <h4 style={{ margin: '0 0 5px 0' }}>{graph.title}</h4>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{graph.description}</p>
                    <small style={{ color: '#999' }}>👤 {graph.author} · 📚 {graph.nodeCount} 个知识点</small>
                  </div>
                ))}
              </div>
            )}

            {results.nodes?.items?.length > 0 && (
              <div>
                <h3 style={{ borderBottom: '2px solid #667eea', paddingBottom: '10px' }}>📝 知识点</h3>
                {results.nodes.items.map((node: any) => (
                  <div key={node.id} style={{ 
                    padding: '15px', 
                    marginBottom: '10px', 
                    background: '#f5f5f5', 
                    borderRadius: '8px',
                    borderLeft: '4px solid #22c55e'
                  }}>
                    <h4 style={{ margin: '0 0 5px 0' }}>{node.title}</h4>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{node.content}</p>
                    <small style={{ color: '#999' }}>📚 {node.graphTitle}</small>
                  </div>
                ))}
              </div>
            )}

            {results.graphs?.items?.length === 0 && results.nodes?.items?.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>😕</div>
                <div>未找到相关结果</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SimpleSearch
