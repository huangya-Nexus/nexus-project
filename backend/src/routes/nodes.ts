import { Router } from 'express'
import { prisma } from '../lib/db.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'

const router = Router()

// 创建知识点
router.post('/:graphId/nodes', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const graphId = req.params.graphId as string
    const userId = req.user!.userId
    const { title, content, summary, keywords, positionX, positionY } = req.body

    if (!title || !content) {
      return res.status(400).json({ error: '标题和内容不能为空' })
    }

    // 验证图谱归属
    const graph = await prisma.knowledgeGraph.findFirst({
      where: { id: graphId, userId, status: 'ACTIVE' }
    })

    if (!graph) {
      return res.status(404).json({ error: '图谱不存在' })
    }

    const node = await prisma.knowledgeNode.create({
      data: {
        title,
        content,
        summary,
        keywords: keywords ? JSON.stringify(keywords) : null,
        positionX,
        positionY,
        graphId
      }
    })

    // 更新图谱节点计数
    await prisma.knowledgeGraph.update({
      where: { id: graphId },
      data: { nodeCount: { increment: 1 } }
    })

    res.status(201).json({
      message: '知识点创建成功',
      node: {
        ...node,
        keywords: keywords || []
      }
    })
  } catch (error) {
    console.error('创建知识点错误:', error)
    res.status(500).json({ error: '创建知识点失败' })
  }
})

// 获取知识点详情
router.get('/:graphId/nodes/:nodeId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const graphId = req.params.graphId as string
    const nodeId = req.params.nodeId as string
    const userId = req.user!.userId

    // 验证图谱归属
    const graph = await prisma.knowledgeGraph.findFirst({
      where: { id: graphId, userId, status: 'ACTIVE' }
    })

    if (!graph) {
      return res.status(404).json({ error: '图谱不存在' })
    }

    const node = await prisma.knowledgeNode.findFirst({
      where: { id: nodeId, graphId },
      include: {
        sourceEdges: {
          include: { target: { select: { id: true, title: true } } }
        },
        targetEdges: {
          include: { source: { select: { id: true, title: true } } }
        }
      }
    })

    if (!node) {
      return res.status(404).json({ error: '知识点不存在' })
    }

    res.json({
      node: {
        ...node,
        keywords: node.keywords ? JSON.parse(node.keywords) : [],
        relatedNodes: [
          ...node.sourceEdges.map(e => ({ ...e.target, relation: 'outgoing' })),
          ...node.targetEdges.map(e => ({ ...e.source, relation: 'incoming' }))
        ]
      }
    })
  } catch (error) {
    console.error('获取知识点错误:', error)
    res.status(500).json({ error: '获取知识点失败' })
  }
})

// 更新知识点
router.put('/:graphId/nodes/:nodeId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const graphId = req.params.graphId as string
    const nodeId = req.params.nodeId as string
    const userId = req.user!.userId
    const { title, content, summary, keywords, positionX, positionY } = req.body

    // 验证图谱归属
    const graph = await prisma.knowledgeGraph.findFirst({
      where: { id: graphId, userId, status: 'ACTIVE' }
    })

    if (!graph) {
      return res.status(404).json({ error: '图谱不存在' })
    }

    const node = await prisma.knowledgeNode.findFirst({
      where: { id: nodeId, graphId }
    })

    if (!node) {
      return res.status(404).json({ error: '知识点不存在' })
    }

    const updated = await prisma.knowledgeNode.update({
      where: { id: nodeId },
      data: {
        title: title || node.title,
        content: content || node.content,
        summary: summary !== undefined ? summary : node.summary,
        keywords: keywords ? JSON.stringify(keywords) : node.keywords,
        positionX: positionX !== undefined ? positionX : node.positionX,
        positionY: positionY !== undefined ? positionY : node.positionY
      }
    })

    res.json({
      message: '知识点更新成功',
      node: {
        ...updated,
        keywords: updated.keywords ? JSON.parse(updated.keywords) : []
      }
    })
  } catch (error) {
    console.error('更新知识点错误:', error)
    res.status(500).json({ error: '更新知识点失败' })
  }
})

// 删除知识点
router.delete('/:graphId/nodes/:nodeId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const graphId = req.params.graphId as string
    const nodeId = req.params.nodeId as string
    const userId = req.user!.userId

    // 验证图谱归属
    const graph = await prisma.knowledgeGraph.findFirst({
      where: { id: graphId, userId, status: 'ACTIVE' }
    })

    if (!graph) {
      return res.status(404).json({ error: '图谱不存在' })
    }

    const node = await prisma.knowledgeNode.findFirst({
      where: { id: nodeId, graphId }
    })

    if (!node) {
      return res.status(404).json({ error: '知识点不存在' })
    }

    // 删除相关的边
    await prisma.knowledgeEdge.deleteMany({
      where: {
        OR: [
          { sourceId: nodeId },
          { targetId: nodeId }
        ]
      }
    })

    // 删除节点
    await prisma.knowledgeNode.delete({
      where: { id: nodeId }
    })

    // 更新图谱计数
    const edgeCount = await prisma.knowledgeEdge.count({ where: { graphId } })
    await prisma.knowledgeGraph.update({
      where: { id: graphId },
      data: {
        nodeCount: { decrement: 1 },
        edgeCount: { decrement: edgeCount }
      }
    })

    res.json({ message: '知识点删除成功' })
  } catch (error) {
    console.error('删除知识点错误:', error)
    res.status(500).json({ error: '删除知识点失败' })
  }
})

export default router
