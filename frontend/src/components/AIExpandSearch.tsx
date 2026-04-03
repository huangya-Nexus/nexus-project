import { useState, useEffect } from 'react'
import KnowledgeGraph from './KnowledgeGraph'
import FullscreenGraph from './FullscreenGraph'

interface AIExpandSearchProps {
  query: string
  onClose: () => void
}

const API_URL = 'http://localhost:3001'

function AIExpandSearch({ query, onClose }: AIExpandSearchProps) {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'graph' | 'list' | 'path' | 'fullscreen'>('graph')
  const [showFullscreen, setShowFullscreen] = useState(false)

  useEffect(() => {
    performSearch()
  }, [query])

  const performSearch = async () => {
    setLoading(true)
    setError('')
    
    try {
      const url = `${API_URL}/api/search/ai-expand?q=${encodeURIComponent(query)}`
      const res = await fetch(url)
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const data = await res.json()
      setResults(data)
      
      // 默认选中第一个节点
      if (data.aiGenerated?.nodes?.length > 0) {
        setSelectedNode(data.aiGenerated.nodes[0])
      }
    } catch (err: any) {
      console.error('AI search error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const aiData = results?.aiGenerated

  return (
    <div 
      style={{
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
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'white',
          borderRadius: '16px',
          width: '1200px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div style={{ 
          padding: '20px 30px', 
          borderBottom: '1px solid #e5e7eb',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: '0 0 5px 0', fontSize: '22px' }}>🤖 AI 智能知识网络</h2>
              <div style={{ opacity: 0.9, fontSize: '14px' }}>主题: "{query}"</div>
            </div>
            <button 
              onClick={onClose} 
              style={{ 
                fontSize: '24px', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                color: 'white'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 标签切换 */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb'
        }}>
          {[
            { id: 'graph', label: '🕸️ 知识图谱', desc: '可视化关联' },
            { id: 'list', label: '📋 详细列表', desc: '完整内容' },
            { id: 'path', label: '📖 学习路径', desc: '循序渐进' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                flex: 1,
                padding: '15px 20px',
                border: 'none',
                background: activeTab === tab.id ? 'white' : 'transparent',
                borderBottom: activeTab === tab.id ? '3px solid #667eea' : 'none',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                color: activeTab === tab.id ? '#667eea' : '#666'
              }}
            >
              <div>{tab.label}</div>
              <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>{tab.desc}</div>
            </button>
          ))}
        </div>

        {/* 内容区 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '25px 30px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>🤖</div>
              <div style={{ color: '#666' }}>AI 正在生成立体知识网络...</div>
              <div style={{ color: '#999', fontSize: '14px', marginTop: '10px' }}>构建知识点关联关系</div>
            </div>
          )}

          {error && (
            <div style={{ 
              color: '#dc2626', 
              padding: '20px', 
              background: '#fef2f2', 
              borderRadius: '8px' 
            }}>
              ❌ 错误: {error}
            </div>
          )}

          {!loading && !error && aiData && (
            <div>
              {/* 核心概念卡片 */}
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                borderRadius: '12px',
                marginBottom: '25px',
                border: '2px solid #86efac'
              }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#166534', fontSize: '20px' }}>
                  📌 {aiData.core?.title}
                </h3>
                <p style={{ margin: '0 0 10px 0', color: '#374151', lineHeight: '1.6' }}>
                  {aiData.core?.definition}
                </p>
                <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#6b7280' }}>
                  <span>📊 {aiData.nodes?.length || 0} 个知识点</span>
                  <span>🔗 {aiData.edges?.length || 0} 条关联</span>
                  <span>📚 {aiData.visualization?.clusters?.length || 0} 个知识群</span>
                </div>
              </div>

              {/* 图谱视图 */}
              {activeTab === 'graph' && (
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 2 }}>
                    <KnowledgeGraph
                      nodes={aiData.nodes || []}
                      edges={aiData.edges || []}
                      onNodeClick={setSelectedNode}
                      selectedNode={selectedNode}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    {selectedNode ? (
                      <div style={{
                        padding: '20px',
                        background: '#f9fafb',
                        borderRadius: '12px',
                        border: '2px solid #667eea'
                      }}>
                        <h4 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>{selectedNode.title}</h4>
                        <p style={{ margin: '0 0 15px 0', color: '#4b5563', fontSize: '14px', lineHeight: '1.6' }}>
                          {selectedNode.definition}
                        </p>
                        
                        <div style={{ marginBottom: '15px' }}>
                          <h5 style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '13px' }}>关键特征</h5>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {selectedNode.attributes?.map((attr: string, idx: number) => (
                              <span key={idx} style={{
                                background: '#dbeafe',
                                color: '#1e40af',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '12px'
                              }}>
                                {attr}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '13px' }}>应用案例</h5>
                          <ul style={{ margin: 0, paddingLeft: '18px', color: '#4b5563', fontSize: '13px' }}>
                            {selectedNode.examples?.map((example: string, idx: number) => (
                              <li key={idx} style={{ marginBottom: '4px' }}>{example}</li>
                            ))}
                          </ul>
                        </div>

                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e5e7eb' }}>
                          <span style={{
                            background: selectedNode.level === '基础' ? '#dcfce7' : 
                                       selectedNode.level === '进阶' ? '#dbeafe' : '#f3e8ff',
                            color: selectedNode.level === '基础' ? '#166534' :
                                   selectedNode.level === '进阶' ? '#1e40af' : '#7c3aed',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            {selectedNode.level}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        padding: '40px 20px',
                        textAlign: 'center',
                        color: '#9ca3af',
                        background: '#f9fafb',
                        borderRadius: '12px'
                      }}>
                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>👆</div>
                        <div>点击图谱中的节点查看详情</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 列表视图 */}
              {activeTab === 'list' && (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {aiData.nodes?.map((node: any, idx: number) => (
                    <div 
                      key={node.id}
                      style={{
                        padding: '20px',
                        background: '#f9fafb',
                        borderRadius: '12px',
                        borderLeft: `4px solid ${
                          node.level === '基础' ? '#22c55e' : 
                          node.level === '进阶' ? '#3b82f6' : '#8b5cf6'
                        }`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                        <h4 style={{ margin: 0, color: '#1f2937' }}>
                          <span style={{ color: '#9ca3af', marginRight: '8px' }}>{idx + 1}.</span>
                          {node.title}
                        </h4>
                        <span style={{
                          background: node.level === '基础' ? '#dcfce7' : 
                                     node.level === '进阶' ? '#dbeafe' : '#f3e8ff',
                          color: node.level === '基础' ? '#166534' :
                                 node.level === '进阶' ? '#1e40af' : '#7c3aed',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {node.level}
                        </span>
                      </div>
                      
                      <p style={{ margin: '0 0 15px 0', color: '#4b5563', lineHeight: '1.6' }}>
                        {node.definition}
                      </p>

                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div>
                          <h5 style={{ margin: '0 0 6px 0', color: '#6b7280', fontSize: '12px' }}>关键特征</h5>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {node.attributes?.map((attr: string, i: number) => (
                              <span key={i} style={{
                                background: '#e5e7eb',
                                color: '#374151',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11px'
                              }}>
                                {attr}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 style={{ margin: '0 0 6px 0', color: '#6b7280', fontSize: '12px' }}>应用案例</h5>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {node.examples?.map((example: string, i: number) => (
                              <span key={i} style={{
                                background: '#fef3c7',
                                color: '#92400e',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11px'
                              }}>
                                {example}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 显示关联 */}
                      {aiData.edges?.filter((e: any) => e.source === node.id || e.target === node.id).length > 0 && (
                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e5e7eb' }}>
                          <h5 style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '12px' }}>知识关联</h5>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {aiData.edges
                              ?.filter((e: any) => e.source === node.id || e.target === node.id)
                              .map((edge: any, i: number) => {
                                const relatedNode = aiData.nodes?.find((n: any) => 
                                  n.id === (edge.source === node.id ? edge.target : edge.source)
                                )
                                return (
                                  <span key={i} style={{
                                    background: '#ede9fe',
                                    color: '#5b21b6',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '12px'
                                  }}>
                                    {edge.relation} → {relatedNode?.title}
                                  </span>
                                )
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 学习路径视图 */}
              {activeTab === 'path' && (
                <div>
                  <div style={{
                    padding: '20px',
                    background: '#fef3c7',
                    borderRadius: '12px',
                    marginBottom: '20px'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#92400e' }}>📖 推荐学习路径</h4>
                    <p style={{ margin: 0, color: '#78350f', fontSize: '14px' }}>
                      按照以下步骤循序渐进地掌握"{query}"知识
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {aiData.learningPath?.map((step: any, idx: number) => {
                      const node = aiData.nodes?.find((n: any) => n.id === step.nodeId)
                      return (
                        <div 
                          key={idx}
                          style={{
                            display: 'flex',
                            gap: '15px',
                            padding: '20px',
                            background: 'white',
                            borderRadius: '12px',
                            border: '2px solid #e5e7eb',
                            borderLeft: `6px solid ${
                              node?.level === '基础' ? '#22c55e' : 
                              node?.level === '进阶' ? '#3b82f6' : '#8b5cf6'
                            }`
                          }}
                        >
                          <div style={{
                            width: '40px',
                            height: '40px',
                            background: '#667eea',
                            color: 'white',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '18px',
                            flexShrink: 0
                          }}>
                            {step.step}
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 6px 0', color: '#1f2937' }}>{step.title}</h4>
                            <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>
                              {step.description}
                            </p>
                            <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: '#9ca3af' }}>
                              <span>⏱️ {step.estimatedTime}</span>
                              {node && (
                                <span style={{
                                  color: node.level === '基础' ? '#22c55e' : 
                                         node.level === '进阶' ? '#3b82f6' : '#8b5cf6'
                                }}>
                                  📚 {node.level}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AIExpandSearch
