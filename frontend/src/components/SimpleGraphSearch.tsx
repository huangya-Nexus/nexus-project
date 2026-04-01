import { useState, useEffect, useRef } from 'react'

interface SimpleGraphSearchProps {
  query: string
  onClose: () => void
}

const API_URL = 'http://localhost:3001'

function SimpleGraphSearch({ query, onClose }: SimpleGraphSearchProps) {
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<any[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    fetchData()
  }, [query])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/external/multi?q=${encodeURIComponent(query)}&sources=wikipedia,arxiv`)
      if (res.ok) {
        const data = await res.json()
        const allResults: any[] = []
        
        // 扁平化结果
        Object.values(data.results || {}).forEach((items: any) => {
          if (Array.isArray(items)) {
            allResults.push(...items)
          }
        })
        
        setResults(allResults.slice(0, 10)) // 最多显示10个
      }
    } catch (e) {
      console.error('Fetch error:', e)
    }
    setLoading(false)
  }

  // 简单的力导向布局
  useEffect(() => {
    if (results.length === 0 || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 800
    canvas.height = 600

    // 节点位置
    const centerX = 400
    const centerY = 300
    const radius = 200

    const draw = () => {
      // 清空 - 使用渐变背景
      const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 500)
      bgGradient.addColorStop(0, '#1a1a2e')
      bgGradient.addColorStop(1, '#0f0f1a')
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 绘制中心节点 - 使用径向渐变
      const centerGradient = ctx.createRadialGradient(centerX - 15, centerY - 15, 0, centerX, centerY, 50)
      centerGradient.addColorStop(0, '#ff6b6b')
      centerGradient.addColorStop(0.7, '#e74c3c')
      centerGradient.addColorStop(1, '#c0392b')
      
      // 外发光效果
      ctx.beginPath()
      ctx.arc(centerX, centerY, 55, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(231, 76, 60, 0.2)'
      ctx.fill()
      
      // 中心节点主体
      ctx.beginPath()
      ctx.arc(centerX, centerY, 50, 0, Math.PI * 2)
      ctx.fillStyle = centerGradient
      ctx.fill()
      
      // 边框
      ctx.beginPath()
      ctx.arc(centerX, centerY, 50, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 2
      ctx.stroke()
      
      // 中心文字
      ctx.fillStyle = 'white'
      ctx.font = 'bold 18px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(query.length > 6 ? query.substring(0, 5) + '...' : query, centerX, centerY)

      // 绘制关联节点
      results.forEach((item, index) => {
        const angle = (index / results.length) * Math.PI * 2
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius

        // 连线 - 使用渐变
        const lineGradient = ctx.createLinearGradient(centerX, centerY, x, y)
        lineGradient.addColorStop(0, 'rgba(102, 126, 234, 0.6)')
        lineGradient.addColorStop(1, 'rgba(52, 152, 219, 0.3)')
        
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(x, y)
        ctx.strokeStyle = lineGradient
        ctx.lineWidth = 3
        ctx.stroke()

        // 节点外发光
        ctx.beginPath()
        ctx.arc(x, y, 35, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(52, 152, 219, 0.2)'
        ctx.fill()

        // 节点主体 - 使用径向渐变
        const nodeGradient = ctx.createRadialGradient(x - 8, y - 8, 0, x, y, 30)
        nodeGradient.addColorStop(0, '#5dade2')
        nodeGradient.addColorStop(0.7, '#3498db')
        nodeGradient.addColorStop(1, '#2980b9')
        
        ctx.beginPath()
        ctx.arc(x, y, 30, 0, Math.PI * 2)
        ctx.fillStyle = nodeGradient
        ctx.fill()
        
        // 节点边框
        ctx.beginPath()
        ctx.arc(x, y, 30, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.lineWidth = 2
        ctx.stroke()

        // 文字
        ctx.fillStyle = 'white'
        ctx.font = 'bold 12px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const title = item.title?.substring(0, 6) || '...'
        ctx.fillText(title, x, y)
        
        // 来源图标
        ctx.font = '10px Arial'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
        const source = item.source || 'wiki'
        ctx.fillText(source.substring(0, 4), x, y + 18)
      })
      
      // 绘制装饰性元素 - 中心光环
      ctx.beginPath()
      ctx.arc(centerX, centerY, 70, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(231, 76, 60, 0.1)'
      ctx.lineWidth = 1
      ctx.stroke()
      
      ctx.beginPath()
      ctx.arc(centerX, centerY, 85, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(231, 76, 60, 0.05)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    draw()
  }, [results, query])

  if (loading) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f1a 100%)',
        zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
        color: 'white'
      }}>
        {/* 动画圆圈 */}
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, #667eea, #764ba2, #f093fb, #667eea)',
          animation: 'spin 2s linear infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '30px'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: '#1a1a2e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px'
          }}>
            🕸️
          </div>
        </div>

        {/* 标题 */}
        <h2 style={{
          margin: '0 0 10px 0',
          fontSize: '28px',
          background: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          正在构建知识图谱
        </h2>

        {/* 关键词 */}
        <p style={{
          margin: '0 0 30px 0',
          fontSize: '18px',
          color: 'rgba(255,255,255,0.7)'
        }}>
          "{query}"
        </p>

        {/* 进度条 */}
        <div style={{
          width: '300px',
          height: '6px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '3px',
          overflow: 'hidden',
          marginBottom: '15px'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb)',
            animation: 'loading 2s ease-in-out infinite',
            transformOrigin: 'left'
          }} />
        </div>

        {/* 搜索源 */}
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: 'rgba(255,255,255,0.5)'
        }}>
          正在搜索: 维基百科 · arXiv · GitHub · PubMed · 知乎 · B站
        </p>

        {/* CSS 动画 */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes loading {
            0% { transform: scaleX(0); }
            50% { transform: scaleX(1); }
            100% { transform: scaleX(0); transform-origin: right; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.95)', zIndex: 99999,
      display: 'flex'
    }} onClick={onClose}>
      {/* 左侧信息 */}
      <div style={{
        width: '300px', background: '#16213e', padding: '20px', color: 'white'
      }} onClick={e => e.stopPropagation()}>
        <h2>🕸️ 知识图谱</h2>
        <p>关键词: {query}</p>
        <p>找到 {results.length} 个结果</p>
        
        <button 
          onClick={onClose}
          style={{
            marginTop: '20px', padding: '10px 20px',
            background: '#e74c3c', border: 'none', color: 'white',
            borderRadius: '5px', cursor: 'pointer'
          }}
        >
          关闭
        </button>
      </div>

      {/* 右侧画布 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px' }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={550}
          style={{ border: '2px solid #333', borderRadius: '10px', marginBottom: '15px' }}
        />
        
        {/* 图例 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '30px',
          color: 'white',
          fontSize: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff6b6b, #e74c3c)' }} />
            <span>中心关键词</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'linear-gradient(135deg, #5dade2, #3498db)' }} />
            <span>关联知识点</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '40px', height: '3px', background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.6), rgba(52, 152, 219, 0.3))' }} />
            <span>关联关系</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleGraphSearch
