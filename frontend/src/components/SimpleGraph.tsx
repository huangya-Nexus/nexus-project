import { useState, useEffect, useRef, useCallback } from 'react'

interface Node {
  id: string
  title: string
  content: string
  keywords?: string[]
  positionX?: number
  positionY?: number
}

interface Edge {
  id: string
  sourceId: string
  targetId: string
  type: string
  label?: string
}

interface GraphData {
  nodes: Node[]
  edges: Edge[]
}

interface SimpleGraphProps {
  data: GraphData
  onNodeClick?: (node: Node) => void
  onNodeDrag?: (node: Node, x: number, y: number) => void
  selectedNodeId?: string | null
  width?: number
  height?: number
}

function SimpleGraph({
  data,
  onNodeClick,
  onNodeDrag,
  selectedNodeId,
  width = 900,
  height = 600
}: SimpleGraphProps) {
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [draggingNode, setDraggingNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 初始化节点位置 - 使用力导向布局
  useEffect(() => {
    const newPositions: Record<string, { x: number; y: number }> = {}
    const centerX = width / 2
    const centerY = height / 2
    
    // 如果有保存的位置，使用保存的位置
    data.nodes.forEach((node) => {
      if (node.positionX !== undefined && node.positionY !== undefined) {
        newPositions[node.id] = { x: node.positionX, y: node.positionY }
      }
    })

    // 为新节点计算位置
    const unpositionedNodes = data.nodes.filter(n => !newPositions[n.id])
    if (unpositionedNodes.length > 0) {
      // 使用圆形布局作为初始位置
      const radius = Math.min(width, height) * 0.35
      unpositionedNodes.forEach((node, index) => {
        const angle = (index / unpositionedNodes.length) * 2 * Math.PI - Math.PI / 2
        newPositions[node.id] = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        }
      })
    }

    // 简单的力导向布局迭代
    for (let iteration = 0; iteration < 50; iteration++) {
      const forces: Record<string, { fx: number; fy: number }> = {}
      
      data.nodes.forEach(node => {
        forces[node.id] = { fx: 0, fy: 0 }
      })

      // 斥力：节点之间相互排斥
      for (let i = 0; i < data.nodes.length; i++) {
        for (let j = i + 1; j < data.nodes.length; j++) {
          const nodeA = data.nodes[i]
          const nodeB = data.nodes[j]
          const posA = newPositions[nodeA.id]
          const posB = newPositions[nodeB.id]
          
          const dx = posB.x - posA.x
          const dy = posB.y - posA.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 1
          
          const force = 5000 / (distance * distance)
          const fx = (dx / distance) * force
          const fy = (dy / distance) * force
          
          forces[nodeA.id].fx -= fx
          forces[nodeA.id].fy -= fy
          forces[nodeB.id].fx += fx
          forces[nodeB.id].fy += fy
        }
      }

      // 引力：有边连接的节点相互吸引
      data.edges.forEach(edge => {
        const source = newPositions[edge.sourceId]
        const target = newPositions[edge.targetId]
        if (!source || !target) return
        
        const dx = target.x - source.x
        const dy = target.y - source.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1
        
        const force = (distance - 150) * 0.05
        const fx = (dx / distance) * force
        const fy = (dy / distance) * force
        
        forces[edge.sourceId].fx += fx
        forces[edge.sourceId].fy += fy
        forces[edge.targetId].fx -= fx
        forces[edge.targetId].fy -= fy
      })

      // 中心引力
      data.nodes.forEach(node => {
        const pos = newPositions[node.id]
        const dx = centerX - pos.x
        const dy = centerY - pos.y
        forces[node.id].fx += dx * 0.01
        forces[node.id].fy += dy * 0.01
      })

      // 应用力
      data.nodes.forEach(node => {
        newPositions[node.id].x += forces[node.id].fx
        newPositions[node.id].y += forces[node.id].fy
        
        // 边界限制
        newPositions[node.id].x = Math.max(50, Math.min(width - 50, newPositions[node.id].x))
        newPositions[node.id].y = Math.max(50, Math.min(height - 50, newPositions[node.id].y))
      })
    }

    setPositions(newPositions)
  }, [data.nodes, data.edges, width, height])

  // 获取连线颜色
  const getEdgeColor = useCallback((type: string) => {
    const colors: Record<string, string> = {
      'RELATED': '#94a3b8',
      'PREREQUISITE': '#22c55e',
      'EXTENDS': '#3b82f6',
      'SIMILAR': '#f59e0b',
      'CONTRASTS': '#ef4444'
    }
    return colors[type] || '#94a3b8'
  }, [])



  // 处理鼠标滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(prev => Math.max(0.5, Math.min(2, prev * delta)))
  }, [])

  // 处理拖拽开始
  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId?: string) => {
    if (nodeId) {
      setDraggingNode(nodeId)
    } else {
      setIsPanning(true)
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
    }
  }, [offset])

  // 处理拖拽移动
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingNode && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - offset.x) / scale
      const y = (e.clientY - rect.top - offset.y) / scale
      
      setPositions(prev => ({
        ...prev,
        [draggingNode]: { x, y }
      }))
    } else if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    }
  }, [draggingNode, isPanning, panStart, offset, scale])

  // 处理拖拽结束
  const handleMouseUp = useCallback(() => {
    if (draggingNode) {
      const pos = positions[draggingNode]
      if (pos) {
        const node = data.nodes.find(n => n.id === draggingNode)
        if (node) {
          onNodeDrag?.(node, pos.x, pos.y)
        }
      }
    }
    setDraggingNode(null)
    setIsPanning(false)
  }, [draggingNode, positions, data.nodes, onNodeDrag])

  // 重置视图
  const resetView = useCallback(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [])

  if (data.nodes.length === 0) {
    return (
      <div style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: '12px',
        color: '#666',
        fontSize: '16px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎯</div>
          <div>暂无知识点</div>
          <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>使用 AI 导入或手动添加</div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      style={{ 
        position: 'relative',
        width,
        height,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
      }}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 工具栏 */}
      <div style={{
        position: 'absolute',
        top: '15px',
        left: '15px',
        zIndex: 10,
        display: 'flex',
        gap: '8px'
      }}>
        <button
          onClick={resetView}
          style={{
            padding: '8px 12px',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          🎯 重置视图
        </button>
        <div style={{
          padding: '8px 12px',
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '6px',
          fontSize: '13px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {Math.round(scale * 100)}%
        </div>
      </div>

      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{
          cursor: draggingNode ? 'grabbing' : isPanning ? 'grabbing' : 'grab'
        }}
        onMouseDown={(e) => handleMouseDown(e)}
      >
        <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
          {/* 网格背景 */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e0e0e0" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width={width * 2} height={height * 2} x={-width/2} y={-height/2} fill="url(#grid)" />

          {/* 连线 */}
          {data.edges.map((edge) => {
            const source = positions[edge.sourceId]
            const target = positions[edge.targetId]
            if (!source || !target) return null

            const isHovered = hoveredEdge === edge.id
            const color = getEdgeColor(edge.type)
            
            // 计算箭头位置
            const dx = target.x - source.x
            const dy = target.y - source.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            const targetRadius = 25
            const arrowX = target.x - (dx / distance) * targetRadius
            const arrowY = target.y - (dy / distance) * targetRadius

            return (
              <g 
                key={edge.id}
                onMouseEnter={() => setHoveredEdge(edge.id)}
                onMouseLeave={() => setHoveredEdge(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* 连线 */}
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={arrowX}
                  y2={arrowY}
                  stroke={color}
                  strokeWidth={isHovered ? 4 : 2}
                  opacity={isHovered ? 1 : 0.7}
                  markerEnd={`url(#arrow-${edge.type})`}
                />
                
                {/* 标签背景 */}
                {isHovered && edge.label && (
                  <g>
                    <rect
                      x={(source.x + target.x) / 2 - 40}
                      y={(source.y + target.y) / 2 - 12}
                      width="80"
                      height="24"
                      rx="12"
                      fill="white"
                      stroke={color}
                      strokeWidth="1"
                    />
                    <text
                      x={(source.x + target.x) / 2}
                      y={(source.y + target.y) / 2 + 4}
                      textAnchor="middle"
                      fill="#333"
                      fontSize="11"
                      fontWeight="500"
                    >
                      {edge.label}
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {/* 箭头定义 */}
          <defs>
            {Object.entries({
              'RELATED': '#94a3b8',
              'PREREQUISITE': '#22c55e',
              'EXTENDS': '#3b82f6',
              'SIMILAR': '#f59e0b',
              'CONTRASTS': '#ef4444'
            }).map(([type, color]) => (
              <marker
                key={type}
                id={`arrow-${type}`}
                markerWidth="12"
                markerHeight="12"
                refX="10"
                refY="6"
                orient="auto"
              >
                <path d="M2,2 L10,6 L2,10 L4,6 z" fill={color} />
              </marker>
            ))}
          </defs>

          {/* 节点 */}
          {data.nodes.map((node) => {
            const pos = positions[node.id]
            if (!pos) return null

            const isSelected = node.id === selectedNodeId
            const isHovered = hoveredNode === node.id
            const isDragging = draggingNode === node.id
            const nodeSize = 22 + (node.keywords?.length || 0) * 1.5
            
            // 根据关键词数量调整颜色深浅
            const keywordCount = node.keywords?.length || 0
            const opacity = Math.min(1, 0.6 + keywordCount * 0.1)

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  handleMouseDown(e, node.id)
                }}
                onClick={() => {
                  if (!draggingNode) {
                    onNodeClick?.(node)
                  }
                }}
              >
                {/* 选中光环 */}
                {(isSelected || isHovered) && (
                  <circle
                    r={nodeSize + 8}
                    fill="none"
                    stroke={isSelected ? '#ff6b6b' : '#667eea'}
                    strokeWidth="3"
                    opacity="0.3"
                  />
                )}
                
                {/* 节点圆形 */}
                <circle
                  r={nodeSize}
                  fill={isSelected ? '#ff6b6b' : `rgba(102, 126, 234, ${opacity})`}
                  stroke="white"
                  strokeWidth={isDragging ? 4 : 3}
                  filter="drop-shadow(0 3px 6px rgba(0,0,0,0.2))"
                  style={{
                    transition: 'all 0.2s ease'
                  }}
                />
                
                {/* 关键词数量指示 */}
                {keywordCount > 0 && (
                  <circle
                    r={8}
                    cx={nodeSize - 5}
                    cy={-nodeSize + 5}
                    fill="#ffd93d"
                    stroke="white"
                    strokeWidth="2"
                  />
                )}
                {keywordCount > 0 && (
                  <text
                    x={nodeSize - 5}
                    y={-nodeSize + 9}
                    textAnchor="middle"
                    fill="#333"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {keywordCount}
                  </text>
                )}
                
                {/* 节点标签 */}
                <text
                  y={nodeSize + 18}
                  textAnchor="middle"
                  fill="#1f2937"
                  fontSize={13}
                  fontWeight={isSelected ? 'bold' : '500'}
                  style={{
                    textShadow: '0 1px 2px rgba(255,255,255,0.8)',
                    pointerEvents: 'none'
                  }}
                >
                  {node.title.length > 10 ? node.title.slice(0, 10) + '...' : node.title}
                </text>

                {/* 悬停提示 */}
                {isHovered && (
                  <g>
                    <rect
                      x={-80}
                      y={-nodeSize - 60}
                      width="160"
                      height="50"
                      rx="8"
                      fill="rgba(0,0,0,0.8)"
                    />
                    <text
                      y={-nodeSize - 45}
                      textAnchor="middle"
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      {node.title}
                    </text>
                    <text
                      y={-nodeSize - 28}
                      textAnchor="middle"
                      fill="#ccc"
                      fontSize="10"
                    >
                      {node.keywords?.slice(0, 3).join(', ') || '无关键词'}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* 图例 */}
      <div style={{
        position: 'absolute',
        bottom: '15px',
        left: '15px',
        background: 'rgba(255,255,255,0.95)',
        padding: '15px',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontSize: '12px',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#333' }}>关联类型</div>
        {[
          { type: 'RELATED', label: '相关', color: '#94a3b8' },
          { type: 'PREREQUISITE', label: '前置', color: '#22c55e' },
          { type: 'EXTENDS', label: '扩展', color: '#3b82f6' },
          { type: 'SIMILAR', label: '相似', color: '#f59e0b' },
          { type: 'CONTRASTS', label: '对比', color: '#ef4444' }
        ].map(item => (
          <div key={item.type} style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{
              width: '24px',
              height: '3px',
              background: item.color,
              marginRight: '10px',
              borderRadius: '2px'
            }} />
            <span style={{ color: '#555' }}>{item.label}</span>
          </div>
        ))}
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
          <div style={{ fontSize: '11px', color: '#888' }}>
            💡 滚轮缩放 · 拖拽移动 · 点击查看
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      <div style={{
        position: 'absolute',
        top: '15px',
        right: '15px',
        background: 'rgba(255,255,255,0.95)',
        padding: '12px 18px',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontSize: '13px',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#333' }}>图谱统计</div>
        <div style={{ color: '#666', display: 'flex', gap: '15px' }}>
          <span>📝 {data.nodes.length} 节点</span>
          <span>🔗 {data.edges.length} 关联</span>
        </div>
      </div>
    </div>
  )
}

export default SimpleGraph
