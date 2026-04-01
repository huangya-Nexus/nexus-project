import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { authMiddleware } from '../middleware/auth.js';
const router = Router();
// 导出完整图谱数据（包括节点和关联）
router.get('/:id/export', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const graph = await prisma.knowledgeGraph.findFirst({
            where: { id: id, userId, status: 'ACTIVE' }
        });
        if (!graph) {
            return res.status(404).json({ error: '图谱不存在' });
        }
        // 重新查询以获取节点和关联
        const nodes = await prisma.knowledgeNode.findMany({
            where: { graphId: id }
        });
        const edges = await prisma.knowledgeEdge.findMany({
            where: { graphId: id }
        });
        // 构建导出数据
        const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            graph: {
                title: graph.title,
                description: graph.description,
                tags: graph.tags ? JSON.parse(graph.tags) : []
            },
            nodes: nodes.map((node) => ({
                title: node.title,
                content: node.content,
                summary: node.summary,
                keywords: node.keywords ? JSON.parse(node.keywords) : [],
                positionX: node.positionX,
                positionY: node.positionY
            })),
            edges: edges.map((edge) => ({
                sourceTitle: nodes.find((n) => n.id === edge.sourceId)?.title,
                targetTitle: nodes.find((n) => n.id === edge.targetId)?.title,
                type: edge.type,
                label: edge.label
            })).filter((e) => e.sourceTitle && e.targetTitle)
        };
        res.json({ data: exportData });
    }
    catch (error) {
        console.error('导出图谱错误:', error);
        res.status(500).json({ error: '导出失败' });
    }
});
// 导入完整图谱数据
router.post('/import', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { data } = req.body;
        if (!data || !data.graph || !data.nodes) {
            return res.status(400).json({ error: '无效的导入数据' });
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
            return res.status(403).json({ error: '已达到图谱创建上限' });
        }
        // 创建新图谱
        const graph = await prisma.knowledgeGraph.create({
            data: {
                title: data.graph.title + ' (导入)',
                description: data.graph.description,
                tags: data.graph.tags ? JSON.stringify(data.graph.tags) : null,
                userId
            }
        });
        // 创建节点映射（用于重建关联）
        const nodeMap = new Map();
        // 批量创建节点
        for (const nodeData of data.nodes) {
            const node = await prisma.knowledgeNode.create({
                data: {
                    title: nodeData.title,
                    content: nodeData.content,
                    summary: nodeData.summary,
                    keywords: nodeData.keywords ? JSON.stringify(nodeData.keywords) : null,
                    positionX: nodeData.positionX,
                    positionY: nodeData.positionY,
                    graphId: graph.id
                }
            });
            nodeMap.set(nodeData.title, node.id);
        }
        // 批量创建关联
        if (data.edges && data.edges.length > 0) {
            for (const edgeData of data.edges) {
                const sourceId = nodeMap.get(edgeData.sourceTitle);
                const targetId = nodeMap.get(edgeData.targetTitle);
                if (sourceId && targetId) {
                    await prisma.knowledgeEdge.create({
                        data: {
                            type: edgeData.type || 'RELATED',
                            label: edgeData.label,
                            graphId: graph.id,
                            sourceId,
                            targetId
                        }
                    }).catch(() => {
                        // 忽略重复关联错误
                    });
                }
            }
        }
        // 更新图谱统计
        const nodeCount = await prisma.knowledgeNode.count({
            where: { graphId: graph.id }
        });
        const edgeCount = await prisma.knowledgeEdge.count({
            where: { graphId: graph.id }
        });
        await prisma.knowledgeGraph.update({
            where: { id: graph.id },
            data: { nodeCount, edgeCount }
        });
        res.status(201).json({
            message: '导入成功',
            graphId: graph.id,
            nodeCount,
            edgeCount
        });
    }
    catch (error) {
        console.error('导入图谱错误:', error);
        res.status(500).json({ error: '导入失败' });
    }
});
export default router;
//# sourceMappingURL=backup.js.map