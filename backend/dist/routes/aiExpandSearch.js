import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { createAIService } from '../services/ai.js';
const router = Router();
const aiService = createAIService();
// 生成详细立体的知识网络
router.get('/', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: '关键词不能为空' });
        }
        const searchTerm = q.trim();
        // 调用 AI 生成立体知识网络
        const aiPrompt = `作为知识图谱专家，请为"${searchTerm}"生成一个详细、立体、相互关联的知识网络。

要求：
1. **核心概念** (1个): 给出详细的定义、背景、重要性
2. **主干知识点** (5-7个): 每个知识点包含：
   - 详细定义 (200字以上)
   - 关键属性/特征 (3-5个)
   - 实际应用案例
   - 与其他知识点的关联关系
3. **知识关联** (10条以上): 明确说明知识点之间的逻辑关系
4. **知识层次**: 按基础→进阶→高级组织
5. **可视化数据**: 提供适合图形展示的数据结构

请用以下 JSON 格式返回：
{
  "core": {
    "title": "核心概念名称",
    "definition": "详细定义...",
    "background": "背景介绍...",
    "importance": "重要性说明..."
  },
  "nodes": [
    {
      "id": "node-1",
      "title": "知识点标题",
      "definition": "详细定义...",
      "attributes": ["特征1", "特征2", "特征3"],
      "examples": ["案例1", "案例2"],
      "level": "基础|进阶|高级",
      "position": { "x": 0, "y": 0 }
    }
  ],
  "edges": [
    {
      "source": "node-1",
      "target": "node-2",
      "relation": "关系类型",
      "description": "关系说明"
    }
  ],
  "learningPath": [
    { "step": 1, "nodeId": "node-1", "title": "步骤标题", "description": "学习内容" }
  ],
  "visualization": {
    "layout": "force-directed",
    "clusters": [
      { "name": "基础概念", "nodes": ["node-1", "node-2"] },
      { "name": "进阶应用", "nodes": ["node-3", "node-4"] }
    ]
  }
}`;
        let knowledgeNetwork = null;
        try {
            const aiResponse = await aiService.generateText(aiPrompt);
            // 尝试解析 JSON
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                knowledgeNetwork = JSON.parse(jsonMatch[0]);
            }
        }
        catch (aiError) {
            console.error('AI 生成失败:', aiError);
        }
        // 如果 AI 生成失败，使用备用数据
        if (!knowledgeNetwork) {
            knowledgeNetwork = generateFallbackNetwork(searchTerm);
        }
        // 搜索现有相关知识点
        const existingNodes = await prisma.knowledgeNode.findMany({
            where: {
                OR: [
                    { title: { contains: searchTerm } },
                    { content: { contains: searchTerm } }
                ]
            },
            include: {
                graph: { select: { id: true, title: true } },
                sourceEdges: {
                    include: { target: { select: { id: true, title: true } } }
                },
                targetEdges: {
                    include: { source: { select: { id: true, title: true } } }
                }
            },
            take: 5
        });
        res.json({
            query: searchTerm,
            aiGenerated: knowledgeNetwork,
            existing: existingNodes.map(node => ({
                id: node.id,
                title: node.title,
                content: node.content.substring(0, 200),
                graph: node.graph,
                relations: [
                    ...node.sourceEdges.map(e => ({ to: e.target.title, type: '关联' })),
                    ...node.targetEdges.map(e => ({ from: e.source.title, type: '关联' }))
                ]
            })),
            meta: {
                totalNodes: knowledgeNetwork.nodes?.length || 0,
                totalEdges: knowledgeNetwork.edges?.length || 0,
                clusters: knowledgeNetwork.visualization?.clusters?.length || 0
            }
        });
    }
    catch (error) {
        console.error('AI 知识网络生成错误:', error);
        res.status(500).json({ error: '生成失败' });
    }
});
// 备用数据生成
function generateFallbackNetwork(searchTerm) {
    return {
        core: {
            title: searchTerm,
            definition: `${searchTerm}是一个重要的知识领域，涉及多个方面的内容。`,
            background: '这个领域有着悠久的发展历史。',
            importance: '掌握这个知识对于深入理解相关领域至关重要。'
        },
        nodes: [
            {
                id: 'node-1',
                title: `${searchTerm}基础概念`,
                definition: '这是入门必须掌握的基础知识，包括核心定义、基本原理和关键术语。',
                attributes: ['核心定义', '基本原理', '关键术语', '应用场景'],
                examples: ['实际案例1', '实际案例2'],
                level: '基础',
                position: { x: 0, y: 0 }
            },
            {
                id: 'node-2',
                title: `${searchTerm}核心原理`,
                definition: '深入理解这个领域的核心工作机制和理论基础。',
                attributes: ['工作机制', '理论基础', '数学模型', '算法原理'],
                examples: ['原理应用1', '原理应用2'],
                level: '进阶',
                position: { x: 100, y: -50 }
            },
            {
                id: 'node-3',
                title: `${searchTerm}实践应用`,
                definition: '将理论知识应用到实际问题中，解决具体场景的需求。',
                attributes: ['实际场景', '解决方案', '最佳实践', '常见陷阱'],
                examples: ['应用案例1', '应用案例2'],
                level: '进阶',
                position: { x: 100, y: 50 }
            },
            {
                id: 'node-4',
                title: `${searchTerm}高级技术`,
                definition: '掌握这个领域的高级技术和前沿发展方向。',
                attributes: ['前沿技术', '高级算法', '性能优化', '创新应用'],
                examples: ['高级案例1', '高级案例2'],
                level: '高级',
                position: { x: 200, y: 0 }
            },
            {
                id: 'node-5',
                title: `${searchTerm}相关工具`,
                definition: '了解和掌握这个领域常用的工具和资源。',
                attributes: ['主流工具', '开源资源', '学习资料', '社区支持'],
                examples: ['工具示例1', '工具示例2'],
                level: '基础',
                position: { x: 50, y: 100 }
            }
        ],
        edges: [
            { source: 'node-1', target: 'node-2', relation: '前置知识', description: '必须先掌握基础概念' },
            { source: 'node-1', target: 'node-3', relation: '应用场景', description: '基础概念的实际应用' },
            { source: 'node-2', target: 'node-4', relation: '进阶发展', description: '核心原理的高级应用' },
            { source: 'node-3', target: 'node-4', relation: '实践升华', description: '从实践到高级技术' },
            { source: 'node-1', target: 'node-5', relation: '工具支持', description: '使用工具辅助学习' },
            { source: 'node-2', target: 'node-3', relation: '理论指导', description: '原理指导实践' }
        ],
        learningPath: [
            { step: 1, nodeId: 'node-1', title: '掌握基础', description: '学习核心概念和基本术语' },
            { step: 2, nodeId: 'node-5', title: '熟悉工具', description: '了解和使用相关工具' },
            { step: 3, nodeId: 'node-2', title: '理解原理', description: '深入学习核心原理' },
            { step: 4, nodeId: 'node-3', title: '实践应用', description: '将知识应用到实际问题' },
            { step: 5, nodeId: 'node-4', title: '掌握高级技术', description: '学习高级技术和前沿发展' }
        ],
        visualization: {
            layout: 'force-directed',
            clusters: [
                { name: '基础知识', nodes: ['node-1', 'node-5'] },
                { name: '核心能力', nodes: ['node-2', 'node-3'] },
                { name: '高级应用', nodes: ['node-4'] }
            ]
        }
    };
}
export default router;
//# sourceMappingURL=aiExpandSearch.js.map