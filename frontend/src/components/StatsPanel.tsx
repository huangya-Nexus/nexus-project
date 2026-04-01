import { useState, useEffect } from 'react'

interface Stats {
  totalGraphs: number
  totalNodes: number
  totalEdges: number
  recentActivity: Array<{
    date: string
    nodesCreated: number
    edgesCreated: number
  }>
  topKeywords: Array<{
    keyword: string
    count: number
  }>
  learningStreak: number
  lastStudyDate: string | null
}

interface StatsPanelProps {
  onClose: () => void
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function StatsPanel({ onClose }: StatsPanelProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    loadStats()
  }, [timeRange])

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/users/stats?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('加载统计失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥🔥🔥'
    if (streak >= 14) return '🔥🔥'
    if (streak >= 7) return '🔥'
    return '💪'
  }

  const getStreakMessage = (streak: number) => {
    if (streak >= 30) return '太棒了！连续学习30天+'
    if (streak >= 14) return '继续保持！连续学习14天+'
    if (streak >= 7) return '不错的开始！连续学习7天+'
    if (streak > 0) return `连续学习${streak}天`
    return '今天开始学习吧！'
  }

  if (loading) {
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
        justifyContent: 'center'
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>加载中...</div>
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
          width: '800px',
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
            <h2 style={{ margin: 0, fontSize: '24px' }}>📊 学习数据统计</h2>
            <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
              追踪你的学习进度和成就
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

        {/* 时间范围选择 */}
        <div style={{ 
          padding: '16px 24px', 
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          gap: '10px'
        }}>
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: '8px 16px',
                background: timeRange === range ? '#667eea' : '#f3f4f6',
                color: timeRange === range ? 'white' : '#666',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              {range === '7d' && '近7天'}
              {range === '30d' && '近30天'}
              {range === '90d' && '近90天'}
              {range === 'all' && '全部'}
            </button>
          ))}
        </div>

        {/* 内容区 */}
        <div style={{ overflow: 'auto', padding: '24px' }}>
          {stats ? (
            <>
              {/* 核心数据卡片 */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '16px',
                  padding: '20px',
                  color: 'white'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.totalGraphs}</div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>知识图谱</div>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  borderRadius: '16px',
                  padding: '20px',
                  color: 'white'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.totalNodes}</div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>知识点</div>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  borderRadius: '16px',
                  padding: '20px',
                  color: 'white'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.totalEdges}</div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>知识关联</div>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  borderRadius: '16px',
                  padding: '20px',
                  color: 'white'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                    {getStreakEmoji(stats.learningStreak)}
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>
                    {stats.learningStreak}天连续学习
                  </div>
                </div>
              </div>

              {/* 连续学习提示 */}
              <div style={{
                background: '#fef3c7',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '24px' }}>{getStreakEmoji(stats.learningStreak)}</span>
                <div>
                  <div style={{ fontWeight: '600', color: '#92400e' }}>
                    {getStreakMessage(stats.learningStreak)}
                  </div>
                  <div style={{ fontSize: '13px', color: '#a16207' }}>
                    上次学习: {stats.lastStudyDate ? new Date(stats.lastStudyDate).toLocaleDateString('zh-CN') : '从未'}
                  </div>
                </div>
              </div>

              {/* 最近活动图表 */}
              {stats.recentActivity.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>📈 最近活动</h3>
                  <div style={{
                    background: '#f9fafb',
                    borderRadius: '12px',
                    padding: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '150px' }}>
                      {stats.recentActivity.map((day, index) => {
                        const maxValue = Math.max(...stats.recentActivity.map(d => d.nodesCreated + d.edgesCreated), 1)
                        const value = day.nodesCreated + day.edgesCreated
                        const height = maxValue > 0 ? (value / maxValue) * 100 : 0
                        
                        return (
                          <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{
                              width: '100%',
                              height: `${height}%`,
                              background: value > 0 ? '#667eea' : '#e5e7eb',
                              borderRadius: '4px 4px 0 0',
                              minHeight: value > 0 ? '4px' : '0',
                              transition: 'all 0.3s'
                            }} />
                            <div style={{ fontSize: '10px', color: '#999', marginTop: '4px', transform: 'rotate(-45deg)' }}>
                              {new Date(day.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '16px', fontSize: '13px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '12px', height: '12px', background: '#667eea', borderRadius: '2px' }} />
                        活跃天数
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 热门关键词 */}
              {stats.topKeywords.length > 0 && (
                <div>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>🏷️ 热门关键词</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {stats.topKeywords.map((item, index) => (
                      <span
                        key={index}
                        style={{
                          padding: '8px 16px',
                          background: `rgba(102, 126, 234, ${1 - index * 0.1})`,
                          color: 'white',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        {item.keyword} ({item.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
              <div>暂无统计数据</div>
              <div style={{ fontSize: '14px', marginTop: '8px' }}>开始学习后数据将自动统计</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StatsPanel
