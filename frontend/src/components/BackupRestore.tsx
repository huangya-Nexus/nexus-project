import { useState } from 'react'

interface BackupRestoreProps {
  graphId: string
  onClose: () => void
  onImportSuccess: () => void
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function BackupRestore({ graphId, onClose, onImportSuccess }: BackupRestoreProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [exportData, setExportData] = useState('')
  const [importData, setImportData] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const getToken = () => localStorage.getItem('token') || ''

  // 导出图谱
  const handleExport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/backup/${graphId}/export`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })

      if (!res.ok) throw new Error('导出失败')

      const data = await res.json()
      const jsonStr = JSON.stringify(data.data, null, 2)
      setExportData(jsonStr)

      // 自动下载
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nexus-backup-${data.data.graph.title}-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setMessage('导出成功！文件已自动下载')
    } catch (err) {
      setError('导出失败')
    }
    setLoading(false)
  }

  // 导入图谱
  const handleImport = async () => {
    if (!importData.trim()) {
      setError('请输入导入数据')
      return
    }

    setLoading(true)
    setError('')

    try {
      let data
      try {
        data = JSON.parse(importData)
      } catch {
        setError('JSON 格式错误，请检查数据')
        setLoading(false)
        return
      }

      const res = await fetch(`${API_URL}/api/backup/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ data })
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || '导入失败')
        return
      }

      setMessage(`导入成功！共导入 ${result.nodeCount} 个节点，${result.edgeCount} 个关联`)
      onImportSuccess()
    } catch (err) {
      setError('导入失败')
    }
    setLoading(false)
  }

  // 从文件读取
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setImportData(event.target?.result as string)
    }
    reader.readAsText(file)
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
      justifyContent: 'center'
    }} onClick={onClose}>
      <div 
        style={{
          background: 'white',
          borderRadius: '16px',
          width: '600px',
          maxHeight: '80vh',
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
          padding: '20px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: 0 }}>💾 备份与恢复</h3>
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

        {/* 标签页 */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => setActiveTab('export')}
            style={{
              flex: 1,
              padding: '15px',
              background: activeTab === 'export' ? '#f3f4f6' : 'white',
              border: 'none',
              borderBottom: activeTab === 'export' ? '2px solid #667eea' : 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'export' ? 'bold' : 'normal'
            }}
          >
            📤 导出备份
          </button>
          <button
            onClick={() => setActiveTab('import')}
            style={{
              flex: 1,
              padding: '15px',
              background: activeTab === 'import' ? '#f3f4f6' : 'white',
              border: 'none',
              borderBottom: activeTab === 'import' ? '2px solid #667eea' : 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'import' ? 'bold' : 'normal'
            }}
          >
            📥 导入恢复
          </button>
        </div>

        {/* 内容 */}
        <div style={{ padding: '20px', overflow: 'auto', flex: 1 }}>
          {error && (
            <div style={{
              padding: '12px',
              background: '#fee2e2',
              color: '#dc2626',
              borderRadius: '8px',
              marginBottom: '15px'
            }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{
              padding: '12px',
              background: '#d1fae5',
              color: '#059669',
              borderRadius: '8px',
              marginBottom: '15px'
            }}>
              {message}
            </div>
          )}

          {activeTab === 'export' ? (
            <div>
              <p style={{ color: '#666', marginBottom: '15px' }}>
                导出功能会将当前图谱的完整数据（包括节点和关联）保存为 JSON 文件。
              </p>
              
              {exportData ? (
                <div>
                  <textarea
                    value={exportData}
                    readOnly
                    style={{
                      width: '100%',
                      height: '200px',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      background: '#f9fafb'
                    }}
                  />
                  <p style={{ fontSize: '13px', color: '#666', marginTop: '10px' }}>
                    ✅ 文件已自动下载到本地
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleExport}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: loading ? '#ccc' : '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '16px'
                  }}
                >
                  {loading ? '导出中...' : '导出图谱数据'}
                </button>
              )}
            </div>
          ) : (
            <div>
              <p style={{ color: '#666', marginBottom: '15px' }}>
                导入功能会从备份文件恢复图谱数据。请选择之前导出的 JSON 文件。
              </p>

              <div style={{ marginBottom: '15px' }}>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  style={{ marginBottom: '10px' }}
                />
              </div>

              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="或者在此处粘贴 JSON 数据..."
                style={{
                  width: '100%',
                  height: '200px',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '12px'
                }}
              />

              <button
                onClick={handleImport}
                disabled={loading || !importData.trim()}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: loading || !importData.trim() ? '#ccc' : '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading || !importData.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  marginTop: '15px'
                }}
              >
                {loading ? '导入中...' : '导入图谱数据'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BackupRestore
