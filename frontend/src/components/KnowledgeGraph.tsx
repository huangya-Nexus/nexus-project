import { useEffect, useRef, useState } from 'react'

interface Node {
  id: string
  title: string
  definition: string
  attributes: string[]
  examples: string[]
  level: string
  category?: string
  isExisting?: boolean
  x?: number
  y?: number
}

interface Edge {
  source: string
  target: string
  relation: string
  description: string
}

interface KnowledgeGraphProps {
  nodes: Node[]
  edges: Edge[]
  onNodeClick: (node: Node) => void
  selectedNode: Node | null
}

function KnowledgeGraph({ nodes, edges, onNodeClick, selectedNode }: KnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [animationFrame, setAnimationFrame] = useState(0)

  const nodePositions = useRef<Map<string, { x: number; y: number; vx?: number; vy?: number }>>(new Map())

  // 力导向布局初始化
  useEffect(() => {
    const positions = new Map<string, { x: number; y: number; vx: number; vy: number }>()
    const centerX = 400
    const centerY = 300
    
    // 根据层级分组布局
    const levelGroups: Record<string, Node[]> = {
      '基础': [],
      '进阶': [],
      '高级': [],
      '相关': []
    }
    
    nodes.forEach(node => {
      const level = node.level || '基础'
      if (!levelGroups[level]) levelGroups[level] = []
      levelGroups[level].push(node)
    })
    
    // 分层布局
    const levels = ['基础', '进阶', '高级', '相关']
    const levelY = { '基础': 450, '进阶': 300, '高级': 150, '相关': 300 }
    
    levels.forEach(level => {
      const groupNodes = levelGroups[level] || []
      const count = groupNodes.length
      const spacing = count > 1 ? 600 / (count - 1) : 0
      
      groupNodes.forEach((node, index) => {
        const x = count > 1 ? 100 + index * spacing : centerX
        const y = levelY[level as keyof typeof levelY] || centerY
        
        // 添加一些随机偏移避免重叠
        const randomOffset = node.isExisting ? 150 : 0
        const angle = (index / Math.max(count, 1)) * Math.PI * 2
        
        positions.set(node.id, {
          x: node.x !== undefined ? centerX + node.x : x + Math.cos(angle) * randomOffset,
          y: node.y !== undefined ? centerY + node.y : y + Math.sin(angle) * randomOffset,
          vx: 0,
          vy: 0
        })
      })
    })
    
    nodePositions.current = positions
  }, [nodes])

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

    // 清空画布（使用渐变背景）
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#f8fafc')
    gradient.addColorStop(1, '#f1f5f9')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制网格背景
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 1
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, canvas.height)
      ctx.stroke()
    }
    for (let i = 0; i < canvas.height; i += 50) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(canvas.width, i)
      ctx.stroke()
    }

    // 绘制边（带动画效果）
    edges.forEach((edge, index) => {
      const sourcePos = nodePositions.current.get(edge.source)
      const targetPos = nodePositions.current.get(edge.target)
      
      if (sourcePos && targetPos) {
        const sx = (sourcePos.x + offset.x) * scale
        const sy = (sourcePos.y + offset.y) * scale
        const tx = (targetPos.x + offset.x) * scale
        const ty = (targetPos.y + offset.y) * scale

        // 绘制带渐变效果的连线
        const lineGradient = ctx.createLinearGradient(sx, sy, tx, ty)
        lineGradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)')
        lineGradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.6)')
        lineGradient.addColorStop(1, 'rgba(99, 102, 241, 0.3)')
        
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.lineTo(tx, ty)
        ctx.strokeStyle = lineGradient
        ctx.lineWidth = 3 * scale
        ctx.lineCap = 'round'
        ctx.stroke()

        // 绘制流动效果
        const flowOffset = (animationFrame * 2 + index * 50) % 100 / 100
        const fx = sx + (tx - sx) * flowOffset
        const fy = sy + (ty - sy) * flowOffset
        
        ctx.beginPath()
        ctx.arc(fx, fy, 4 * scale, 0, 2 * Math.PI)
        ctx.fillStyle = 'rgba(99, 102, 241, 0.8)'
        ctx.fill()

        // 绘制关系标签（带背景）
        const midX = (sx + tx) / 2
        const midY = (sy + ty) / 2
        
        const labelWidth = ctx.measureText(edge.relation).width + 16 * scale
        const labelHeight = 20 * scale
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
        ctx.beginPath()
        ctx.roundRect(midX - labelWidth / 2, midY - labelHeight / 2, labelWidth, labelHeight, 10 * scale)
        ctx.fill()
        
        ctx.strokeStyle = '#c7d2fe'
        ctx.lineWidth = 1
        ctx.stroke()
        
        ctx.fillStyle = '#4f46e5'
        ctx.font = `bold ${10 * scale}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(edge.relation, midX, midY)
      }
    })

    // 绘制节点
    nodes.forEach(node => {
      const pos = nodePositions.current.get(node.id)
      if (!pos) return

      const x = (pos.x + offset.x) * scale
      const y = (pos.y + offset.y) * scale
      const baseRadius = node.isExisting ? 35 : 45
      const radius = baseRadius * scale

      // 节点颜色配置
      const colorMap: Record<string, { bg: string; border: string; glow: string }> = {
        '基础': { bg: '#22c55e', border: '#16a34a', glow: 'rgba(34, 197, 94, 0.4)' },
        '进阶': { bg: '#3b82f6', border: '#2563eb', glow: 'rgba(59, 130, 246, 0.4)' },
        '高级': { bg: '#8b5cf6', border: '#7c3aed', glow: 'rgba(139, 92, 246, 0.4)' },
        '相关': { bg: '#f59e0b', border: '#d97706', glow: 'rgba(245, 158, 11, 0.4)' }
      }
      
      const colors = colorMap[node.level] || { bg: '#6b7280', border: '#4b5563', glow: 'rgba(107, 114, 128, 0.4)' }
      const isSelected = selectedNode?.id === node.id
      const isHovered = hoveredNode?.id === node.id

      // 绘制发光效果
      if (isSelected || isHovered) {
        const glowRadius = radius + 15 * scale
        const glowGradient = ctx.createRadialGradient(x, y, radius, x, y, glowRadius)
        glowGradient.addColorStop(0, colors.glow)
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
        
        ctx.fillStyle = glowGradient
        ctx.beginPath()
        ctx.arc(x, y, glowRadius, 0, 2 * Math.PI)
        ctx.fill()
      }

      // 绘制节点圆形（带渐变）
      const nodeGradient = ctx.createRadialGradient(x - radius/3, y - radius/3, 0, x, y, radius)
      nodeGradient.addColorStop(0, colors.bg)
      nodeGradient.addColorStop(1, colors.border)
      
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = nodeGradient
      ctx.fill()
      
      // 绘制边框
      ctx.strokeStyle = isSelected ? '#1f2937' : 'white'
      ctx.lineWidth = isSelected ? 4 * scale : 3 * scale
      ctx.stroke()

      // 绘制节点图标
      const icons: Record<string, string> = {
        '基础': '🌱',
        '进阶': '📚',
        '高级': '🎯',
        '相关': '🔗'
      }
      ctx.font = `${20 * scale}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(icons[node.level] || '📖', x, y - 8 * scale)

      // 绘制节点文字
      ctx.fillStyle = 'white'
      ctx.font = `bold ${11 * scale}px sans-serif`
      
      // 文字换行显示
      const maxChars = 4
      const words = node.title.length > maxChars * 2 
        ? [node.title.slice(0, maxChars), node.title.slice(maxChars, maxChars * 2) + '...']
        : [node.title.slice(0, maxChars), node.title.slice(maxChars)]
      
      words.filter(w => w).forEach((word, i) => {
        ctx.fillText(word, x, y + 8 * scale + i * 13 * scale)
      })

      // 绘制级别标签
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.font = `${8 * scale}px sans-serif`
      ctx.fillText(node.level, x, y + radius + 12 * scale)
    })
  }, [nodes, edges, scale, offset, selectedNode, hoveredNode, animationFrame])

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left) / scale - offset.x
    const y = (e.clientY - rect.top) / scale - offset.y

    const clickedNode = nodes.find(node => {
      const pos = nodePositions.current.get(node.id)
      if (!pos) return false
      const dx = x - pos.x
      const dy = y - pos.y
      return Math.sqrt(dx * dx + dy * dy) < 45
    })

    if (clickedNode) {
      onNodeClick(clickedNode)
    } else {
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left) / scale - offset.x
    const y = (e.clientY - rect.top) / scale - offset.y

    const hovered = nodes.find(node => {
      const pos = nodePositions.current.get(node.id)
      if (!pos) return false
      const dx = x - pos.x
      const dy = y - pos.y
      return Math.sqrt(dx * dx + dy * dy) < 45
    })
    setHoveredNode(hovered || null)

    if (isDragging) {
      setOffset(prev => ({
        x: prev.x + (e.clientX - dragStart.x) / scale,
        y: prev.y + (e.clientY - dragStart.y) / scale
      }))
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const newScale = Math.max(0.5, Math.min(2, scale + (e.deltaY > 0 ? -0.1 : 0.1)))
    setScale(newScale)
  }

  return (
    <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{
          border: '2px solid #e2e8f0',
          borderRadius: '16px',
          cursor: isDragging ? 'grabbing' : hoveredNode ? 'pointer' : 'grab',
          background: 'white'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      
      {/* 控制按钮 */}
      <div style={{
        position: 'absolute',
        bottom: '15px',
        right: '15px',
        display: 'flex',
        gap: '10px',
        background: 'rgba(255,255,255,0.95)',
        padding: '10px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <button onClick={() => setScale(s => Math.min(2, s + 0.2))}
          style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>+</button>
        <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
          style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>-</button>
        <button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }) }}
          style={{ padding: '0 16px', height: '36px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '13px' }}>重置</button>
      </div>

      {/* 图例 */}
      <div style={{
        position: 'absolute',
        top: '15px',
        left: '15px',
        background: 'rgba(255,255,255,0.95)',
        padding: '15px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        fontSize: '13px'
      }}>
        <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#374151' }}>📊 知识层级</div>
        {[
          { level: '基础', color: '#22c55e', icon: '🌱', desc: '入门必备' },
          { level: '进阶', color: '#3b82f6', icon: '📚', desc: '核心能力' },
          { level: '高级', color: '#8b5cf6', icon: '🎯', desc: '专业精通' },
          { level: '相关', color: '#f59e0b', icon: '🔗', desc: '已有知识' }
        ].map(({ level, color, icon, desc }) => (
          <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
            <span style={{ fontWeight: 'bold', color }}>{icon} {level}</span>
            <span style={{ color: '#9ca3af', fontSize: '11px' }}>{desc}</span>
          </div>
        ))}
      </div>

      {/* 统计信息 */}
      <div style={{
        position: 'absolute',
        top: '15px',
        right: '15px',
        background: 'rgba(255,255,255,0.95)',
        padding: '12px 16px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        fontSize: '12px',
        color: '#6b7280'
      }}>
        <div>📚 {nodes.length} 知识点</div>
        <div>🔗 {edges.length} 关联</div>
        <div>🔍 缩放: {Math.round(scale * 100)}%</div>
      </div>
    </div>
  )
}

export default KnowledgeGraph
