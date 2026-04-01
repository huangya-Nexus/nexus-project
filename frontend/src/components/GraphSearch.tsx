import { useState, useEffect, useRef } from 'react'

interface KnowledgeNode {
  id: string
  title: string
  content: string
  relevance: number
  x: number
  y: number
}

interface KnowledgeEdge {
  source: string
  target: string
  strength: number
}

interface GraphSearchResult {
  centerNode: KnowledgeNode
  relatedNodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
}

interface GraphSearchProps {
  query: string
  onClose: () => void
  onNodeClick: (nodeId: string) => void
}

const API_URL = 'http://localhost:3001'

function GraphSearch({ query, onClose, onNodeClick }: GraphSearchProps) {
  const [result, setResult] = useState<GraphSearchResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [_error, setError] = useState('')
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    performGraphSearch()
  }, [query])

  useEffect(() => {
    if (result && canvasRef.current) {
      drawGraph()
    }
  }, [result, selectedNode])

  const performGraphSearch = async () => {
    setLoading(true)
    setError('')

    try {
      // 1. 搜索本地数据库找到最匹配的知识点
      const res = await fetch(`${API_URL}/api/search/public?q=${encodeURIComponent(query)}`)
      
      if (!res.ok) throw new Error('搜索失败')
      
      const data = await res.json()
      
      // 2. 构建知识图谱数据
      const graphData = buildGraphData(data, query)
      setResult(graphData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const buildGraphData = (data: any, query: string): GraphSearchResult => {
    const nodes: KnowledgeNode[] = []
    const edges: KnowledgeEdge[] = []

    // 中心节点（搜索关键词）
    const centerNode: KnowledgeNode = {
      id: 'center',
      title: query,
      content: `搜索: ${query}`,
      relevance: 1.0,
      x: 400,
      y: 300
    }
    nodes.push(centerNode)

    // 从搜索结果中提取节点
    let nodeId = 1
    
    // 添加知识点节点
    if (data.nodes?.items) {
      data.nodes.items.forEach((node: any, index: number) => {
        const relevance = 1 - (index * 0.1) // 按排名递减关联度
        const angle = (index / Math.max(data.nodes.items.length, 1)) * Math.PI * 2
        const distance = 150 + Math.random() * 100
        
        nodes.push({
          id: `node-${nodeId++}`,
          title: node.title,
          content: node.content,
          relevance: Math.max(relevance, 0.3),
          x: centerNode.x + Math.cos(angle) * distance,
          y: centerNode.y + Math.sin(angle) * distance
        })

        edges.push({
          source: 'center',
          target: `node-${nodeId - 1}`,
          strength: relevance
        })
      })
    }

    // 添加图谱中的其他相关节点（模拟更多关联）
    const relatedKeywords = extractKeywords(query)
    relatedKeywords.forEach((keyword, index) => {
      const angle = (index / relatedKeywords.length) * Math.PI * 2 + Math.PI / 4
      const distance = 200 + Math.random() * 50
      
      nodes.push({
        id: `related-${index}`,
        title: keyword,
        content: `相关概念: ${keyword}`,
        relevance: 0.5 + Math.random() * 0.3,
        x: centerNode.x + Math.cos(angle) * distance,
        y: centerNode.y + Math.sin(angle) * distance
      })

      edges.push({
        source: 'center',
        target: `related-${index}`,
        strength: 0.6
      })
    })

    return {
      centerNode,
      relatedNodes: nodes.filter(n => n.id !== 'center'),
      edges
    }
  }

  const extractKeywords = (text: string): string[] => {
    // 根据查询词生成相关关键词（模拟）
    const keywordMap: Record<string, string[]> = {
      '机器学习': ['深度学习', '神经网络', '数据挖掘', '人工智能', '算法', '模型训练', '监督学习', '无监督学习'],
      '政治': ['马克思主义', '经济学', '哲学', '社会主义', '资本主义', '政治学', '国际关系', '政治制度'],
      '历史': ['古代史', '近代史', '世界史', '中国历史', '欧洲历史', '战争史', '文明史', '考古学'],
      '编程': ['算法', '数据结构', '前端开发', '后端开发', '数据库', '操作系统', '网络编程', '软件工程']
    }

    for (const [key, words] of Object.entries(keywordMap)) {
      if (text.includes(key)) return words
    }

    // 默认返回通用相关词
    return ['概念A', '概念B', '概念C', '方法D', '应用E', '理论F']
  }

  const drawGraph = () => {
    const canvas = canvasRef.current
    if (!canvas || !result) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置画布大小
    canvas.width = 800
    canvas.height = 600

    // 清空画布
    ctx.fillStyle = '#f8f9fa'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制边
    result.edges.forEach(edge => {
      const sourceNode = [result.centerNode, ...result.relatedNodes].find(n => n.id === edge.source)
      const targetNode = [result.centerNode, ...result.relatedNodes].find(n => n.id === edge.target)
      
      if (sourceNode && targetNode) {
        ctx.beginPath()
        ctx.moveTo(sourceNode.x, sourceNode.y)
        ctx.lineTo(targetNode.x, targetNode.y)
        ctx.strokeStyle = `rgba(102, 126, 234, ${edge.strength * 0.5})`
        ctx.lineWidth = edge.strength * 3
        ctx.stroke()
      }
    })

    // 绘制节点
    const allNodes = [result.centerNode, ...result.relatedNodes]
    allNodes.forEach(node => {
      const isSelected = selectedNode === node.id
      const isCenter = node.id === 'center'
      
      // 节点圆圈
      ctx.beginPath()
      ctx.arc(node.x, node.y, isCenter ? 40 : 25 + node.relevance * 15, 0, Math.PI * 2)
      ctx.fillStyle = isCenter ? '#667eea' : isSelected ? '#f59e0b' : '#3b82f6'
      ctx.fill()
      
      // 选中效果
      if (isSelected) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, isCenter ? 45 : 30 + node.relevance * 15, 0, Math.PI * 2)
        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth = 3
        ctx.stroke()
      }

      // 节点文字
      ctx.fillStyle = 'white'
      ctx.font = `bold ${isCenter ? 14 : 12}px system-ui`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // 截断文字
      let displayTitle = node.title
      if (displayTitle.length > 6) {
        displayTitle = displayTitle.substring(0, 5) + '...'
      }
      ctx.fillText(displayTitle, node.x, node.y)

      // 关联度标签
      if (!isCenter) {
        ctx.fillStyle = '#666'
        ctx.font = '10px system-ui'
        ctx.fillText(`${(node.relevance * 100).toFixed(0)}%`, node.x, node.y + 35)
      }
    })
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !result) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // 检查点击了哪个节点
    const allNodes = [result.centerNode, ...result.relatedNodes]
    for (const node of allNodes) {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
      const radius = node.id === 'center' ? 40 : 25 + node.relevance * 15
      
      if (distance <= radius) {
        setSelectedNode(node.id)
        if (node.id !== 'center') {
          onNodeClick(node.id)
        }
        return
      }
    }

    setSelectedNode(null)
  }

  if (loading) {
    return (
      <div style={{
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
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>
          <div>🔍 正在构建知识图谱...</div>
          <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.7 }}>
            分析关键词关联度
          </div>
        </div>
      </div>
    )
  }

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
      padding: '20px'
    }} onClick={onClose}>
      <div 
        style={{
          background: 'white',
          borderRadius: '20px',
          width: '900px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0 }}>🕸️ 知识图谱: "{query}"</h2>
              <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
                找到 {result?.relatedNodes.length || 0} 个关联知识点
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
                cursor: 'pointer'
              }}
            >
              关闭
            </button>
          </div>
        </div>

        {/* 图谱画布 */}
        <div style={{ flex: 1, padding: '20px', background: '#f8f9fa' }}>
          {result && (
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              onClick={handleCanvasClick}
              style={{
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'block',
                margin: '0 auto'
              }}
            />
          )}

          {/* 图例 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '20px', 
            marginTop: '15px',
            fontSize: '13px',
            color: '#666'
          }}>
            <span><span style={{ color: '#667eea' }}>●</span> 中心关键词</span>
            <span><span style={{ color: '#3b82f6' }}>●</span> 相关知识点</span>
            <span><span style={{ color: '#f59e0b' }}>●</span> 选中节点</span>
            <span>— 关联强度</span>
          </div>
        </div>

        {/* 选中节点详情 */}
        {selectedNode && selectedNode !== 'center' && result && (
          <div style={{ 
            padding: '15px 20px', 
            background: '#fffbeb', 
            borderTop: '2px solid #f59e0b' 
          }}>
            {(() => {
              const node = result.relatedNodes.find(n => n.id === selectedNode)
              return node ? (
                <div>
                  <h4 style={{ margin: '0 0 5px 0' }}>{node.title}</h4>
                  <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{node.content}</p>
                  <small style={{ color: '#999' }}>关联度: {(node.relevance * 100).toFixed(1)}%</small>
                </div>
              ) : null
            })()}
          </div>
        )}

        {/* 底部提示 */}
        <div style={{ 
          padding: '10px 20px', 
          background: '#f3f4f6', 
          fontSize: '12px',
          color: '#666',
          textAlign: 'center'
        }}>
          💡 点击节点查看详情 | 线条粗细表示关联强度 | 圆圈大小表示关联度
        </div>
      </div>
    </div>
  )
}

export default GraphSearch
