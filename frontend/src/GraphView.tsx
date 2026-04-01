import { useState } from 'react'

function GraphView() {
  const [nodes] = useState([
    { id: '1', name: '马克思主义', x: 400, y: 300, color: '#667eea' },
    { id: '2', name: '哲学', x: 250, y: 200, color: '#764ba2' },
    { id: '3', name: '政治经济学', x: 550, y: 200, color: '#764ba2' },
    { id: '4', name: '唯物论', x: 150, y: 100, color: '#f093fb' },
    { id: '5', name: '辩证法', x: 350, y: 100, color: '#f093fb' },
  ])

  const [selectedNode, setSelectedNode] = useState<any>(null)

  return (
    <div style={{ 
      height: '100vh',
      background: '#1a1a2e',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 顶部 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 30px',
        background: '#16213e',
        borderBottom: '1px solid #0f3460'
      }}>
        <div style={{ color: '#667eea', fontSize: '20px', fontWeight: 'bold' }}>
          🧠 知链 Nexus
        </div>
        <a href="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>
          ← 返回仪表盘
        </a>
      </div>

      {/* 主内容 */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* 图谱区域 */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <svg width="100%" height="100%" style={{ background: '#1a1a2e' }}>
            {/* 连线 */}
            <line x1={400} y1={300} x2={250} y2={200} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            <line x1={400} y1={300} x2={550} y2={200} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            <line x1={250} y1={200} x2={150} y2={100} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            <line x1={250} y1={200} x2={350} y2={100} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            
            {/* 节点 */}
            {nodes.map(node => (
              <g key={node.id} onClick={() => setSelectedNode(node)} style={{ cursor: 'pointer' }}>
                <circle cx={node.x} cy={node.y} r="30" fill={node.color} />
                <text x={node.x} y={node.y + 5} textAnchor="middle" fill="white" fontSize="12">
                  {node.name}
                </text>
              </g>
            ))}
          </svg>
          
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', color: 'rgba(255,255,255,0.5)' }}>
            💡 点击节点查看详情
          </div>
        </div>

        {/* 右侧详情 */}
        <div style={{ width: '300px', background: '#16213e', padding: '20px', color: 'white' }}>
          <h3>节点详情</h3>
          {selectedNode ? (
            <div style={{ padding: '15px', background: '#0f3460', borderRadius: '8px' }}>
              <h4 style={{ color: '#667eea' }}>{selectedNode.name}</h4>
              <p style={{ color: '#aaa', fontSize: '14px' }}>ID: {selectedNode.id}</p>
            </div>
          ) : (
            <p style={{ color: '#666' }}>点击节点查看详情</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default GraphView