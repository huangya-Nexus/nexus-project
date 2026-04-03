import { Router } from 'express';
import { prisma } from '../lib/db.js';
const router = Router();
// 简单的增强搜索 - 先测试基础功能
router.get('/', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string' || !q.trim()) {
            return res.status(400).json({ error: '搜索关键词不能为空' });
        }
        const searchTerm = q.trim().toLowerCase();
        // 搜索知识点
        const nodes = await prisma.knowledgeNode.findMany({
            where: {
                OR: [
                    { title: { contains: searchTerm } },
                    { content: { contains: searchTerm } }
                ]
            },
            include: {
                graph: { select: { id: true, title: true } },
                _count: {
                    select: { sourceEdges: true, targetEdges: true }
                }
            },
            take: 10
        });
        // 搜索图谱
        const graphs = await prisma.knowledgeGraph.findMany({
            where: {
                OR: [
                    { title: { contains: searchTerm } },
                    { description: { contains: searchTerm } }
                ]
            },
            include: {
                _count: { select: { nodes: true } },
                user: { select: { name: true } }
            },
            take: 5
        });
        // 获取关联信息
        const nodesWithRelated = await Promise.all(nodes.map(async (node) => {
            // 获取关联边
            const edges = await prisma.knowledgeEdge.findMany({
                where: {
                    OR: [{ sourceId: node.id }, { targetId: node.id }]
                },
                include: {
                    source: { select: { id: true, title: true } },
                    target: { select: { id: true, title: true } }
                },
                take: 3
            });
            const relatedNodes = edges.map(edge => ({
                id: edge.sourceId === node.id ? edge.target.id : edge.source.id,
                title: edge.sourceId === node.id ? edge.target.title : edge.source.title,
                relation: edge.label || edge.type || '关联'
            }));
            return {
                id: node.id,
                title: node.title,
                content: node.content.substring(0, 200),
                graph: node.graph,
                edgeCount: node._count.sourceEdges + node._count.targetEdges,
                relatedNodes
            };
        }));
        res.json({
            query: searchTerm,
            nodes: nodesWithRelated,
            graphs: graphs.map(g => ({
                id: g.id,
                title: g.title,
                description: g.description,
                nodeCount: g._count.nodes,
                author: g.user.name
            }))
        });
    }
    catch (error) {
        console.error('增强搜索错误:', error);
        res.status(500).json({ error: '搜索失败', details: error instanceof Error ? error.message : 'Unknown error' });
    }
});
export default router;
//# sourceMappingURL=enhancedSearch.js.map