import { useState, useEffect } from 'react'

interface ExternalResult {
  source: string
  title: string
  content: string
  url: string
  metadata?: Record<string, any>
}

interface ExternalSearchProps {
  query: string
  onClose: () => void
  onImport: (content: string) => void
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function ExternalSearch({ query, onClose, onImport }: ExternalSearchProps) {
  const [results, setResults] = useState<Record<string, ExternalResult[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeSource, setActiveSource] = useState<string>('all')
  const [sources, setSources] = useState<Array<{id: string, name: string, icon: string}>>([])

  useEffect(() => {
    loadSources()
    performSearch()
  }, [query])

  const loadSources = async () => {
    try {
      const res = await fetch(`${API_URL}/api/external/sources`)
      if (res.ok) {
        const data = await res.json()
        setSources(data.sources)
      }
    } catch (e) {
      console.error('加载搜索源失败:', e)
    }
  }

  const performSearch = async () => {
    setLoading(true)
    setError('')
    
    try {
      // 使用多源聚合搜索，添加超时处理
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时
      
      const res = await fetch(
        `${API_URL}/api/external/multi?q=${encodeURIComponent(query)}&sources=wikipedia,arxiv,github,pubmed,crossref,semantic_scholar,zhihu,bilibili`,
        { signal: controller.signal }
      )
      
      clearTimeout(timeoutId)

      if (res.ok) {
        const data = await res.json()
        setResults(data.results)
      } else {
        throw new Error('搜索失败')
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('搜索超时，请稍后重试')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const getAllResults = () => {
    return Object.values(results).flat()
  }

  const getFilteredResults = () => {
    if (activeSource === 'all') {
      return getAllResults()
    }
    return results[activeSource] || []
  }

  const getSourceLabel = (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId)
    return source ? `${source.icon} ${source.name}` : sourceId
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'wikipedia': return '#3b82f6'
      case 'arxiv': return '#f59e0b'
      case 'github': return '#6b7280'
      case 'pubmed': return '#10b981'
      case 'crossref': return '#8b5cf6'
      case 'semantic_scholar': return '#ec4899'
      case 'zhihu': return '#0084ff'
      case 'bilibili': return '#fb7299'
      default: return '#667eea'
    }
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
          width: '900px',
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
            <h2 style={{ margin: 0, fontSize: '24px' }}>🌐 全网搜索</h2>
            <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
              "{query}" - 多源聚合搜索
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

        {/* 来源筛选 */}
        <div style={{ 
          display: 'flex', 
          gap: '10px',
          padding: '15px 20px',
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb',
          overflowX: 'auto'
        }}>
          <button
            onClick={() => setActiveSource('all')}
            style={{
              padding: '8px 16px',
              background: activeSource === 'all' ? '#667eea' : 'white',
              color: activeSource === 'all' ? 'white' : '#666',
              border: '1px solid #ddd',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '13px',
              whiteSpace: 'nowrap'
            }}
          >
            🌐 全部 ({getAllResults().length})
          </button>
          {sources.map(source => (
            <button
              key={source.id}
              onClick={() => setActiveSource(source.id)}
              style={{
                padding: '8px 16px',
                background: activeSource === source.id ? getSourceColor(source.id) : 'white',
                color: activeSource === source.id ? 'white' : '#666',
                border: '1px solid #ddd',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '13px',
                whiteSpace: 'nowrap'
              }}
            >
              {source.icon} {source.name} ({results[source.id]?.length || 0})
            </button>
          ))}
        </div>

        {/* 内容区 */}
        <div style={{ overflow: 'auto', padding: '20px', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔍</div>
              <div>正在搜索多个数据源...</div>
              <div style={{ fontSize: '13px', color: '#999', marginTop: '10px' }}>
                维基百科 · arXiv · GitHub · PubMed · CrossRef · Semantic Scholar · 知乎 · B站
              </div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
              ⚠️ {error}
            </div>
          ) : getFilteredResults().length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>😕</div>
              <div>未找到相关结果</div>
              <div style={{ fontSize: '14px', marginTop: '10px' }}>
                尝试其他关键词或检查网络连接
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {getFilteredResults().map((result, index) => (
                <div
                  key={index}
                  style={{
                    padding: '20px',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    borderLeft: `4px solid ${getSourceColor(result.source)}`
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '10px'
                  }}>
                    <span style={{
                      padding: '4px 10px',
                      background: getSourceColor(result.source),
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {getSourceLabel(result.source)}
                    </span>
                    <button
                      onClick={() => onImport(result.content)}
                      style={{
                        padding: '6px 12px',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      📥 导入
                    </button>
                  </div>
                  
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '17px' }}>
                    <a 
                      href={result.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#1f2937', textDecoration: 'none' }}
                    >
                      {result.title}
                    </a>
                  </h3>
                  
                  <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
                    {result.content.substring(0, 300)}
                    {result.content.length > 300 && '...'}
                  </p>
                  
                  {result.metadata && (
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {Object.entries(result.metadata).map(([key, value]) => (
                        <span key={key} style={{ marginRight: '15px' }}>
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div style={{ 
          padding: '15px 20px', 
          background: '#f9fafb', 
          borderTop: '1px solid #e5e7eb',
          fontSize: '13px',
          color: '#666',
          textAlign: 'center'
        }}>
          💡 点击"导入"可将内容添加到 AI 导入，自动提取知识点
        </div>
      </div>
    </div>
  )
}

export default ExternalSearch
