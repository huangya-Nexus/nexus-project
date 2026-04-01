import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { createAIService } from '../services/ai.js';
const router = Router();
const aiService = createAIService();
// 创建导入任务
router.post('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { graphId, type, content, filename } = req.body;
        if (!['TEXT', 'MARKDOWN', 'PDF', 'URL'].includes(type)) {
            return res.status(400).json({ error: '不支持的导入类型' });
        }
        if (!content || content.length < 10) {
            return res.status(400).json({ error: '内容太短' });
        }
        // 验证图谱归属
        const graph = await prisma.knowledgeGraph.findFirst({
            where: { id: graphId, userId, status: 'ACTIVE' }
        });
        if (!graph) {
            return res.status(404).json({ error: '图谱不存在' });
        }
        // 检查配额
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user || user.aiQuotaUsed >= user.aiQuotaMonthly) {
            return res.status(403).json({ error: 'AI 调用配额已用完' });
        }
        // 创建任务
        const task = await prisma.importTask.create({
            data: {
                type,
                status: 'PROCESSING',
                content: content.slice(0, 5000), // 限制存储大小
                filename,
                userId,
                graphId
            }
        });
        // 异步处理（简化版，直接处理）
        try {
            // 调用 AI 提取
            const nodes = await aiService.extractKnowledge(content);
            // 创建知识点
            const createdNodes = [];
            for (const node of nodes) {
                const created = await prisma.knowledgeNode.create({
                    data: {
                        title: node.title,
                        content: node.content,
                        keywords: JSON.stringify(node.keywords),
                        graphId
                    }
                });
                createdNodes.push(created);
            }
            // 更新图谱计数
            await prisma.knowledgeGraph.update({
                where: { id: graphId },
                data: { nodeCount: { increment: nodes.length } }
            });
            // 更新任务状态
            await prisma.importTask.update({
                where: { id: task.id },
                data: {
                    status: 'COMPLETED',
                    result: JSON.stringify(createdNodes),
                    completedAt: new Date()
                }
            });
            // 更新配额
            await prisma.user.update({
                where: { id: userId },
                data: { aiQuotaUsed: { increment: 1 } }
            });
            res.status(201).json({
                message: '导入成功',
                taskId: task.id,
                importedCount: nodes.length,
                nodes: createdNodes
            });
        }
        catch (error) {
            // 更新任务失败状态
            await prisma.importTask.update({
                where: { id: task.id },
                data: {
                    status: 'FAILED',
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            throw error;
        }
    }
    catch (error) {
        console.error('导入任务错误:', error);
        res.status(500).json({ error: '导入失败' });
    }
});
// 获取导入任务列表
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = '1', limit = '10' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        const [tasks, total] = await Promise.all([
            prisma.importTask.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take,
                select: {
                    id: true,
                    type: true,
                    status: true,
                    filename: true,
                    createdAt: true,
                    completedAt: true,
                    graphId: true
                }
            }),
            prisma.importTask.count({ where: { userId } })
        ]);
        res.json({
            tasks,
            pagination: {
                page: parseInt(page),
                limit: take,
                total,
                totalPages: Math.ceil(total / take)
            }
        });
    }
    catch (error) {
        console.error('获取导入任务列表错误:', error);
        res.status(500).json({ error: '获取列表失败' });
    }
});
// 获取导入任务详情
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user.userId;
        const task = await prisma.importTask.findFirst({
            where: { id: taskId, userId }
        });
        if (!task) {
            return res.status(404).json({ error: '任务不存在' });
        }
        res.json({
            task: {
                ...task,
                result: task.result ? JSON.parse(task.result) : null
            }
        });
    }
    catch (error) {
        console.error('获取导入任务详情错误:', error);
        res.status(500).json({ error: '获取详情失败' });
    }
});
export default router;
//# sourceMappingURL=import.js.map