import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { createAIService } from '../services/ai.js';
const router = Router();
const aiService = createAIService();
// 从文本提取知识点
router.post('/extract', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { graphId, text } = req.body;
        if (!text || text.length < 10) {
            return res.status(400).json({ error: '文本内容太短，至少需要10个字符' });
        }
        // 验证图谱归属
        const graph = await prisma.knowledgeGraph.findFirst({
            where: { id: graphId, userId, status: 'ACTIVE' }
        });
        if (!graph) {
            return res.status(404).json({ error: '图谱不存在' });
        }
        // 检查用户 AI 配额
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }
        if (user.aiQuotaUsed >= user.aiQuotaMonthly) {
            return res.status(403).json({ error: 'AI 调用配额已用完，请下月再试或升级套餐' });
        }
        // 调用 AI 提取知识点
        const nodes = await aiService.extractKnowledge(text);
        // 创建导入任务记录
        const importTask = await prisma.importTask.create({
            data: {
                type: 'TEXT',
                status: 'COMPLETED',
                content: text.slice(0, 1000), // 保存前1000字符
                result: JSON.stringify(nodes),
                userId,
                graphId
            }
        });
        // 更新用户配额
        await prisma.user.update({
            where: { id: userId },
            data: { aiQuotaUsed: { increment: 1 } }
        });
        res.json({
            message: '知识点提取成功',
            taskId: importTask.id,
            nodes: nodes.map((node, index) => ({
                id: `temp-${index}`, // 临时ID，前端使用
                ...node
            }))
        });
    }
    catch (error) {
        console.error('AI提取知识点错误:', error);
        res.status(500).json({ error: 'AI提取失败，请稍后重试' });
    }
});
// 生成知识点摘要
router.post('/summarize', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { nodeId } = req.body;
        // 验证知识点归属
        const node = await prisma.knowledgeNode.findFirst({
            where: { id: nodeId },
            include: { graph: true }
        });
        if (!node || node.graph.userId !== userId) {
            return res.status(404).json({ error: '知识点不存在' });
        }
        // 检查配额
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user || user.aiQuotaUsed >= user.aiQuotaMonthly) {
            return res.status(403).json({ error: 'AI 调用配额已用完' });
        }
        // 生成摘要
        const summary = await aiService.generateSummary(node.content);
        // 更新知识点
        await prisma.knowledgeNode.update({
            where: { id: nodeId },
            data: { summary }
        });
        // 更新配额
        await prisma.user.update({
            where: { id: userId },
            data: { aiQuotaUsed: { increment: 1 } }
        });
        res.json({
            message: '摘要生成成功',
            summary
        });
    }
    catch (error) {
        console.error('AI生成摘要错误:', error);
        res.status(500).json({ error: '生成摘要失败' });
    }
});
// AI 推荐关联
router.post('/suggest-relations', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { graphId, nodeId } = req.body;
        // 验证图谱归属
        const graph = await prisma.knowledgeGraph.findFirst({
            where: { id: graphId, userId, status: 'ACTIVE' },
            include: { nodes: true }
        });
        if (!graph) {
            return res.status(404).json({ error: '图谱不存在' });
        }
        const sourceNode = graph.nodes.find(n => n.id === nodeId);
        if (!sourceNode) {
            return res.status(404).json({ error: '知识点不存在' });
        }
        // 检查配额
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user || user.aiQuotaUsed >= user.aiQuotaMonthly) {
            return res.status(403).json({ error: 'AI 调用配额已用完' });
        }
        // 与其他节点比较，找出可能的关联
        const suggestions = [];
        for (const targetNode of graph.nodes) {
            if (targetNode.id === nodeId)
                continue;
            const relation = await aiService.suggestRelations({
                title: sourceNode.title,
                content: sourceNode.content,
                keywords: sourceNode.keywords ? JSON.parse(sourceNode.keywords) : []
            }, {
                title: targetNode.title,
                content: targetNode.content,
                keywords: targetNode.keywords ? JSON.parse(targetNode.keywords) : []
            });
            if (relation && relation.confidence > 0.6) {
                suggestions.push({
                    targetId: targetNode.id,
                    targetTitle: targetNode.title,
                    ...relation
                });
            }
        }
        // 按置信度排序
        suggestions.sort((a, b) => b.confidence - a.confidence);
        // 更新配额（只算一次）
        await prisma.user.update({
            where: { id: userId },
            data: { aiQuotaUsed: { increment: 1 } }
        });
        res.json({
            message: '关联推荐完成',
            suggestions: suggestions.slice(0, 5) // 返回前5个
        });
    }
    catch (error) {
        console.error('AI推荐关联错误:', error);
        res.status(500).json({ error: '推荐关联失败' });
    }
});
export default router;
//# sourceMappingURL=ai.js.map