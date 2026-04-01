import { useState, useEffect, useRef, useCallback } from 'react'

interface KnowledgeNode {
  id: string
  title: string
  content: string
  relevance: number
  x: number
  y: number
  vx: number
  vy: number
  source: string
  category: string
}

interface KnowledgeEdge {
  source: string
  target: string
  strength: number
  type: string
}

interface GraphData {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
}

interface EnhancedGraphSearchProps {
  query: string
  onClose: () => void
}

const API_URL = 'http://localhost:3001'

// 颜色配置
const COLORS = {
  center: '#e74c3c',
  wiki: '#3498db',
  academic: '#9b59b6',
  tech: '#1abc9c',
  medical: '#e67e22',
  video: '#f39c12',
  qa: '#2ecc71',
  selected: '#f1c40f'
}

const CATEGORY_COLORS: Record<string, string> = {
  'center': COLORS.center,
  'wikipedia': COLORS.wiki,
  'arxiv': COLORS.academic,
  'github': COLORS.tech,
  'pubmed': COLORS.medical,
  'crossref': COLORS.academic,
  'semantic_scholar': COLORS.academic,
  'zhihu': COLORS.qa,
  'bilibili': COLORS.video
}

function EnhancedGraphSearch({ query, onClose }: EnhancedGraphSearchProps) {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] })
  const [loading, setLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'force' | 'circular' | 'hierarchical'>('force')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)

  // 多源搜索函数 - 使用后端聚合API
  const searchAllSources = async (query: string) => {
    try {
      setLoadingProgress(30)
      
      const res = await fetch(
        `${API_URL}/api/external/multi?q=${encodeURIComponent(query)}&sources=wikipedia,arxiv,github,pubmed`
      )
      
      setLoadingProgress(70)
      
      if (!res.ok) {
        throw new Error('Search failed')
      }
      
      const data = await res.json()
      const allResults: any[] = []
      
      // 将分组的结果扁平化
      Object.entries(data.results || {}).forEach(([source, items]: [string, any]) => {
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            allResults.push({
              ...item,
              source: item.source || source,
              weight: 0.8
            })
          })
        }
      })
      
      setLoadingProgress(100)
      return allResults
    } catch (e) {
      console.error('Search error:', e)
      return []
    }
  }

  // 构建知识图谱数据
  const buildGraphData = useCallback((searchResults: any[], query: string): GraphData => {
    const nodes: KnowledgeNode[] = []
    const edges: KnowledgeEdge[] = []
    const centerId = 'center'

    // 中心节点
    nodes.push({
      id: centerId,
      title: query,
      content: `搜索关键词: ${query}`,
      relevance: 1.0,
      x: 500,
      y: 400,
      vx: 0,
      vy: 0,
      source: 'center',
      category: 'center'
    })

    // 添加搜索结果节点
    searchResults.forEach((item, index) => {
      const id = `node-${index}`
      const relevance = (item.weight || 0.5) * (0.8 + Math.random() * 0.2)
      
      // 根据来源确定类别
      let category = item.source
      if (['arxiv', 'crossref', 'semantic_scholar'].includes(item.source)) {
        category = 'academic'
      } else if (['github'].includes(item.source)) {
        category = 'tech'
      }

      nodes.push({
        id,
        title: item.title?.substring(0, 30) || 'Untitled',
        content: item.content?.substring(0, 200) || '',
        relevance,
        x: 500 + (Math.random() - 0.5) * 400,
        y: 400 + (Math.random() - 0.5) * 300,
        vx: 0,
        vy: 0,
        source: item.source,
        category
      })

      // 连接到中心节点
      edges.push({
        source: centerId,
        target: id,
        strength: relevance,
        type: 'primary'
      })

      // 添加节点间的关联（基于内容相似度）
      for (let i = 0; i < index; i++) {
        const otherNode = nodes[i + 1] // +1 because index 0 is center
        if (otherNode && calculateSimilarity(item.content, searchResults[i]?.content) > 0.3) {
          edges.push({
            source: id,
            target: otherNode.id,
            strength: 0.3,
            type: 'secondary'
          })
        }
      }
    })

    // 如果没有搜索结果，添加一些智能推荐
    if (nodes.length <= 1) {
      const recommendations = generateSmartRecommendations(query)
      recommendations.forEach((rec, idx) => {
        const id = `rec-${idx}`
        nodes.push({
          id,
          title: rec.title,
          content: rec.content,
          relevance: rec.relevance,
          x: 500 + (Math.random() - 0.5) * 300,
          y: 400 + (Math.random() - 0.5) * 200,
          vx: 0,
          vy: 0,
          source: 'recommendation',
          category: 'wiki'
        })

        edges.push({
          source: centerId,
          target: id,
          strength: rec.relevance,
          type: 'recommendation'
        })
      })
    }

    return { nodes, edges }
  }, [])

  // 计算文本相似度
  const calculateSimilarity = (text1: string, text2: string): number => {
    if (!text1 || !text2) return 0
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    return intersection.size / Math.max(words1.size, words2.size)
  }

  // 生成智能推荐
  const generateSmartRecommendations = (query: string) => {
    const recommendationMap: Record<string, any[]> = {
      '机器学习': [
        { title: '深度学习', content: '基于神经网络的机器学习方法', relevance: 0.95 },
        { title: '监督学习', content: '使用标注数据训练模型', relevance: 0.9 },
        { title: '神经网络', content: '模拟人脑的计算模型', relevance: 0.88 },
        { title: '数据挖掘', content: '从数据中发现模式', relevance: 0.85 }
      ],
      '编程': [
        { title: '算法', content: '解决问题的步骤和方法', relevance: 0.95 },
        { title: '数据结构', content: '组织和存储数据的方式', relevance: 0.92 },
        { title: '前端开发', content: '构建用户界面', relevance: 0.85 },
        { title: '后端开发', content: '服务器端编程', relevance: 0.85 }
      ],
      '历史': [
        { title: '古代史', content: '人类文明早期历史', relevance: 0.9 },
        { title: '近代史', content: '工业革命以来的历史', relevance: 0.88 },
        { title: '世界史', content: '全球历史发展', relevance: 0.85 }
      ],
      '医学': [
        { title: '解剖学', content: '人体结构研究', relevance: 0.92 },
        { title: '病理学', content: '疾病机制研究', relevance: 0.9 },
        { title: '药理学', content: '药物作用机制', relevance: 0.88 }
      ]
    }

    for (const [key, recs] of Object.entries(recommendationMap)) {
      if (query.toLowerCase().includes(key.toLowerCase())) {
        return recs
      }
    }

    return [
      { title: '基础概念', content: `${query}的基本定义和原理`, relevance: 0.9 },
      { title: '应用领域', content: `${query}的实际应用场景`, relevance: 0.85 },
      { title: '发展历程', content: `${query}的历史演变`, relevance: 0.8 },
      { title: '相关技术', content: `与${query}相关的技术方法`, relevance: 0.75 }
    ]
  }

  // 力导向布局动画
  const runForceLayout = useCallback((data: GraphData) => {
    const nodes = [...data.nodes]
    const edges = data.edges
    const centerX = 500
    const centerY = 400

    // 物理参数
    const repulsion = 2000
    const springLength = 150
    const springStrength = 0.05
    const damping = 0.9
    const centerGravity = 0.01

    // 更新节点位置
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      if (node.id === 'center') continue // 中心节点固定

      let fx = 0
      let fy = 0

      // 排斥力（节点间）
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue
        const other = nodes[j]
        const dx = node.x - other.x
        const dy = node.y - other.y
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1
        const force = repulsion / (dist * dist)
        fx += (dx / dist) * force
        fy += (dy / dist) * force
      }

      // 弹簧力（边）
      edges.forEach(edge => {
        if (edge.source === node.id || edge.target === node.id) {
          const otherId = edge.source === node.id ? edge.target : edge.source
          const other = nodes.find(n => n.id === otherId)
          if (other) {
            const dx = other.x - node.x
            const dy = other.y - node.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const force = (dist - springLength) * springStrength * edge.strength
            fx += (dx / dist) * force
            fy += (dy / dist) * force
          }
        }
      })

      // 中心引力
      const dx = centerX - node.x
      const dy = centerY - node.y
      fx += dx * centerGravity
      fy += dy * centerGravity

      // 更新速度和位置
      node.vx = (node.vx + fx) * damping
      node.vy = (node.vy + fy) * damping
      node.x += node.vx
      node.y += node.vy

      // 边界限制
      node.x = Math.max(50, Math.min(950, node.x))
      node.y = Math.max(50, Math.min(750, node.y))
    }

    return { nodes, edges }
  }, [])

  // 绘制图谱
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置画布
    canvas.width = 1000
    canvas.height = 800

    // 清空画布
    ctx.fillStyle = '#f8f9fa'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 过滤节点
    const filteredNodes = filterCategory === 'all' 
      ? graphData.nodes 
      : graphData.nodes.filter(n => n.category === filterCategory || n.id === 'center')
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id))
    const filteredEdges = graphData.edges.filter(e => 
      filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
    )

    // 绘制边
    filteredEdges.forEach(edge => {
      const source = graphData.nodes.find(n => n.id === edge.source)
      const target = graphData.nodes.find(n => n.id === edge.target)
      if (!source || !target) return

      ctx.beginPath()
      ctx.moveTo(source.x, source.y)
      ctx.lineTo(target.x, target.y)
      
      const gradient = ctx.createLinearGradient(source.x, source.y, target.x, target.y)
      const sourceColor = CATEGORY_COLORS[source.category] || '#999'
      const targetColor = CATEGORY_COLORS[target.category] || '#999'
      gradient.addColorStop(0, sourceColor + '40')
      gradient.addColorStop(1, targetColor + '40')
      ctx.strokeStyle = gradient
      ctx.lineWidth = edge.strength * 4
      ctx.stroke()
    })

    // 绘制节点
    filteredNodes.forEach(node => {
      const isHovered = hoveredNode === node.id
      const isSelected = selectedNode?.id === node.id
      const color = CATEGORY_COLORS[node.category] || '#999'
      const radius = node.id === 'center' ? 45 : 25 + node.relevance * 20

      // 外发光效果
      if (isHovered || isSelected) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius + 10, 0, Math.PI * 2)
        ctx.fillStyle = color + '30'
        ctx.fill()
      }

      // 节点圆圈
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()

      // 选中边框
      if (isSelected) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius + 5, 0, Math.PI * 2)
        ctx.strokeStyle = COLORS.selected
        ctx.lineWidth = 4
        ctx.stroke()
      }

      // 节点文字
      ctx.fillStyle = 'white'
      ctx.font = `bold ${node.id === 'center' ? 16 : 13}px system-ui`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      const maxLen = node.id === 'center' ? 10 : 8
      let title = node.title
      if (title.length > maxLen) {
        title = title.substring(0, maxLen - 1) + '...'
      }
      ctx.fillText(title, node.x, node.y)

      // 关联度标签
      if (node.id !== 'center') {
        ctx.fillStyle = '#666'
        ctx.font = '11px system-ui'
        ctx.fillText(`${(node.relevance * 100).toFixed(0)}%`, node.x, node.y + radius + 15)
      }

      // 来源图标
      const icon = getSourceIcon(node.source)
      ctx.font = '14px system-ui'
      ctx.fillText(icon, node.x - radius + 15, node.y - radius + 20)
    })
  }, [graphData, hoveredNode, selectedNode, filterCategory])

  const getSourceIcon = (source: string): string => {
    const icons: Record<string, string> = {
      'center': '⭐',
      'wikipedia': '📚',
      'arxiv': '📄',
      'github': '💻',
      'pubmed': '🏥',
      'crossref': '📑',
      'semantic_scholar': '🎓',
      'zhihu': '❓',
      'bilibili': '📺',
      'recommendation': '💡'
    }
    return icons[source] || '📄'
  }

  // 动画循环
  useEffect(() => {
    if (graphData.nodes.length === 0) return

    const animate = () => {
      if (viewMode === 'force') {
        const newData = runForceLayout(graphData)
        setGraphData(newData)
      }
      drawGraph()
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [graphData, viewMode, runForceLayout, drawGraph])

  // 初始化搜索
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      setLoadingProgress(0)
      
      const results = await searchAllSources(query)
      const data = buildGraphData(results, query)
      setGraphData(data)
      setLoading(false)
    }

    init()
  }, [query, buildGraphData])

  // 鼠标事件处理
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (canvas.width / rect.width)
    const y = (e.clientY - rect.top) * (canvas.height / rect.height)

    // 查找悬停的节点
    let hovered: string | null = null
    for (const node of graphData.nodes) {
      const radius = node.id === 'center' ? 45 : 25 + node.relevance * 20
      const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
      if (dist <= radius) {
        hovered = node.id
        break
      }
    }
    setHoveredNode(hovered)
  }

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (canvas.width / rect.width)
    const y = (e.clientY - rect.top) * (canvas.height / rect.height)

    for (const node of graphData.nodes) {
      const radius = node.id === 'center' ? 45 : 25 + node.relevance * 20
      const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
      if (dist <= radius) {
        setSelectedNode(node)
        return
      }
    }
    setSelectedNode(null)
  }

  // 统计信息
  const stats = {
    total: graphData.nodes.length - 1,
    bySource: {} as Record<string, number>
  }
  graphData.nodes.forEach(node => {
    if (node.id !== 'center') {
      stats.bySource[node.source] = (stats.bySource[node.source] || 0) + 1
    }
  })

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.9)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <div style={{ color: 'white', fontSize: '24px', marginBottom: '20px' }}>
          🕸️ 正在构建知识图谱网络...
        </div>
        <div style={{ 
          width: '300px', 
          height: '8px', 
          background: '#333', 
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${loadingProgress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #667eea, #764ba2)',
            transition: 'width 0.3s'
          }} />
        </div>
        <div style={{ color: '#999', marginTop: '10px', fontSize: '14px' }}>
          正在搜索: 维基百科 · arXiv · GitHub · PubMed · 知乎 · B站...
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.95)',
        zIndex: 99999,
        display: 'flex'
      }}
      onClick={onClose}
    >
      {/* 左侧控制面板 */}
      <div 
        style={{
          width: '320px',
          background: '#1a1a2e',
          padding: '20px',
          overflow: 'auto',
          color: 'white'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>🕸️ 知识图谱</h2>
          <p style={{ margin: 0, color: '#999', fontSize: '14px' }}>"{query}"</p>
        </div>

        {/* 统计信息 */}
        <div style={{ 
          background: '#16213e', 
          padding: '15px', 
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#667eea' }}>
            📊 统计信息
          </h4>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
            {stats.total} 个关联节点
          </div>
          {Object.entries(stats.bySource).map(([source, count]) => (
            <div key={source} style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              fontSize: '13px',
              marginBottom: '5px'
            }}>
              <span>{getSourceIcon(source)} {source}</span>
              <span style={{ color: '#999' }}>{count}</span>
            </div>
          ))}
        </div>

        {/* 视图模式 */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#667eea' }}>
            🎨 视图模式
          </h4>
          <div style={{ display: 'flex', gap: '5px' }}>
            {['force', 'circular', 'hierarchical'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: viewMode === mode ? '#667eea' : '#16213e',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {mode === 'force' ? '力导向' : mode === 'circular' ? '环形' : '层次'}
              </button>
            ))}
          </div>
        </div>

        {/* 来源筛选 */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#667eea' }}>
            🔍 来源筛选
          </h4>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              background: '#16213e',
              border: '1px solid #333',
              borderRadius: '6px',
              color: 'white'
            }}
          >
            <option value="all">全部来源</option>
            <option value="wiki">📚 维基百科</option>
            <option value="academic">🎓 学术文献</option>
            <option value="tech">💻 技术文档</option>
            <option value="qa">❓ 问答社区</option>
          </select>
        </div>

        {/* 选中节点详情 */}
        {selectedNode && (
          <div style={{ 
            background: '#16213e', 
            padding: '15px', 
            borderRadius: '10px',
            border: '2px solid #f59e0b'
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#f59e0b' }}>
              📌 节点详情
            </h4>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
              {selectedNode.title}
            </div>
            <div style={{ fontSize: '13px', color: '#999', marginBottom: '10px', lineHeight: '1.5' }}>
              {selectedNode.content}
            </div>
            <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
              <span style={{ color: '#667eea' }}>
                关联度: {(selectedNode.relevance * 100).toFixed(1)}%
              </span>
              <span style={{ color: '#999' }}>
                来源: {getSourceIcon(selectedNode.source)} {selectedNode.source}
              </span>
            </div>
          </div>
        )}

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            background: '#e74c3c',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          ✕ 关闭
        </button>
      </div>

      {/* 右侧画布区域 */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          style={{
            display: 'block',
            cursor: hoveredNode ? 'pointer' : 'default'
          }}
        />

        {/* 图例 */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0,0,0,0.8)',
          padding: '15px',
          borderRadius: '10px',
          color: 'white',
          fontSize: '12px'
        }}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>图例</div>
          {Object.entries(CATEGORY_COLORS).filter(([k]) => k !== 'center').map(([cat, color]) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <span style={{ 
                width: '12px', 
                height: '12px', 
                background: color, 
                borderRadius: '50%',
                marginRight: '8px'
              }} />
              <span>{getSourceIcon(cat)} {cat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default EnhancedGraphSearch
