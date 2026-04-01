import { Router } from 'express';
import { prisma } from '../lib/db.js';
const router = Router();
// 公开搜索API - 无需登录
router.get('/public', async (req, res) => {
    try {
        const { q, page = '1', limit = '10' } = req.query;
        if (!q || typeof q !== 'string' || !q.trim()) {
            return res.status(400).json({ error: '搜索关键词不能为空' });
        }
        const searchTerm = q.trim().toLowerCase();
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        // 搜索公开图谱 (SQLite 不支持 mode: 'insensitive', 使用 LOWER 函数)
        const [graphs, totalGraphs] = await Promise.all([
            prisma.knowledgeGraph.findMany({
                where: {
                    isPublic: true,
                    status: 'ACTIVE',
                    OR: [
                        { title: { contains: searchTerm } },
                        { description: { contains: searchTerm } }
                    ]
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    _count: {
                        select: {
                            nodes: true
                        }
                    }
                },
                orderBy: { viewCount: 'desc' },
                skip,
                take
            }),
            prisma.knowledgeGraph.count({
                where: {
                    isPublic: true,
                    status: 'ACTIVE',
                    OR: [
                        { title: { contains: searchTerm } },
                        { description: { contains: searchTerm } }
                    ]
                }
            })
        ]);
        // 搜索知识点（只在公开图谱中）
        const [nodes, totalNodes] = await Promise.all([
            prisma.knowledgeNode.findMany({
                where: {
                    OR: [
                        { title: { contains: searchTerm } },
                        { content: { contains: searchTerm } }
                    ],
                    graph: {
                        isPublic: true,
                        status: 'ACTIVE'
                    }
                },
                include: {
                    graph: {
                        select: {
                            id: true,
                            title: true,
                            user: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                },
                take: 5
            }),
            prisma.knowledgeNode.count({
                where: {
                    OR: [
                        { title: { contains: searchTerm } },
                        { content: { contains: searchTerm } }
                    ],
                    graph: {
                        isPublic: true,
                        status: 'ACTIVE'
                    }
                }
            })
        ]);
        res.json({
            query: searchTerm,
            graphs: {
                items: graphs.map(g => ({
                    id: g.id,
                    title: g.title,
                    description: g.description,
                    nodeCount: g._count.nodes,
                    author: g.user.name,
                    createdAt: g.createdAt
                })),
                total: totalGraphs,
                page: parseInt(page),
                totalPages: Math.ceil(totalGraphs / take)
            },
            nodes: {
                items: nodes.map(n => ({
                    id: n.id,
                    title: n.title,
                    content: n.content.substring(0, 200) + (n.content.length > 200 ? '...' : ''),
                    graphId: n.graph.id,
                    graphTitle: n.graph.title,
                    author: n.graph.user.name
                })),
                total: totalNodes
            }
        });
    }
    catch (error) {
        console.error('公开搜索错误:', error);
        res.status(500).json({ error: '搜索失败' });
    }
});
// 获取热门搜索/推荐
router.get('/trending', async (req, res) => {
    try {
        // 获取最受欢迎的公开图谱
        const trendingGraphs = await prisma.knowledgeGraph.findMany({
            where: {
                isPublic: true,
                status: 'ACTIVE'
            },
            include: {
                user: {
                    select: {
                        name: true
                    }
                },
                _count: {
                    select: {
                        nodes: true
                    }
                }
            },
            orderBy: { viewCount: 'desc' },
            take: 6
        });
        res.json({
            graphs: trendingGraphs.map(g => ({
                id: g.id,
                title: g.title,
                description: g.description,
                nodeCount: g._count.nodes,
                author: g.user.name,
                viewCount: g.viewCount
            }))
        });
    }
    catch (error) {
        console.error('获取热门错误:', error);
        res.status(500).json({ error: '获取热门失败' });
    }
});
export default router;
//# sourceMappingURL=search.js.map