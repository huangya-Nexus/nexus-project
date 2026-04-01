import { useState } from 'react'

interface Node {
  id: string
  title: string
  content: string
  summary?: string
  keywords?: string[]
  positionX?: number
  positionY?: number
  createdAt: string
  relatedNodes?: any[]
}

interface NodeDetailProps {
  node: Node | null
  onClose: () => void
  onEdit: (node: Node) => void
  onDelete: (nodeId: string) => void
  onGenerateSummary: (nodeId: string) => void
}

function NodeDetail({ node, onClose, onEdit, onDelete, onGenerateSummary }: NodeDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedNode, setEditedNode] = useState<Node | null>(null)

  if (!node) return null

  const handleEdit = () => {
    setEditedNode({ ...node })
    setIsEditing(true)
  }

  const handleSave = () => {
    if (editedNode) {
      onEdit(editedNode)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedNode(null)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
      height: '100vh',
      background: 'white',
      boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
      zIndex: 1000,
      overflow: 'auto'
    }}>
      {/* 头部 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <h3 style={{ margin: 0 }}>知识点详情</h3>
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer'
          }}
        >
          ×
        </button>
      </div>

      {/* 内容 */}
      <div style={{ padding: '20px' }}>
        {isEditing ? (
          // 编辑模式
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>标题</label>
              <input
                type="text"
                value={editedNode?.title || ''}
                onChange={(e) => setEditedNode(prev => prev ? { ...prev, title: e.target.value } : null)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>内容</label>
              <textarea
                value={editedNode?.content || ''}
                onChange={(e) => setEditedNode(prev => prev ? { ...prev, content: e.target.value } : null)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  minHeight: '150px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleSave}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                保存
              </button>
              <button
                onClick={handleCancel}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f0f0f0',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                取消
              </button>
            </div>
          </>
        ) : (
          // 查看模式
          <>
            <h2 style={{ margin: '0 0 15px 0', color: '#333' }}>{node.title}</h2>

            {/* 关键词 */}
            {node.keywords && node.keywords.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                {node.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      background: '#f0f0f0',
                      borderRadius: '20px',
                      fontSize: '14px',
                      marginRight: '8px',
                      marginBottom: '8px',
                      color: '#666'
                    }}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}

            {/* AI 摘要 */}
            {node.summary ? (
              <div style={{
                marginBottom: '20px',
                padding: '15px',
                background: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #667eea'
              }}>
                <div style={{ fontSize: '12px', color: '#667eea', marginBottom: '5px' }}>🤖 AI 摘要</div>
                <div style={{ fontSize: '14px', color: '#555' }}>{node.summary}</div>
              </div>
            ) : (
              <button
                onClick={() => onGenerateSummary(node.id)}
                style={{
                  marginBottom: '20px',
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🤖 生成 AI 摘要
              </button>
            )}

            {/* 详细内容 */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>详细内容</h4>
              <div style={{
                padding: '15px',
                background: '#f8f9fa',
                borderRadius: '8px',
                lineHeight: '1.6',
                color: '#333'
              }}>
                {node.content}
              </div>
            </div>

            {/* 关联节点 */}
            {node.relatedNodes && node.relatedNodes.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>关联知识点</h4>
                {node.relatedNodes.map((related, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '10px',
                      background: '#f0f0f0',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <span style={{ color: '#999', marginRight: '8px' }}>
                      {related.relation === 'outgoing' ? '→' : '←'}
                    </span>
                    {related.title}
                  </div>
                ))}
              </div>
            )}

            {/* 创建时间 */}
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '20px' }}>
              创建于: {new Date(node.createdAt).toLocaleString('zh-CN')}
            </div>

            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleEdit}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                编辑
              </button>
              <button
                onClick={() => onDelete(node.id)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#ff6b6b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                删除
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default NodeDetail
