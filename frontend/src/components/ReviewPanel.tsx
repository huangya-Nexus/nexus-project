import { useState, useEffect } from 'react'

interface ReviewCard {
  id: string
  node: {
    id: string
    title: string
    content: string
    summary: string | null
  }
  graph: {
    id: string
    title: string
  }
  status: string
  easeFactor: number
  interval: number
  dueDate: string
}

interface ReviewStats {
  totalCards: number
  dueToday: number
  newCards: number
  reviewedToday: number
  streak: number
}

interface ReviewPanelProps {
  onClose: () => void
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function ReviewPanel({ onClose }: ReviewPanelProps) {
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [cards, setCards] = useState<ReviewCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)

  const getToken = () => localStorage.getItem('token') || ''

  useEffect(() => {
    loadReviewData()
  }, [])

  const loadReviewData = async () => {
    try {
      const token = getToken()
      
      // 加载统计
      const statsRes = await fetch(`${API_URL}/api/review/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (statsRes.ok) {
        setStats(await statsRes.json())
      }

      // 加载今日复习卡片
      const cardsRes = await fetch(`${API_URL}/api/review/today`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (cardsRes.ok) {
        const data = await cardsRes.json()
        setCards(data.cards)
        if (data.cards.length === 0) {
          setFinished(true)
        }
      }
    } catch (error) {
      console.error('加载复习数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (rating: number) => {
    if (currentIndex >= cards.length) return

    const card = cards[currentIndex]
    
    try {
      await fetch(`${API_URL}/api/review/${card.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ rating })
      })

      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setShowAnswer(false)
      } else {
        setFinished(true)
      }
    } catch (error) {
      console.error('提交复习失败:', error)
    }
  }

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return '忘记'
      case 2: return '困难'
      case 3: return '良好'
      case 4: return '简单'
      default: return ''
    }
  }

  const getRatingColor = (rating: number) => {
    switch (rating) {
      case 1: return '#ef4444'
      case 2: return '#f97316'
      case 3: return '#22c55e'
      case 4: return '#3b82f6'
      default: return '#666'
    }
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

  const currentCard = cards[currentIndex]

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
    }} onClick={onClose}>
      <div 
        style={{
          background: 'white',
          borderRadius: '20px',
          width: '600px',
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
            <h2 style={{ margin: 0, fontSize: '24px' }}>🎯 今日复习</h2>
            {stats && (
              <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
                待复习: {stats.dueToday} | 新卡片: {stats.newCards} | 连续学习: {stats.streak}天
              </p>
            )}
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

        {/* 内容区 */}
        <div style={{ padding: '30px', overflow: 'auto', flex: 1 }}>
          {finished ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
              <h3 style={{ marginBottom: '10px' }}>今日复习完成！</h3>
              <p style={{ color: '#666' }}>
                {stats && stats.streak > 0 && `已连续学习 ${stats.streak} 天，继续保持！`}
              </p>
            </div>
          ) : currentCard ? (
            <>
              {/* 进度 */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  height: '8px',
                  background: '#e5e7eb',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${((currentIndex) / cards.length) * 100}%`,
                    background: '#667eea',
                    borderRadius: '4px',
                    transition: 'width 0.3s'
                  }} />
                </div>
                <div style={{ textAlign: 'center', marginTop: '8px', color: '#666', fontSize: '14px' }}>
                  {currentIndex + 1} / {cards.length}
                </div>
              </div>

              {/* 卡片内容 */}
              <div style={{
                background: '#f9fafb',
                borderRadius: '16px',
                padding: '30px',
                marginBottom: '20px',
                minHeight: '200px'
              }}>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '10px' }}>
                  📚 {currentCard.graph.title}
                </div>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '22px' }}>{currentCard.node.title}</h3>
                
                {currentCard.node.summary && (
                  <p style={{ color: '#667eea', marginBottom: '15px', fontSize: '15px' }}>
                    🤖 {currentCard.node.summary}
                  </p>
                )}

                {!showAnswer ? (
                  <button
                    onClick={() => setShowAnswer(true)}
                    style={{
                      width: '100%',
                      padding: '15px',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    显示答案
                  </button>
                ) : (
                  <div style={{
                    padding: '20px',
                    background: 'white',
                    borderRadius: '8px',
                    lineHeight: '1.6'
                  }}>
                    {currentCard.node.content}
                  </div>
                )}
              </div>

              {/* 评分按钮 */}
              {showAnswer && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {[1, 2, 3, 4].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleReview(rating)}
                      style={{
                        padding: '15px 10px',
                        background: getRatingColor(rating),
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      <div style={{ fontSize: '20px', marginBottom: '5px' }}>
                        {rating === 1 && '❌'}
                        {rating === 2 && '😰'}
                        {rating === 3 && '✅'}
                        {rating === 4 && '🌟'}
                      </div>
                      {getRatingLabel(rating)}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📚</div>
              <p>暂无复习卡片</p>
              <p style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>
                在知识点详情页点击"加入复习"开始记忆训练
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReviewPanel
