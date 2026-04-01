import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { authMiddleware } from '../middleware/auth.js';
const router = Router();
// 创建图谱
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, tags } = req.body;
        const userId = req.user.userId;
        if (!title) {
            return res.status(400).json({ error: '图谱标题不能为空' });
        }
        // 检查用户图谱配额
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { _count: { select: { graphs: true } } }
        });
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }
        if (user._count.graphs >= user.graphQuota) {
            return res.status(403).json({ error: '已达到图谱创建上限，请升级套餐' });
        }
        const graph = await prisma.knowledgeGraph.create({
            data: {
                title,
                description,
                tags: tags ? JSON.stringify(tags) : null,
                userId
            }
        });
        res.status(201).json({
            message: '图谱创建成功',
            graph: {
                ...graph,
                tags: tags || []
            }
        });
    }
    catch (error) {
        console.error('创建图谱错误:', error);
        res.status(500).json({ error: '创建图谱失败' });
    }
});
// 获取用户的所有图谱
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        console.log('DEBUG: Getting graphs for userId:', userId);
        const { page = '1', limit = '10' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        const [graphs, total] = await Promise.all([
            prisma.knowledgeGraph.findMany({
                where: { userId, status: 'ACTIVE' },
                orderBy: { updatedAt: 'desc' },
                skip,
                take
            }),
            prisma.knowledgeGraph.count({
                where: { userId, status: 'ACTIVE' }
            })
        ]);
        console.log('DEBUG: Found graphs:', graphs.length, 'total:', total);
        console.log('DEBUG: userId from token:', userId);
        console.log('DEBUG: all graphs in db:', await prisma.knowledgeGraph.findMany());
        res.json({
            graphs: graphs.map(g => ({
                ...g,
                tags: g.tags ? JSON.parse(g.tags) : []
            })),
            pagination: {
                page: parseInt(page),
                limit: take,
                total,
                totalPages: Math.ceil(total / take)
            },
            debug: {
                userId,
                dbPath: process.env.DATABASE_URL
            }
        });
    }
    catch (error) {
        console.error('获取图谱列表错误:', error);
        res.status(500).json({ error: '获取图谱列表失败' });
    }
});
// 获取单个图谱详情
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user.userId;
        const graph = await prisma.knowledgeGraph.findFirst({
            where: { id, userId, status: 'ACTIVE' },
            include: {
                nodes: {
                    orderBy: { createdAt: 'desc' }
                },
                edges: true
            }
        });
        if (!graph) {
            return res.status(404).json({ error: '图谱不存在' });
        }
        res.json({
            graph: {
                ...graph,
                tags: graph.tags ? JSON.parse(graph.tags) : [],
                nodes: graph.nodes.map((n) => ({
                    ...n,
                    keywords: n.keywords ? JSON.parse(n.keywords) : []
                }))
            }
        });
    }
    catch (error) {
        console.error('获取图谱详情错误:', error);
        res.status(500).json({ error: '获取图谱详情失败' });
    }
});
// 更新图谱
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user.userId;
        const { title, description, tags } = req.body;
        const graph = await prisma.knowledgeGraph.findFirst({
            where: { id, userId, status: 'ACTIVE' }
        });
        if (!graph) {
            return res.status(404).json({ error: '图谱不存在' });
        }
        const updated = await prisma.knowledgeGraph.update({
            where: { id },
            data: {
                title: title || graph.title,
                description: description !== undefined ? description : graph.description,
                tags: tags ? JSON.stringify(tags) : graph.tags
            }
        });
        res.json({
            message: '图谱更新成功',
            graph: {
                ...updated,
                tags: updated.tags ? JSON.parse(updated.tags) : []
            }
        });
    }
    catch (error) {
        console.error('更新图谱错误:', error);
        res.status(500).json({ error: '更新图谱失败' });
    }
});
// 删除图谱 (软删除)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user.userId;
        const graph = await prisma.knowledgeGraph.findFirst({
            where: { id, userId, status: 'ACTIVE' }
        });
        if (!graph) {
            return res.status(404).json({ error: '图谱不存在' });
        }
        await prisma.knowledgeGraph.update({
            where: { id },
            data: { status: 'DELETED' }
        });
        res.json({ message: '图谱删除成功' });
    }
    catch (error) {
        console.error('删除图谱错误:', error);
        res.status(500).json({ error: '删除图谱失败' });
    }
});
export default router;
//# sourceMappingURL=graphs.js.map