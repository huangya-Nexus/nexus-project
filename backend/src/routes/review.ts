import { Router } from 'express'
import { prisma } from '../lib/db.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// SM-2 算法实现
function calculateNextReview(
  rating: number, // 1-4 (1=Again, 2=Hard, 3=Good, 4=Easy)
  easeFactor: number,
  interval: number,
  repetitions: number
): { easeFactor: number; interval: number; repetitions: number; dueDate: Date } {
  let newEaseFactor = easeFactor
  let newInterval = interval
  let newRepetitions = repetitions

  // 根据评分调整简易度因子
  newEaseFactor = easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
  if (newEaseFactor < 1.3) newEaseFactor = 1.3

  if (rating < 3) {
    // 回答错误，重新学习
    newRepetitions = 0
    newInterval = 1
  } else {
    // 回答正确
    newRepetitions = repetitions + 1
    
    if (newRepetitions === 1) {
      newInterval = 1
    } else if (newRepetitions === 2) {
      newInterval = 6
    } else {
      newInterval = Math.round(interval * newEaseFactor)
    }
  }

  // 计算到期时间
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + newInterval)

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    dueDate
  }
}

// 获取今日复习任务
router.get('/today', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId
    const now = new Date()

    // 获取到期的复习卡片
    const dueCards = await prisma.reviewCard.findMany({
      where: {
        userId,
        dueDate: { lte: now }
      },
      include: {
        node: {
          select: {
            id: true,
            title: true,
            content: true,
            summary: true,
            keywords: true
          }
        },
        graph: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { dueDate: 'asc' },
      take: 50
    })

    // 获取新卡片（最多10个）
    const newCards = await prisma.reviewCard.findMany({
      where: {
        userId,
        status: 'NEW'
      },
      include: {
        node: {
          select: {
            id: true,
            title: true,
            content: true,
            summary: true,
            keywords: true
          }
        },
        graph: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: 10
    })

    // 合并并去重
    const allCards = [...dueCards, ...newCards]
    const uniqueCards = allCards.filter((card, index, self) =>
      index === self.findIndex(c => c.id === card.id)
    )

    res.json({
      cards: uniqueCards,
      totalDue: dueCards.length,
      totalNew: newCards.length,
      total: uniqueCards.length
    })

  } catch (error) {
    console.error('获取今日复习任务错误:', error)
    res.status(500).json({ error: '获取复习任务失败' })
  }
})

// 提交复习结果
router.post('/:cardId/review', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { cardId } = req.params
    const { rating, duration } = req.body
    const userId = req.user!.userId

    if (!rating || rating < 1 || rating > 4) {
      return res.status(400).json({ error: '评分必须是 1-4 之间的整数' })
    }

    // 获取卡片
    const card = await prisma.reviewCard.findFirst({
      where: { id: cardId as string, userId: userId as string }
    })

    if (!card) {
      return res.status(404).json({ error: '卡片不存在' })
    }

    // 计算下次复习时间
    const nextReview = calculateNextReview(
      rating,
      card.easeFactor,
      card.interval,
      card.repetitions
    )

    // 更新卡片
    const updatedCard = await prisma.reviewCard.update({
      where: { id: cardId as string },
      data: {
        easeFactor: nextReview.easeFactor,
        interval: nextReview.interval,
        repetitions: nextReview.repetitions,
        dueDate: nextReview.dueDate,
        lastReviewedAt: new Date(),
        reviewCount: { increment: 1 },
        correctCount: rating >= 3 ? { increment: 1 } : undefined,
        status: rating < 3 ? 'RELEARNING' : (card.repetitions >= 1 ? 'REVIEW' : 'LEARNING')
      }
    })

    // 创建复习记录
    await prisma.reviewLog.create({
      data: {
        id: uuidv4(),
        rating,
        easeFactor: card.easeFactor,
        interval: card.interval,
        repetitions: card.repetitions,
        duration: duration as number | undefined,
        cardId: cardId as string,
        userId: userId as string
      }
    })

    res.json({
      message: '复习记录已保存',
      card: updatedCard,
      nextReview: nextReview.dueDate
    })

  } catch (error) {
    console.error('提交复习结果错误:', error)
    res.status(500).json({ error: '提交复习结果失败' })
  }
})

// 创建复习卡片
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { nodeId, graphId } = req.body
    const userId = req.user!.userId

    // 检查节点是否存在
    const node = await prisma.knowledgeNode.findFirst({
      where: { id: nodeId, graphId }
    })

    if (!node) {
      return res.status(404).json({ error: '知识点不存在' })
    }

    // 检查是否已存在
    const existingCard = await prisma.reviewCard.findFirst({
      where: { userId, nodeId }
    })

    if (existingCard) {
      return res.status(409).json({ error: '该知识点已添加到复习计划' })
    }

    // 创建复习卡片
    const card = await prisma.reviewCard.create({
      data: {
        id: uuidv4(),
        nodeId,
        userId,
        graphId,
        dueDate: new Date(), // 新卡片立即到期
        status: 'NEW'
      }
    })

    res.status(201).json({
      message: '已添加到复习计划',
      card
    })

  } catch (error) {
    console.error('创建复习卡片错误:', error)
    res.status(500).json({ error: '创建复习卡片失败' })
  }
})

// 删除复习卡片
router.delete('/:cardId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { cardId } = req.params
    const userId = req.user!.userId

    const card = await prisma.reviewCard.findFirst({
      where: { id: cardId as string, userId: userId as string }
    })

    if (!card) {
      return res.status(404).json({ error: '卡片不存在' })
    }

    await prisma.reviewCard.delete({
      where: { id: cardId as string }
    })

    res.json({ message: '已移除复习计划' })

  } catch (error) {
    console.error('删除复习卡片错误:', error)
    res.status(500).json({ error: '删除复习卡片失败' })
  }
})

// 获取复习统计
router.get('/stats', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId
    const now = new Date()

    // 总卡片数
    const totalCards = await prisma.reviewCard.count({
      where: { userId }
    })

    // 今日到期
    const dueToday = await prisma.reviewCard.count({
      where: {
        userId,
        dueDate: { lte: now }
      }
    })

    // 新卡片
    const newCards = await prisma.reviewCard.count({
      where: {
        userId,
        status: 'NEW'
      }
    })

    // 今日已复习
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const reviewedToday = await prisma.reviewLog.count({
      where: {
        userId,
        createdAt: { gte: todayStart }
      }
    })

    // 连续复习天数
    const reviewLogs = await prisma.reviewLog.findMany({
      where: { userId },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' }
    })

    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    const reviewedDates = new Set(
      reviewLogs.map(log => log.createdAt.toISOString().split('T')[0])
    )

    while (reviewedDates.has(currentDate.toISOString().split('T')[0])) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    }

    res.json({
      totalCards,
      dueToday,
      newCards,
      reviewedToday,
      streak
    })

  } catch (error) {
    console.error('获取复习统计错误:', error)
    res.status(500).json({ error: '获取复习统计失败' })
  }
})

// 获取所有复习卡片
router.get('/cards', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId
    const { graphId } = req.query

    const cards = await prisma.reviewCard.findMany({
      where: {
        userId,
        ...(graphId ? { graphId: graphId as string } : {})
      },
      include: {
        node: {
          select: {
            id: true,
            title: true,
            content: true,
            summary: true
          }
        },
        graph: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    })

    res.json({ cards })

  } catch (error) {
    console.error('获取复习卡片错误:', error)
    res.status(500).json({ error: '获取复习卡片失败' })
  }
})

export default router
