import { useState, useRef } from 'react'

interface FileUploadProps {
  graphId: string
  onUploadSuccess: (content: string) => void
  onClose: () => void
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function FileUpload({ graphId, onUploadSuccess, onClose }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getToken = () => localStorage.getItem('token') || ''

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // 检查文件类型
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown'
      ]
      
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('不支持的文件类型，请上传 PDF、Word 或文本文件')
        return
      }

      // 检查文件大小 (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('文件大小不能超过 10MB')
        return
      }

      setFile(selectedFile)
      setError('')
      setPreview('')
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100)
          setProgress(percentComplete)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText)
          setPreview(data.content)
          onUploadSuccess(data.content)
        } else {
          const error = JSON.parse(xhr.responseText)
          setError(error.error || '上传失败')
        }
        setUploading(false)
      })

      xhr.addEventListener('error', () => {
        setError('上传过程中发生错误')
        setUploading(false)
      })

      xhr.open('POST', `${API_URL}/api/upload/${graphId}/upload`)
      xhr.setRequestHeader('Authorization', `Bearer ${getToken()}`)
      xhr.send(formData)

    } catch (err) {
      setError('上传失败')
      setUploading(false)
    }
  }

  const getFileIcon = (type: string) => {
    if (type === 'application/pdf') return '📄'
    if (type.includes('word')) return '📝'
    if (type === 'text/markdown') return '📑'
    return '📃'
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
          width: '500px',
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
          <h3 style={{ margin: 0 }}>📁 上传文件</h3>
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

        <div style={{ padding: '20px', overflow: 'auto' }}>
          {/* 文件选择区域 */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed #ddd',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              cursor: 'pointer',
              background: file ? '#f0fdf4' : '#f9fafb',
              borderColor: file ? '#22c55e' : '#ddd'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx,.txt,.md"
            />
            
            {file ? (
              <div>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                  {getFileIcon(file.type)}
                </div>
                <div style={{ fontWeight: '600', marginBottom: '5px' }}>{file.name}</div>
                <div style={{ color: '#666', fontSize: '14px' }}>
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>📂</div>
                <div style={{ color: '#666' }}>点击选择文件或拖拽到此处</div>
                <div style={{ color: '#999', fontSize: '13px', marginTop: '8px' }}>
                  支持 PDF、Word、Markdown、TXT
                </div>
              </div>
            )}
          </div>

          {/* 错误提示 */}
          {error && (
            <div style={{
              marginTop: '15px',
              padding: '12px',
              background: '#fef2f2',
              color: '#dc2626',
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* 上传进度 */}
          {uploading && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ 
                height: '8px', 
                background: '#e5e7eb', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: '#667eea',
                  borderRadius: '4px',
                  transition: 'width 0.3s'
                }} />
              </div>
              <div style={{ textAlign: 'center', marginTop: '8px', color: '#666' }}>
                上传中... {progress}%
              </div>
            </div>
          )}

          {/* 内容预览 */}
          {preview && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ marginBottom: '10px' }}>📖 内容预览</h4>
              <div style={{
                padding: '15px',
                background: '#f9fafb',
                borderRadius: '8px',
                fontSize: '14px',
                lineHeight: '1.6',
                maxHeight: '200px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
                {preview}
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '15px'
            }}
          >
            取消
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            style={{
              flex: 1,
              padding: '12px',
              background: (!file || uploading) ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: (!file || uploading) ? 'not-allowed' : 'pointer',
              fontSize: '15px'
            }}
          >
            {uploading ? '上传中...' : '上传并解析'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default FileUpload
