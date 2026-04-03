import { useState, useEffect } from 'react'

interface EnhancedSearchProps {
  query: string
  onClose: () => void
}

const API_URL = 'http://localhost:3001'

interface RelatedNode {
  id: string
  title: string
  relation: string
}

interface SearchNode {
  id: string
  title: string
  content: string
  graph: { id: string; title: string }
  edgeCount: number
  relatedNodes: RelatedNode[]
}

interface SearchGraph {
  id: string
  title: string
  description: string | null
  nodeCount: number
  author: string
}

interface SearchResults {
  query: string
  nodes: SearchNode[]
  graphs: SearchGraph[]
}

function EnhancedSearch({ query, onClose }: EnhancedSearchProps) {
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedNode, setSelectedNode] = useState<SearchNode | null>(null)

  useEffect(() => {
    performSearch()
  }, [query])

  const performSearch = async () => {
    setLoading(true)
    setError('')
    
    try {
      const url = `${API_URL}/api/search/enhanced?q=${encodeURIComponent(query)}`
      const res = await fetch(url)
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const data = await res.json()
      setResults(data)
    } catch (err: any) {
      console.error('Search error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'white',
          borderRadius: '16px',
          width: '900px',
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div style={{ 
          padding: '20px 30px', 
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f9fafb'
        }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '20px' }}>🔍 智能关联搜索</h2>
            <div style={{ color: '#666', fontSize: '14px' }}>关键词: "{query}"</div>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              fontSize: '24px', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ✕
          </button>
        </div>

        {/* 内容区 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 30px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '32px', marginBottom: '15px' }}>⏳</div>
              <div style={{ color: '#666' }}>正在搜索关联知识...</div>
            </div>
          )}

          {error && (
            <div style={{ 
              color: '#dc2626', 
              padding: '20px', 
              background: '#fef2f2', 
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              ❌ 搜索出错: {error}
            </div>
          )}

          {!loading && !error && results && (
            <div>
              {/* 统计 */}
              <div style={{ 
                marginBottom: '20px', 
                padding: '15px 20px',
                background: '#f0fdf4',
                borderRadius: '8px',
                borderLeft: '4px solid #22c55e'
              }}>
                <strong>📊 搜索结果:</strong> 找到 {results.nodes?.length || 0} 个知识点, {results.graphs?.length || 0} 个知识链
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                {/* 左侧：知识点列表 */}
                <div style={{ flex: 2 }}>
                  <h3 style={{ 
                    borderBottom: '2px solid #667eea', 
                    paddingBottom: '10px',
                    marginBottom: '15px',
                    color: '#667eea'
                  }}>
                    📝 知识点 ({results.nodes?.length || 0})
                  </h3>

                  {results.nodes?.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                      <div style={{ fontSize: '48px', marginBottom: '10px' }}>📝</div>
                      <div>未找到相关知识点</div>
                    </div>
                  )}

                  {results.nodes?.map((node) => (
                    <div 
                      key={node.id} 
                      style={{ 
                        padding: '15px', 
                        marginBottom: '12px', 
                        background: selectedNode?.id === node.id ? '#eef2ff' : '#f9fafb', 
                        borderRadius: '10px',
                        border: selectedNode?.id === node.id ? '2px solid #667eea' : '1px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#1f2937', fontSize: '16px' }}>
                          {node.title}
                        </h4>
                        <span style={{ 
                          background: '#dbeafe', 
                          color: '#1e40af',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          🔗 {node.edgeCount} 关联
                        </span>
                      </div>
                      
                      <p style={{ margin: '0 0 10px 0', color: '#6b7280', fontSize: '14px', lineHeight: '1.5' }}>
                        {node.content?.substring(0, 150)}{node.content?.length > 150 ? '...' : ''}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <small style={{ color: '#9ca3af' }}>📚 {node.graph?.title}</small>
                        {node.relatedNodes?.length > 0 && (
                          <small style={{ color: '#667eea' }}>
                            点击查看 {node.relatedNodes.length} 个关联知识点
                          </small>
                        )}
                      </div>

                      {/* 展开显示关联知识点 */}
                      {selectedNode?.id === node.id && node.relatedNodes?.length > 0 && (
                        <div style={{ 
                          marginTop: '12px', 
                          padding: '12px', 
                          background: 'white',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}>
                          <h5 style={{ margin: '0 0 10px 0', color: '#667eea', fontSize: '13px' }}>
                            🔗 关联知识点
                          </h5>
                          {node.relatedNodes.map((related) => (
                            <div 
                              key={related.id}
                              style={{
                                padding: '8px 12px',
                                marginBottom: '6px',
                                background: '#f3f4f6',
                                borderRadius: '6px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <span style={{ fontSize: '14px' }}>{related.title}</span>
                              <span style={{ 
                                fontSize: '11px', 
                                color: '#6b7280',
                                background: '#e5e7eb',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                {related.relation}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* 右侧：知识链 */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    borderBottom: '2px solid #22c55e', 
                    paddingBottom: '10px',
                    marginBottom: '15px',
                    color: '#22c55e'
                  }}>
                    📚 知识链 ({results.graphs?.length || 0})
                  </h3>

                  {results.graphs?.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                      <div style={{ fontSize: '48px', marginBottom: '10px' }}>📚</div>
                      <div>未找到相关知识链</div>
                    </div>
                  )}

                  {results.graphs?.map((graph) => (
                    <div 
                      key={graph.id} 
                      style={{ 
                        padding: '15px', 
                        marginBottom: '12px', 
                        background: '#f0fdf4', 
                        borderRadius: '10px',
                        border: '1px solid #bbf7d0'
                      }}
                    >
                      <h4 style={{ margin: '0 0 8px 0', color: '#166534', fontSize: '15px' }}>
                        {graph.title}
                      </h4>
                      
                      {graph.description && (
                        <p style={{ margin: '0 0 10px 0', color: '#6b7280', fontSize: '13px' }}>
                          {graph.description?.substring(0, 100)}{graph.description?.length > 100 ? '...' : ''}
                        </p>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <small style={{ color: '#9ca3af' }}>👤 {graph.author}</small>
                        <span style={{ 
                          background: '#dcfce7', 
                          color: '#166534',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          📚 {graph.nodeCount} 知识点
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EnhancedSearch
