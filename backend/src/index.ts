import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import compression from 'compression'
import userRoutes from './routes/users.js'
import graphRoutes from './routes/graphs.js'
import nodeRoutes from './routes/nodes.js'
import edgeRoutes from './routes/edges.js'
import aiRoutes from './routes/ai.js'
import importRoutes from './routes/import.js'
import backupRoutes from './routes/backup.js'
import shareRoutes from './routes/share.js'
import reviewRoutes from './routes/review.js'
import searchRoutes from './routes/search.js'
import externalSearchRoutes from './routes/externalSearch.js'
import { performanceMonitor, rateLimiter } from './middleware/performance.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(compression()) // 启用 gzip 压缩
app.use(express.json({ limit: '10mb' })) // 限制请求体大小
app.use(performanceMonitor) // 性能监控
app.use(rateLimiter(200, 60000)) // 限流：每分钟200请求

// Debug middleware (仅开发环境)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`)
    next()
  })
}

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Nexus API Server is running!',
    version: '1.0.0',
    docs: '/api/docs'
  })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes - 注意顺序：具体路由在前，参数路由在后
app.use('/api/users', userRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/import', importRoutes)
app.use('/api/backup', backupRoutes)
app.use('/api/share', shareRoutes)  // 分享功能
app.use('/api/review', reviewRoutes)  // 复习系统
app.use('/api/search', searchRoutes)  // 搜索功能
app.use('/api/external', externalSearchRoutes)  // 外部搜索

// 图谱子路由（具体路径）
app.use('/api/graphs', nodeRoutes)  // /api/graphs/:graphId/nodes
app.use('/api/graphs', edgeRoutes)  // /api/graphs/:graphId/edges

// 图谱主路由（参数路径）
app.use('/api/graphs', graphRoutes) // /api/graphs, /api/graphs/:id

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found' })
})

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Nexus API Server is running on http://localhost:${PORT}`)
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`)
})
