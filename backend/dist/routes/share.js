import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
const router = Router();
const prisma = new PrismaClient();
// 创建分享链接
router.post('/:graphId/share', authMiddleware, async (req, res) => {
    try {
        const graphId = req.params.graphId;
        const { permission = 'read', expiresIn = '7d' } = req.body;
        const userId = req.user?.userId;
        // 检查图谱所有权
        const graph = await prisma.knowledgeGraph.findFirst({
            where: { id: graphId, userId }
        });
        if (!graph) {
            return res.status(404).json({ error: '图谱不存在或无权限' });
        }
        // 计算过期时间
        const expiresAt = new Date();
        const days = parseInt(expiresIn);
        expiresAt.setDate(expiresAt.getDate() + days);
        // 创建分享记录
        const share = await prisma.graphShare.create({
            data: {
                id: uuidv4(),
                graphId,
                userId,
                permission,
                expiresAt,
                shareToken: uuidv4()
            }
        });
        // 生成分享链接
        const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/${share.shareToken}`;
        res.json({
            shareUrl,
            shareToken: share.shareToken,
            expiresAt: share.expiresAt,
            permission: share.permission
        });
    }
    catch (error) {
        console.error('创建分享链接失败:', error);
        res.status(500).json({ error: '创建分享链接失败' });
    }
});
// 通过分享链接获取图谱
router.get('/token/:shareToken', async (req, res) => {
    try {
        const { shareToken } = req.params;
        // 查找分享记录
        const share = await prisma.graphShare.findUnique({
            where: { shareToken }
        });
        if (!share) {
            return res.status(404).json({ error: '分享链接不存在' });
        }
        // 检查是否过期
        if (new Date() > share.expiresAt) {
            return res.status(410).json({ error: '分享链接已过期' });
        }
        // 获取图谱详情
        const graph = await prisma.knowledgeGraph.findUnique({
            where: { id: share.graphId },
            include: {
                nodes: true,
                edges: true
            }
        });
        if (!graph) {
            return res.status(404).json({ error: '图谱不存在' });
        }
        // 增加访问次数
        await prisma.graphShare.update({
            where: { id: share.id },
            data: { viewCount: { increment: 1 } }
        });
        res.json({
            graph,
            permission: share.permission,
            expiresAt: share.expiresAt
        });
    }
    catch (error) {
        console.error('获取分享图谱失败:', error);
        res.status(500).json({ error: '获取分享图谱失败' });
    }
});
// 复制分享的图谱到自己的账户
router.post('/token/:shareToken/clone', authMiddleware, async (req, res) => {
    try {
        const shareToken = req.params.shareToken;
        const userId = req.user?.userId;
        // 查找分享记录
        const share = await prisma.graphShare.findUnique({
            where: { shareToken: shareToken }
        });
        if (!share) {
            return res.status(404).json({ error: '分享链接不存在' });
        }
        // 检查是否过期
        if (new Date() > share.expiresAt) {
            return res.status(410).json({ error: '分享链接已过期' });
        }
        // 检查权限
        if (share.permission !== 'clone') {
            return res.status(403).json({ error: '该分享链接不允许复制' });
        }
        // 获取原图谱
        const originalGraph = await prisma.knowledgeGraph.findUnique({
            where: { id: share.graphId },
            include: {
                nodes: true,
                edges: true
            }
        });
        if (!originalGraph) {
            return res.status(404).json({ error: '原图谱不存在' });
        }
        // 创建新图谱
        const newGraph = await prisma.knowledgeGraph.create({
            data: {
                title: `${originalGraph.title} (复制)`,
                description: originalGraph.description,
                userId,
                nodeCount: originalGraph.nodeCount,
                edgeCount: originalGraph.edgeCount
            }
        });
        // 复制节点
        const nodeMap = new Map();
        for (const node of originalGraph.nodes) {
            const newNode = await prisma.knowledgeNode.create({
                data: {
                    graphId: newGraph.id,
                    title: node.title,
                    content: node.content,
                    positionX: node.positionX,
                    positionY: node.positionY
                }
            });
            nodeMap.set(node.id, newNode.id);
        }
        // 复制关联
        for (const edge of originalGraph.edges) {
            const sourceId = nodeMap.get(edge.sourceId);
            const targetId = nodeMap.get(edge.targetId);
            if (sourceId && targetId) {
                await prisma.knowledgeEdge.create({
                    data: {
                        graphId: newGraph.id,
                        sourceId,
                        targetId,
                        type: edge.type,
                        label: edge.label
                    }
                });
            }
        }
        // 增加复制次数
        await prisma.graphShare.update({
            where: { id: share.id },
            data: { cloneCount: { increment: 1 } }
        });
        res.json({
            message: '图谱复制成功',
            graph: newGraph
        });
    }
    catch (error) {
        console.error('复制图谱失败:', error);
        res.status(500).json({ error: '复制图谱失败' });
    }
});
// 获取我的分享列表
router.get('/my/shares', authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.userId;
        const shares = await prisma.graphShare.findMany({
            where: { userId },
            include: {
                graph: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(shares);
    }
    catch (error) {
        console.error('获取分享列表失败:', error);
        res.status(500).json({ error: '获取分享列表失败' });
    }
});
// 取消分享
router.delete('/:shareId', authMiddleware, async (req, res) => {
    try {
        const shareId = req.params.shareId;
        const userId = req.user?.userId;
        const share = await prisma.graphShare.findFirst({
            where: { id: shareId, userId }
        });
        if (!share) {
            return res.status(404).json({ error: '分享不存在或无权限' });
        }
        await prisma.graphShare.delete({
            where: { id: shareId }
        });
        res.json({ message: '分享已取消' });
    }
    catch (error) {
        console.error('取消分享失败:', error);
        res.status(500).json({ error: '取消分享失败' });
    }
});
export default router;
//# sourceMappingURL=share.js.map