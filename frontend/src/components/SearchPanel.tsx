import React, { useState, useEffect, useRef, useCallback } from 'react'

interface Node {
  id: string
  title: string
  content: string
  keywords?: string[]
  summary?: string
  createdAt?: string
  updatedAt?: string
}

type SortOption = 'relevance' | 'title' | 'recent'

interface SearchPanelProps {
  nodes: Node[]
  onNodeSelect: (node: Node) => void
  onClose: () => void
}

function SearchPanel({ nodes, onNodeSelect, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Node[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [filters, setFilters] = useState({
    searchTitle: true,
    searchContent: true,
    searchKeywords: true
  })
  const [sortBy, setSortBy] = useState<SortOption>('relevance')
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // 聚焦输入框
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // 加载搜索历史
  useEffect(() => {
    const history = localStorage.getItem('nexus-search-history')
    if (history) {
      setSearchHistory(JSON.parse(history))
    }
  }, [])

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, -1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          onNodeSelect(results[selectedIndex])
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [results, selectedIndex, onNodeSelect, onClose])

  // 滚动选中项到可视区域
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex])

  // 保存搜索历史
  const saveSearchHistory = (term: string) => {
    if (!term.trim()) return
    const newHistory = [term, ...searchHistory.filter(h => h !== term)].slice(0, 10)
    setSearchHistory(newHistory)
    localStorage.setItem('nexus-search-history', JSON.stringify(newHistory))
  }

  // 执行搜索
  const performSearch = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([])
      setSelectedIndex(-1)
      return
    }

    const lowerQuery = searchTerm.toLowerCase()
    const filtered = nodes.filter(node => {
      const matchTitle = filters.searchTitle && node.title.toLowerCase().includes(lowerQuery)
      const matchContent = filters.searchContent && node.content.toLowerCase().includes(lowerQuery)
      const matchKeywords = filters.searchKeywords && 
        node.keywords?.some(k => k.toLowerCase().includes(lowerQuery))
      
      return matchTitle || matchContent || matchKeywords
    })

    // 根据排序选项排序
    let sorted = filtered
    if (sortBy === 'relevance') {
      // 相关性排序：标题匹配优先，然后是关键词，最后是内容
      sorted = filtered.sort((a, b) => {
        const aTitle = a.title.toLowerCase().includes(lowerQuery) ? 3 : 0
        const bTitle = b.title.toLowerCase().includes(lowerQuery) ? 3 : 0
        const aKeyword = a.keywords?.some(k => k.toLowerCase().includes(lowerQuery)) ? 2 : 0
        const bKeyword = b.keywords?.some(k => k.toLowerCase().includes(lowerQuery)) ? 2 : 0
        return (bTitle + bKeyword) - (aTitle + aKeyword)
      })
    } else if (sortBy === 'title') {
      // 按标题字母顺序
      sorted = filtered.sort((a, b) => a.title.localeCompare(b.title))
    } else if (sortBy === 'recent') {
      // 按最近更新
      sorted = filtered.sort((a, b) => 
        new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
      )
    }

    setResults(sorted)
    setSelectedIndex(-1)
    saveSearchHistory(searchTerm)
  }, [nodes, filters, sortBy])

  // 当排序选项改变时重新搜索
  useEffect(() => {
    if (query) {
      performSearch(query)
    }
  }, [sortBy, filters, performSearch, query])

  // 高亮匹配文本
  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <span key={i} style={{ background: '#fef08a', fontWeight: 'bold' }}>{part}</span> : part
    )
  }

  // 获取匹配上下文
  const getContext = (content: string, query: string) => {
    const lowerContent = content.toLowerCase()
    const lowerQuery = query.toLowerCase()
    const index = lowerContent.indexOf(lowerQuery)
    
    if (index === -1) return content.slice(0, 100) + '...'
    
    const start = Math.max(0, index - 40)
    const end = Math.min(content.length, index + query.length + 40)
    return (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '')
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
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '100px'
    }} onClick={onClose}>
      <div 
        style={{
          background: 'white',
          borderRadius: '16px',
          width: '600px',
          maxHeight: '70vh',
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 搜索头部 */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                performSearch(e.target.value)
                setShowHistory(false)
              }}
              onFocus={() => setShowHistory(true)}
              placeholder="搜索知识点..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '18px',
                fontWeight: '500'
              }}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('')
                  setResults([])
                  inputRef.current?.focus()
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#999'
                }}
              >
                ×
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#666'
              }}
            >
              ESC 关闭
            </button>
          </div>

          {/* 搜索选项和排序 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: '#666' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filters.searchTitle}
                  onChange={(e) => setFilters({...filters, searchTitle: e.target.checked})}
                />
                标题
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filters.searchContent}
                  onChange={(e) => setFilters({...filters, searchContent: e.target.checked})}
                />
                内容
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filters.searchKeywords}
                  onChange={(e) => setFilters({...filters, searchKeywords: e.target.checked})}
                />
                关键词
              </label>
            </div>
            
            {/* 排序选项 */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              style={{
                padding: '4px 8px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#666',
                cursor: 'pointer',
                background: 'white'
              }}
            >
              <option value="relevance">📊 相关度</option>
              <option value="title">🔤 标题</option>
              <option value="recent">🕐 最近更新</option>
            </select>
          </div>
        </div>

        {/* 搜索结果 */}
        <div style={{ overflow: 'auto', flex: 1 }}>
          {/* 搜索历史 */}
          {showHistory && query === '' && searchHistory.length > 0 && (
            <div style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>搜索历史</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {searchHistory.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(term)
                      performSearch(term)
                      setShowHistory(false)
                    }}
                    style={{
                      padding: '6px 12px',
                      background: '#f3f4f6',
                      border: 'none',
                      borderRadius: '20px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 结果列表 */}
          {query && (
            <div style={{ padding: '10px 0' }}>
              <div style={{ padding: '10px 20px', fontSize: '13px', color: '#666' }}>
                找到 {results.length} 个结果
              </div>
              
              {results.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔍</div>
                  <div>未找到匹配的知识点</div>
                  <div style={{ fontSize: '13px', marginTop: '8px' }}>尝试其他关键词</div>
                </div>
              ) : (
                <div ref={resultsRef}>
                {results.map((node, index) => (
                  <div
                    key={node.id}
                    onClick={() => {
                      onNodeSelect(node)
                      onClose()
                    }}
                    style={{
                      padding: '15px 20px',
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      background: selectedIndex === index ? '#e0e7ff' : 'white',
                      borderLeft: selectedIndex === index ? '4px solid #667eea' : '4px solid transparent'
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onMouseLeave={() => {}}
                  >
                    <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '6px', color: '#1f2937' }}>
                      {highlightText(node.title, query)}
                    </div>
                    
                    {node.summary && (
                      <div style={{ fontSize: '13px', color: '#667eea', marginBottom: '6px' }}>
                        🤖 {highlightText(node.summary, query)}
                      </div>
                    )}
                    
                    <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                      {highlightText(getContext(node.content, query), query)}
                    </div>
                    
                    {node.keywords && node.keywords.length > 0 && (
                      <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {node.keywords.map((keyword, i) => (
                          <span
                            key={i}
                            style={{
                              padding: '3px 8px',
                              background: keyword.toLowerCase().includes(query.toLowerCase()) ? '#fef08a' : '#f3f4f6',
                              borderRadius: '4px',
                              fontSize: '12px',
                              color: '#666'
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
              )}
            </div>
          )}

          {/* 空状态提示 */}
          {!query && !showHistory && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>💡</div>
              <div>输入关键词开始搜索</div>
              <div style={{ fontSize: '13px', marginTop: '8px' }}>支持搜索标题、内容和关键词</div>
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div style={{ 
          padding: '12px 20px', 
          background: '#f9fafb', 
          borderTop: '1px solid #e5e7eb',
          fontSize: '12px',
          color: '#999',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>↑↓ 选择 · ↵ 确认 · ESC 关闭</span>
          <span>共 {nodes.length} 个知识点</span>
        </div>
      </div>
    </div>
  )
}

export default SearchPanel
