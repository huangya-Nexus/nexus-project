import { useEffect, useRef, useState } from 'react'

interface Node {
  id: string
  title: string
  definition: string
  attributes: string[]
  examples: string[]
  level: string
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

  // 节点位置计算（力导向布局简化版）
  const nodePositions = useRef<Map<string, { x: number; y: number }>>(new Map())

  useEffect(() => {
    // 初始化节点位置
    const positions = new Map<string, { x: number; y: number }>()
    const centerX = 400
    const centerY = 300
    
    nodes.forEach((node, index) => {
      if (node.x !== undefined && node.y !== undefined) {
        positions.set(node.id, { x: centerX + node.x, y: centerY + node.y })
      } else {
        // 圆形布局
        const angle = (index / nodes.length) * 2 * Math.PI
        const radius = 150
        positions.set(node.id, {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        })
      }
    })
    
    nodePositions.current = positions
  }, [nodes])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制边
    edges.forEach(edge => {
      const sourcePos = nodePositions.current.get(edge.source)
      const targetPos = nodePositions.current.get(edge.target)
      
      if (sourcePos && targetPos) {
        const sx = (sourcePos.x + offset.x) * scale
        const sy = (sourcePos.y + offset.y) * scale
        const tx = (targetPos.x + offset.x) * scale
        const ty = (targetPos.y + offset.y) * scale

        // 绘制连线
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.lineTo(tx, ty)
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 2 * scale
        ctx.stroke()

        // 绘制关系标签
        const midX = (sx + tx) / 2
        const midY = (sy + ty) / 2
        ctx.fillStyle = '#64748b'
        ctx.font = `${10 * scale}px sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(edge.relation, midX, midY - 5)
      }
    })

    // 绘制节点
    nodes.forEach(node => {
      const pos = nodePositions.current.get(node.id)
      if (!pos) return

      const x = (pos.x + offset.x) * scale
      const y = (pos.y + offset.y) * scale
      const radius = 40 * scale

      // 节点颜色根据级别
      const colorMap: Record<string, string> = {
        '基础': '#22c55e',
        '进阶': '#3b82f6',
        '高级': '#8b5cf6'
      }
      const color = colorMap[node.level] || '#6b7280'

      // 绘制节点圆形
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = selectedNode?.id === node.id ? '#fbbf24' : color
      ctx.fill()
      
      // 选中/悬停效果
      if (selectedNode?.id === node.id || hoveredNode?.id === node.id) {
        ctx.strokeStyle = '#1f2937'
        ctx.lineWidth = 3 * scale
        ctx.stroke()
      }

      // 绘制节点文字
      ctx.fillStyle = 'white'
      ctx.font = `bold ${12 * scale}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // 文字换行显示
      const words = node.title.match(/.{1,4}/g) || [node.title]
      words.slice(0, 2).forEach((word, i) => {
        ctx.fillText(word, x, y - 5 + i * 14 * scale)
      })
    })
  }, [nodes, edges, scale, offset, selectedNode, hoveredNode])

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left) / scale - offset.x
    const y = (e.clientY - rect.top) / scale - offset.y

    // 检查是否点击了节点
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
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left) / scale - offset.x
    const y = (e.clientY - rect.top) / scale - offset.y

    // 检查悬停
    const hovered = nodes.find(node => {
      const pos = nodePositions.current.get(node.id)
      if (!pos) return false
      const dx = x - pos.x
      const dy = y - pos.y
      return Math.sqrt(dx * dx + dy * dy) < 40
    })
    setHoveredNode(hovered || null)

    // 拖拽
    if (isDragging) {
      setOffset(prev => ({
        x: prev.x + (e.clientX - dragStart.x) / scale,
        y: prev.y + (e.clientY - dragStart.y) / scale
      }))
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const newScale = Math.max(0.5, Math.min(2, scale + (e.deltaY > 0 ? -0.1 : 0.1)))
    setScale(newScale)
  }

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          cursor: isDragging ? 'grabbing' : hoveredNode ? 'pointer' : 'grab'
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
        bottom: '10px',
        right: '10px',
        display: 'flex',
        gap: '8px'
      }}>
        <button
          onClick={() => setScale(s => Math.min(2, s + 0.2))}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            background: 'white',
            cursor: 'pointer',
            fontSize: '18px'
          }}
        >
          +
        </button>
        <button
          onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            background: 'white',
            cursor: 'pointer',
            fontSize: '18px'
          }}
        >
          -
        </button>
        <button
          onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }) }}
          style={{
            padding: '0 12px',
            height: '36px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            background: 'white',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          重置
        </button>
      </div>

      {/* 图例 */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(255,255,255,0.95)',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        fontSize: '12px'
      }}>
        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>知识层级</div>
        {[
          { level: '基础', color: '#22c55e' },
          { level: '进阶', color: '#3b82f6' },
          { level: '高级', color: '#8b5cf6' }
        ].map(({ level, color }) => (
          <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: color }} />
            <span>{level}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default KnowledgeGraph
