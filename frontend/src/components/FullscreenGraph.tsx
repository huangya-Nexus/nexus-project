import { useEffect, useRef, useState, useCallback } from 'react'

interface Node {
  id: string
  title: string
  definition: string
  level: string
  x?: number
  y?: number
  vx?: number
  vy?: number
  attributes?: string[]
  citations?: Array<{ source: string; type: string; reliability: string }>
}

interface Edge {
  source: string
  target: string
  relation: string
}

interface FullscreenGraphProps {
  nodes: Node[]
  edges: Edge[]
  onNodeClick: (node: Node) => void
  selectedNode: Node | null
  onClose: () => void
}

function FullscreenGraph({ nodes, edges, onNodeClick, selectedNode, onClose }: FullscreenGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showLabels, setShowLabels] = useState(true)
  const [animationFrame, setAnimationFrame] = useState(0)
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight })

  const nodePositions = useRef<Map<string, { x: number; y: number; vx: number; vy: number }>>(new Map())

  // 初始化画布尺寸
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // 力导向布局初始化
  useEffect(() => {
    const positions = new Map<string, { x: number; y: number; vx: number; vy: number }>()
    const centerX = dimensions.width / 2
    const centerY = dimensions.height / 2
    
    // 根据层级分组
    const levelGroups: Record<string, Node[]> = {
      '基础': [],
      '进阶': [],
      '高级': [],
      '已有': []
    }
    
    nodes.forEach(node => {
      const level = node.level || '基础'
      if (!levelGroups[level]) levelGroups[level] = []
      levelGroups[level].push(node)
    })
    
    // 分层环形布局
    const levels = ['基础', '进阶', '高级', '已有']
    const levelRadius = { '基础': 200, '进阶': 350, '高级': 500, '已有': 650 }
    
    levels.forEach(level => {
      const groupNodes = levelGroups[level] || []
      const count = groupNodes.length
      const radius = levelRadius[level as keyof typeof levelRadius] || 300
      
      groupNodes.forEach((node, index) => {
        const angle = count > 1 ? (index / count) * 2 * Math.PI : 0
        positions.set(node.id, {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          vx: 0,
          vy: 0
        })
      })
    })
    
    nodePositions.current = positions
  }, [nodes, dimensions])

  // 动画循环
  useEffect(() => {
    let frameId: number
    const animate = () => {
      setAnimationFrame(prev => prev + 1)
      frameId = requestAnimationFrame(animate)
    }
    frameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameId)
  }, [])

  // 绘制
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制网格背景
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 1
    const gridSize = 50 * scale
    const offsetX = (offset.x * scale) % gridSize
    const offsetY = (offset.y * scale) % gridSize
    
    for (let i = offsetX; i < canvas.width; i += gridSize) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, canvas.height)
      ctx.stroke()
    }
    for (let i = offsetY; i < canvas.height; i += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(canvas.width, i)
      ctx.stroke()
    }

    // 绘制边
    edges.forEach((edge, index) => {
      const sourcePos = nodePositions.current.get(edge.source)
      const targetPos = nodePositions.current.get(edge.target)
      
      if (sourcePos && targetPos) {
        const sx = (sourcePos.x + offset.x) * scale
        const sy = (sourcePos.y + offset.y) * scale
        const tx = (targetPos.x + offset.x) * scale
        const ty = (targetPos.y + offset.y) * scale

        // 渐变连线
        const gradient = ctx.createLinearGradient(sx, sy, tx, ty)
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.6)')
        gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.8)')
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.6)')
        
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.lineTo(tx, ty)
        ctx.strokeStyle = gradient
        ctx.lineWidth = 3 * scale
        ctx.lineCap = 'round'
        ctx.stroke()

        // 流动粒子效果
        const flowOffset = (animationFrame * 3 + index * 100) % 100 / 100
        const fx = sx + (tx - sx) * flowOffset
        const fy = sy + (ty - sy) * flowOffset
        
        ctx.beginPath()
        ctx.arc(fx, fy, 6 * scale, 0, 2 * Math.PI)
        ctx.fillStyle = '#a855f7'
        ctx.shadowColor = '#a855f7'
        ctx.shadowBlur = 15 * scale
        ctx.fill()
        ctx.shadowBlur = 0

        // 关系标签
        if (showLabels) {
          const midX = (sx + tx) / 2
          const midY = (sy + ty) / 2
          
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
          ctx.beginPath()
          ctx.roundRect(midX - 40 * scale, midY - 12 * scale, 80 * scale, 24 * scale, 12 * scale)
          ctx.fill()
          
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)'
          ctx.lineWidth = 1
          ctx.stroke()
          
          ctx.fillStyle = '#e9d5ff'
          ctx.font = `bold ${11 * scale}px sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(edge.relation, midX, midY)
        }
      }
    })

    // 绘制节点
    nodes.forEach(node => {
      const pos = nodePositions.current.get(node.id)
      if (!pos) return

      const x = (pos.x + offset.x) * scale
      const y = (pos.y + offset.y) * scale
      const baseRadius = node.level === '已有' ? 25 : 35
      const radius = baseRadius * scale

      // 颜色配置
      const colors: Record<string, { main: string; glow: string; border: string }> = {
        '基础': { main: '#22c55e', glow: 'rgba(34, 197, 94, 0.5)', border: '#16a34a' },
        '进阶': { main: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)', border: '#2563eb' },
        '高级': { main: '#a855f7', glow: 'rgba(168, 85, 247, 0.5)', border: '#9333ea' },
        '已有': { main: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)', border: '#d97706' }
      }
      
      const color = colors[node.level] || colors['基础']
      const isSelected = selectedNode?.id === node.id
      const isHovered = hoveredNode?.id === node.id

      // 发光效果
      if (isSelected || isHovered) {
        const glowRadius = radius + 20 * scale
        const glowGradient = ctx.createRadialGradient(x, y, radius, x, y, glowRadius)
        glowGradient.addColorStop(0, color.glow)
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        
        ctx.fillStyle = glowGradient
        ctx.beginPath()
        ctx.arc(x, y, glowRadius, 0, 2 * Math.PI)
        ctx.fill()
      }

      // 节点圆形
      const nodeGradient = ctx.createRadialGradient(x - radius/3, y - radius/3, 0, x, y, radius)
      nodeGradient.addColorStop(0, color.main)
      nodeGradient.addColorStop(1, color.border)
      
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = nodeGradient
      ctx.fill()
      
      // 边框
      ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = isSelected ? 4 * scale : 2 * scale
      ctx.stroke()

      // 选中标记
      if (isSelected) {
        ctx.beginPath()
        ctx.arc(x, y, radius + 8 * scale, 0, 2 * Math.PI)
        ctx.strokeStyle = '#fbbf24'
        ctx.lineWidth = 2 * scale
        ctx.setLineDash([5 * scale, 5 * scale])
        ctx.stroke()
        ctx.setLineDash([])
      }

      // 节点文字
      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${12 * scale}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // 文字截断
      const maxChars = 6
      const displayTitle = node.title.length > maxChars 
        ? node.title.substring(0, maxChars) + '...'
        : node.title
      
      ctx.fillText(displayTitle, x, y)

      // 级别标签
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.font = `${9 * scale}px sans-serif`
      ctx.fillText(node.level, x, y + radius + 15 * scale)
    })
  }, [nodes, edges, scale, offset, selectedNode, hoveredNode, animationFrame, showLabels, dimensions])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left) / scale - offset.x
    const y = (e.clientY - rect.top) / scale - offset.y

    const clickedNode = nodes.find(node => {
      const pos = nodePositions.current.get(node.id)
      if (!pos) return false
      const dx = x - pos.x
      const dy = y - pos.y
      return Math.sqrt(dx * dx + dy * dy) < 40
    })

    if (clickedNode) {
      onNodeClick(clickedNode)
    } else {
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }, [nodes, scale, offset, onNodeClick])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left) / scale - offset.x
    const y = (e.clientY - rect.top) / scale - offset.y

    const hovered = nodes.find(node => {
      const pos = nodePositions.current.get(node.id)
      if (!pos) return false
      const dx = x - pos.x
      const dy = y - pos.y
      return Math.sqrt(dx * dx + dy * dy) < 40
    })
    setHoveredNode(hovered || null)

    if (isDragging) {
      setOffset(prev => ({
        x: prev.x + (e.clientX - dragStart.x) / scale,
        y: prev.y + (e.clientY - dragStart.y) / scale
      }))
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }, [nodes, scale, offset, isDragging, dragStart])

  const handleMouseUp = useCallback(() => setIsDragging(false), [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(s => Math.max(0.3, Math.min(3, s * delta)))
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])



  return (
    <div 
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#0f172a',
        zIndex: 99999
      }}
    >
      {/* 顶部工具栏 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderBottom: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h2 style={{ margin: 0, color: '#e2e8f0', fontSize: '18px' }}>
            🕸️ 知识图谱视图
          </h2>
          <input
            type="text"
            placeholder="搜索节点..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#e2e8f0',
              width: '200px'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setShowLabels(!showLabels)}
            style={{
              background: showLabels ? '#3b82f6' : '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#e2e8f0',
              cursor: 'pointer'
            }}
          >
            {showLabels ? '隐藏标签' : '显示标签'}
          </button>
          <button
            onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }) }}
            style={{
              background: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#e2e8f0',
              cursor: 'pointer'
            }}
          >
            重置视图
          </button>
          <button
            onClick={toggleFullscreen}
            style={{
              background: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#e2e8f0',
              cursor: 'pointer'
            }}
          >
            {isFullscreen ? '退出全屏' : '全屏'}
          </button>
          <button
            onClick={onClose}
            style={{
              background: '#ef4444',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* 画布 */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          cursor: isDragging ? 'grabbing' : hoveredNode ? 'pointer' : 'grab',
          marginTop: '60px'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* 左侧面板 - 节点详情 */}
      {selectedNode && (
        <div style={{
          position: 'absolute',
          left: '20px',
          top: '80px',
          width: '350px',
          maxHeight: 'calc(100vh - 100px)',
          background: 'rgba(30, 41, 59, 0.98)',
          borderRadius: '16px',
          border: '1px solid #475569',
          padding: '20px',
          overflow: 'auto',
          zIndex: 100
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '18px' }}>{selectedNode.title}</h3>
            <span style={{
              background: selectedNode.level === '基础' ? '#22c55e' : 
                         selectedNode.level === '进阶' ? '#3b82f6' : 
                         selectedNode.level === '高级' ? '#a855f7' : '#f59e0b',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px'
            }}>
              {selectedNode.level}
            </span>
          </div>
          
          <p style={{ color: '#94a3b8', lineHeight: '1.6', marginBottom: '15px' }}>
            {selectedNode.definition}
          </p>

          {selectedNode.attributes && (
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ color: '#e2e8f0', fontSize: '14px', marginBottom: '8px' }}>关键特征</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedNode.attributes.map((attr: string, i: number) => (
                  <span key={i} style={{
                    background: '#334155',
                    color: '#e2e8f0',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}>
                    {attr}
                  </span>
                ))}
              </div>
            </div>
          )}

          {selectedNode.citations && (
            <div>
              <h4 style={{ color: '#e2e8f0', fontSize: '14px', marginBottom: '8px' }}>参考来源</h4>
              {selectedNode.citations.map((cite: any, i: number) => (
                <div key={i} style={{
                  background: '#1e293b',
                  padding: '8px',
                  borderRadius: '6px',
                  marginBottom: '6px',
                  fontSize: '12px'
                }}>
                  <div style={{ color: '#60a5fa' }}>{cite.source}</div>
                  <div style={{ color: '#94a3b8' }}>{cite.type} · 可信度: {cite.reliability}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 右侧面板 - 统计信息 */}
      <div style={{
        position: 'absolute',
        right: '20px',
        top: '80px',
        background: 'rgba(30, 41, 59, 0.98)',
        borderRadius: '16px',
        border: '1px solid #475569',
        padding: '15px',
        zIndex: 100,
        minWidth: '200px'
      }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#e2e8f0', fontSize: '14px' }}>📊 图谱统计</h4>
        <div style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '2' }}>
          <div>节点总数: {nodes.length}</div>
          <div>关联数量: {edges.length}</div>
          <div>当前缩放: {Math.round(scale * 100)}%</div>
          <div>基础节点: {nodes.filter(n => n.level === '基础').length}</div>
          <div>进阶节点: {nodes.filter(n => n.level === '进阶').length}</div>
          <div>高级节点: {nodes.filter(n => n.level === '高级').length}</div>
        </div>
      </div>

      {/* 底部控制栏 */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '10px',
        background: 'rgba(30, 41, 59, 0.98)',
        padding: '10px',
        borderRadius: '12px',
        border: '1px solid #475569',
        zIndex: 100
      }}>
        <button onClick={() => setScale(s => Math.max(0.3, s - 0.2))}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            border: '1px solid #475569',
            background: '#1e293b',
            color: '#e2e8f0',
            cursor: 'pointer',
            fontSize: '20px'
          }}>−</button>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 15px',
          color: '#e2e8f0',
          fontSize: '14px'
        }}>
          {Math.round(scale * 100)}%
        </div>
        <button onClick={() => setScale(s => Math.min(3, s + 0.2))}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            border: '1px solid #475569',
            background: '#1e293b',
            color: '#e2e8f0',
            cursor: 'pointer',
            fontSize: '20px'
          }}>+</button>
      </div>
    </div>
  )
}

export default FullscreenGraph
