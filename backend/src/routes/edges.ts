import { Router } from 'express'
import { prisma } from '../lib/db.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'

const router = Router()

// 创建关联
router.post('/:graphId/edges', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const graphId = req.params.graphId as string
    const userId = req.user!.userId
    const { sourceId, targetId, type, label } = req.body

    if (!sourceId || !targetId) {
      return res.status(400).json({ error: '源节点和目标节点不能为空' })
    }

    if (sourceId === targetId) {
      return res.status(400).json({ error: '不能关联自身' })
    }

    // 验证图谱归属
    const graph = await prisma.knowledgeGraph.findFirst({
      where: { id: graphId, userId, status: 'ACTIVE' }
    })

    if (!graph) {
      return res.status(404).json({ error: '图谱不存在' })
    }

    // 验证节点存在
    const [sourceNode, targetNode] = await Promise.all([
      prisma.knowledgeNode.findFirst({ where: { id: sourceId, graphId } }),
      prisma.knowledgeNode.findFirst({ where: { id: targetId, graphId } })
    ])

    if (!sourceNode || !targetNode) {
      return res.status(404).json({ error: '节点不存在' })
    }

    const edge = await prisma.knowledgeEdge.create({
      data: {
        type: type || 'RELATED',
        label,
        graphId,
        sourceId,
        targetId
      }
    })

    // 更新图谱边计数
    await prisma.knowledgeGraph.update({
      where: { id: graphId },
      data: { edgeCount: { increment: 1 } }
    })

    res.status(201).json({
      message: '关联创建成功',
      edge
    })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: '该关联已存在' })
    }
    console.error('创建关联错误:', error)
    res.status(500).json({ error: '创建关联失败' })
  }
})

// 获取图谱的所有关联
router.get('/:graphId/edges', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const graphId = req.params.graphId as string
    const userId = req.user!.userId

    // 验证图谱归属
    const graph = await prisma.knowledgeGraph.findFirst({
      where: { id: graphId, userId, status: 'ACTIVE' }
    })

    if (!graph) {
      return res.status(404).json({ error: '图谱不存在' })
    }

    const edges = await prisma.knowledgeEdge.findMany({
      where: { graphId },
      include: {
        source: { select: { id: true, title: true } },
        target: { select: { id: true, title: true } }
      }
    })

    res.json({ edges })
  } catch (error) {
    console.error('获取关联列表错误:', error)
    res.status(500).json({ error: '获取关联列表失败' })
  }
})

// 删除关联
router.delete('/:graphId/edges/:edgeId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const graphId = req.params.graphId as string
    const edgeId = req.params.edgeId as string
    const userId = req.user!.userId

    // 验证图谱归属
    const graph = await prisma.knowledgeGraph.findFirst({
      where: { id: graphId, userId, status: 'ACTIVE' }
    })

    if (!graph) {
      return res.status(404).json({ error: '图谱不存在' })
    }

    const edge = await prisma.knowledgeEdge.findFirst({
      where: { id: edgeId, graphId }
    })

    if (!edge) {
      return res.status(404).json({ error: '关联不存在' })
    }

    await prisma.knowledgeEdge.delete({
      where: { id: edgeId }
    })

    // 更新图谱边计数
    await prisma.knowledgeGraph.update({
      where: { id: graphId },
      data: { edgeCount: { decrement: 1 } }
    })

    res.json({ message: '关联删除成功' })
  } catch (error) {
    console.error('删除关联错误:', error)
    res.status(500).json({ error: '删除关联失败' })
  }
})

export default router
