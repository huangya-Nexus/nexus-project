import { useState, useEffect } from 'react'

interface SearchResult {
  query: string
  graphs: {
    items: Array<{
      id: string
      title: string
      description: string | null
      nodeCount: number
      author: string
      createdAt: string
    }>
    total: number
    page: number
    totalPages: number
  }
  nodes: {
    items: Array<{
      id: string
      title: string
      content: string
      graphId: string
      graphTitle: string
      author: string
    }>
    total: number
  }
}

interface SearchResultsProps {
  query: string
  onClose: () => void
  onSelectGraph: (graphId: string) => void
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function SearchResults({ query, onClose, onSelectGraph }: SearchResultsProps) {
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'graphs' | 'nodes'>('graphs')

  useEffect(() => {
    performSearch()
  }, [query])

  const performSearch = async () => {
    setLoading(true)
    setError('')
    
    try {
      console.log('Searching for:', query)
      const res = await fetch(`${API_URL}/api/search/public?q=${encodeURIComponent(query)}`)
      console.log('Response status:', res.status)
      
      if (!res.ok) {
        throw new Error('搜索失败')
      }
      
      const data = await res.json()
      console.log('Search results:', data)
      setResults(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const highlightText = (text: string, query: string) => {
    if (!text) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <span key={i} style={{ background: '#fef08a', fontWeight: 'bold' }}>{part}</span> : part
    )
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
      justifyContent: 'center',
      padding: '20px'
    }} onClick={onClose}>
      <div 
        style={{
          background: 'white',
          borderRadius: '20px',
          width: '800px',
          maxHeight: '90vh',
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px' }}>🔍 搜索结果</h2>
            <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
              "{query}" - 找到 {results?.graphs.total || 0} 个图谱, {results?.nodes.total || 0} 个知识点
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            关闭
          </button>
        </div>

        {/* 标签切换 */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb'
        }}>
          <button
            onClick={() => setActiveTab('graphs')}
            style={{
              flex: 1,
              padding: '15px',
              background: activeTab === 'graphs' ? 'white' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'graphs' ? '2px solid #667eea' : 'none',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: activeTab === 'graphs' ? '600' : 'normal',
              color: activeTab === 'graphs' ? '#667eea' : '#666'
            }}
          >
            📚 图谱 ({results?.graphs.total || 0})
          </button>
          <button
            onClick={() => setActiveTab('nodes')}
            style={{
              flex: 1,
              padding: '15px',
              background: activeTab === 'nodes' ? 'white' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'nodes' ? '2px solid #667eea' : 'none',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: activeTab === 'nodes' ? '600' : 'normal',
              color: activeTab === 'nodes' ? '#667eea' : '#666'
            }}
          >
            📝 知识点 ({results?.nodes.total || 0})
          </button>
        </div>

        {/* 内容区 */}
        <div style={{ overflow: 'auto', padding: '20px', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔍</div>
              <div>搜索中...</div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
              ⚠️ {error}
            </div>
          ) : activeTab === 'graphs' ? (
            <div>
              {!results || results.graphs.items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>📚</div>
                  <div>未找到相关图谱</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {results.graphs.items.map((graph) => (
                    <div
                      key={graph.id}
                      onClick={() => onSelectGraph(graph.id)}
                      style={{
                        padding: '20px',
                        background: '#f9fafb',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: '2px solid transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f0f0f0'
                        e.currentTarget.style.borderColor = '#667eea'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f9fafb'
                        e.currentTarget.style.borderColor = 'transparent'
                      }}
                    >
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
                        {highlightText(graph.title, query)}
                      </h3>
                      {graph.description && (
                        <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
                          {highlightText(graph.description, query)}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: '#999' }}>
                        <span>👤 {graph.author}</span>
                        <span>📚 {graph.nodeCount} 个知识点</span>
                        <span>📅 {new Date(graph.createdAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {!results || results.nodes.items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>📝</div>
                  <div>未找到相关知识点</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {results.nodes.items.map((node) => (
                    <div
                      key={node.id}
                      style={{
                        padding: '20px',
                        background: '#f9fafb',
                        borderRadius: '12px',
                        borderLeft: '4px solid #667eea'
                      }}
                    >
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                        {highlightText(node.title, query)}
                      </h4>
                      <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
                        {highlightText(node.content, query)}
                      </p>
                      <div style={{ fontSize: '13px', color: '#999' }}>
                        📚 {node.graphTitle} · 👤 {node.author}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div style={{ 
          padding: '15px 20px', 
          background: '#f9fafb', 
          borderTop: '1px solid #e5e7eb',
          fontSize: '13px',
          color: '#999',
          textAlign: 'center'
        }}>
          💡 登录后可以查看更多内容和创建自己的知识图谱
        </div>
      </div>
    </div>
  )
}

export default SearchResults
