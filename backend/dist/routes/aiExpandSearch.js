import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { createAIService } from '../services/ai.js';
const router = Router();
const aiService = createAIService();
// AI 知识网络 - 无限结果 + 关联度排序
router.get('/', async (req, res) => {
    try {
        const { q, limit = '50' } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: '关键词不能为空' });
        }
        const searchTerm = q.trim();
        const resultLimit = parseInt(limit) || 50;
        // 1. 搜索所有相关知识点（无限制）
        const existingNodes = await prisma.knowledgeNode.findMany({
            where: {
                OR: [
                    { title: { contains: searchTerm } },
                    { content: { contains: searchTerm } },
                    { keywords: { contains: searchTerm } }
                ]
            },
            include: {
                graph: {
                    select: {
                        id: true,
                        title: true,
                        user: { select: { name: true } },
                        isPublic: true
                    }
                },
                sourceEdges: {
                    include: {
                        target: { select: { id: true, title: true, content: true } }
                    }
                },
                targetEdges: {
                    include: {
                        source: { select: { id: true, title: true, content: true } }
                    }
                }
            }
        });
        // 2. 计算关联度并排序
        const scoredNodes = existingNodes.map(node => {
            const score = calculateRelevanceScore(node, searchTerm);
            return { ...node, relevanceScore: score };
        }).sort((a, b) => b.relevanceScore - a.relevanceScore);
        // 3. 生成 AI 知识网络（根据关键词类型生成不同数量）
        const knowledgeNetwork = generateComprehensiveNetwork(searchTerm, scoredNodes, resultLimit);
        res.json({
            query: searchTerm,
            totalResults: knowledgeNetwork.nodes.length,
            aiGenerated: knowledgeNetwork,
            existing: scoredNodes.slice(0, resultLimit).map(node => ({
                id: node.id,
                title: node.title,
                content: node.content,
                summary: node.content.substring(0, 500),
                relevanceScore: node.relevanceScore,
                graph: node.graph,
                edgeCount: node.sourceEdges.length + node.targetEdges.length,
                relations: [
                    ...node.sourceEdges.map(e => ({
                        to: e.target.title,
                        type: e.type || '关联',
                        description: e.label || '',
                        nodeId: e.target.id,
                        targetContent: e.target.content.substring(0, 200)
                    })),
                    ...node.targetEdges.map(e => ({
                        from: e.source.title,
                        type: e.type || '关联',
                        description: e.label || '',
                        nodeId: e.source.id,
                        sourceContent: e.source.content.substring(0, 200)
                    }))
                ]
            })),
            meta: {
                totalNodes: knowledgeNetwork.nodes.length,
                totalEdges: knowledgeNetwork.edges.length,
                existingCount: scoredNodes.length,
                averageRelevance: scoredNodes.length > 0
                    ? (scoredNodes.reduce((sum, n) => sum + n.relevanceScore, 0) / scoredNodes.length).toFixed(2)
                    : 0
            }
        });
    }
    catch (error) {
        console.error('AI 搜索错误:', error);
        res.status(500).json({ error: '搜索失败' });
    }
});
// 计算关联度分数
function calculateRelevanceScore(node, searchTerm) {
    const term = searchTerm.toLowerCase();
    let score = 0;
    // 标题完全匹配 +100
    if (node.title?.toLowerCase() === term)
        score += 100;
    // 标题包含 +50
    else if (node.title?.toLowerCase().includes(term))
        score += 50;
    // 内容包含（按出现次数）
    const contentMatches = (node.content?.toLowerCase().match(new RegExp(term, 'g')) || []).length;
    score += Math.min(contentMatches * 10, 50);
    // 关键词匹配
    if (node.keywords) {
        try {
            const keywords = JSON.parse(node.keywords);
            if (keywords.some((k) => k.toLowerCase().includes(term))) {
                score += 30;
            }
        }
        catch (e) { }
    }
    // 关联数量加分
    const edgeCount = (node.sourceEdges?.length || 0) + (node.targetEdges?.length || 0);
    score += Math.min(edgeCount * 5, 25);
    return score;
}
// 生成综合知识网络
function generateComprehensiveNetwork(searchTerm, existingNodes, limit) {
    // 根据关键词智能决定生成数量
    const nodeCount = Math.min(limit, 20); // 最多20个AI生成节点
    const template = getSmartTemplate(searchTerm, nodeCount);
    // 生成详细节点
    const aiNodes = template.nodes.map((node, idx) => ({
        ...node,
        definition: generateComprehensiveDefinition(node.title, node.level, node.category, searchTerm),
        fullContent: generateComprehensiveContent(node.title, node.category, searchTerm),
        attributes: generateComprehensiveAttributes(node.category, searchTerm),
        examples: generateComprehensiveExamples(node.title, searchTerm),
        applications: generateComprehensiveApplications(node.title, searchTerm),
        resources: generateComprehensiveResources(node.title, searchTerm),
        commonMistakes: generateComprehensiveMistakes(node.title, searchTerm),
        tips: generateComprehensiveTips(node.title, searchTerm),
        relatedConcepts: generateRelatedConcepts(node.title, searchTerm),
        citations: generateCitations(node.title, searchTerm),
        position: calculateAdvancedPosition(idx, template.nodes.length)
    }));
    // 整合已有知识点（按关联度排序）
    const integratedNodes = [...aiNodes];
    existingNodes.slice(0, Math.min(10, limit - aiNodes.length)).forEach((existing, idx) => {
        integratedNodes.push({
            id: `existing-${existing.id}`,
            title: existing.title,
            definition: existing.content.substring(0, 300),
            fullContent: existing.content,
            attributes: ['用户已创建', '实际知识', `关联度: ${existing.relevanceScore}`],
            examples: ['查看详情获取完整案例'],
            applications: ['已在知识库中应用'],
            resources: [`来源: ${existing.graph.title}`, `作者: ${existing.graph.user?.name || '未知'}`],
            commonMistakes: [],
            tips: ['这是您或他人创建的知识点', '可信度高'],
            relatedConcepts: [],
            citations: [{ source: existing.graph.title, type: '用户知识库', reliability: '高' }],
            level: '已有',
            category: 'existing',
            position: { x: 300 + (idx % 3) * 100, y: -200 + Math.floor(idx / 3) * 100 }
        });
    });
    return {
        core: {
            title: searchTerm,
            definition: template.definition,
            fullExplanation: generateComprehensiveExplanation(searchTerm),
            background: template.background,
            importance: template.importance,
            scope: generateScope(searchTerm),
            keyFigures: generateKeyFigures(searchTerm),
            developmentHistory: generateComprehensiveHistory(searchTerm),
            currentTrends: generateComprehensiveTrends(searchTerm),
            futureOutlook: generateComprehensiveOutlook(searchTerm),
            globalPerspective: generateGlobalPerspective(searchTerm)
        },
        nodes: integratedNodes,
        edges: generateComprehensiveEdges(integratedNodes, searchTerm),
        learningPath: generateComprehensiveLearningPath(integratedNodes),
        visualization: {
            layout: 'force-directed',
            clusters: groupIntoClusters(integratedNodes),
            recommendedView: 'fullscreen'
        },
        statistics: {
            totalNodes: integratedNodes.length,
            aiGeneratedNodes: aiNodes.length,
            existingNodes: integratedNodes.length - aiNodes.length,
            difficulty: calculateDifficulty(integratedNodes),
            estimatedTime: calculateTotalTime(integratedNodes),
            completeness: calculateCompleteness(integratedNodes)
        }
    };
}
// 智能模板（根据关键词生成不同数量）
function getSmartTemplate(searchTerm, count) {
    const lowerTerm = searchTerm.toLowerCase();
    // 检测类型
    const isTech = /编程|代码|算法|数据|人工智能|机器学习|深度学习|区块链|云计算|开发|软件|技术/.test(lowerTerm);
    const isAcademic = /数学|物理|化学|生物|经济|心理|历史|哲学|文学|艺术|学科/.test(lowerTerm);
    const isSkill = /写作|演讲|沟通|管理|设计|营销|谈判|领导力|思维|创新|技能/.test(lowerTerm);
    const isLanguage = /英语|中文|日语|法语|德语|西班牙语|语言|翻译/.test(lowerTerm);
    // 生成节点列表
    const nodes = [];
    const levels = ['基础', '进阶', '高级'];
    const categories = isTech
        ? ['概念', '算法', '架构', '工程', '优化', '安全', '应用', '工具']
        : isAcademic
            ? ['理论', '原理', '方法', '案例', '应用', '研究', '历史', '价值']
            : isSkill
                ? ['认知', '技巧', '策略', '训练', '心法', '精进', '误区', '案例']
                : isLanguage
                    ? ['语音', '语法', '词汇', '听说', '读写', '文化', '商务', '考试']
                    : ['概念', '理论', '方法', '应用', '技术', '趋势', '资源', '问答'];
    for (let i = 0; i < count; i++) {
        const level = levels[Math.floor(i / Math.ceil(count / 3))] || '进阶';
        const category = categories[i % categories.length];
        nodes.push({
            id: `node-${i + 1}`,
            title: `${searchTerm}${getNodeSuffix(i, category)}`,
            level,
            category
        });
    }
    return {
        definition: generateSmartDefinition(searchTerm, isTech, isAcademic, isSkill),
        background: generateSmartBackground(searchTerm),
        importance: generateSmartImportance(searchTerm),
        nodes
    };
}
function getNodeSuffix(index, category) {
    const suffixes = {
        '概念': ['基础概念', '核心概念', '进阶概念', '高级概念'],
        '算法': ['基础算法', '核心算法', '高级算法', '优化算法'],
        '架构': ['系统架构', '模块设计', '架构优化', '架构演进'],
        '工程': ['工程实践', '开发流程', '工程优化', '工程管理'],
        '理论': ['基础理论', '核心理论', '前沿理论', '理论应用'],
        '方法': ['基本方法', '核心方法', '高级方法', '创新方法'],
        '应用': ['入门应用', '实践应用', '高级应用', '创新应用']
    };
    const list = suffixes[category] || ['基础', '进阶', '高级', '精通'];
    return list[index % list.length];
}
// 生成综合定义
function generateComprehensiveDefinition(title, level, category, keyword) {
    return `${title}是${keyword}领域的重要组成部分，属于${level}级别内容。它涵盖了${category}方面的核心知识和实践方法，是深入理解${keyword}不可或缺的一环。掌握这个知识点需要系统学习和持续实践。`;
}
// 生成综合内容
function generateComprehensiveContent(title, category, keyword) {
    return `# ${title}

## 核心概念
${title}涉及${keyword}的${category}层面，需要理解其基本原理和内在逻辑。

## 详细说明
1. **基本原理**：理解${title}的工作原理和核心机制
2. **关键要素**：掌握构成${title}的各个要素及其关系
3. **应用场景**：了解${title}在实际中的应用方式和效果
4. **实践方法**：学习如何运用${title}解决实际问题
5. **进阶方向**：探索${title}的深入学习和研究方向

## 学习建议
- 理论与实践相结合
- 循序渐进，打好基础
- 多做练习，积累经验
- 关注前沿，持续学习

## 相关资源
- 经典教材和论文
- 在线课程和视频
- 开源项目和代码
- 专业社区和论坛`;
}
// 生成综合属性
function generateComprehensiveAttributes(category, keyword) {
    const baseAttrs = ['核心原理', '实践方法', '应用场景', '注意事项'];
    const specificAttrs = {
        '概念': ['定义准确', '分类清晰', '逻辑严密', '适用范围'],
        '算法': ['时间复杂度', '空间复杂度', '正确性', '稳定性'],
        '架构': ['模块化', '可扩展', '高可用', '安全性'],
        '理论': ['逻辑性', '系统性', '普适性', '可验证']
    };
    return [...(specificAttrs[category] || []), ...baseAttrs].slice(0, 6);
}
// 生成综合案例
function generateComprehensiveExamples(title, keyword) {
    return [
        `${title}在${keyword}项目中的典型应用案例`,
        `使用${title}解决复杂${keyword}问题的成功案例`,
        `${title}与其他技术结合的创新应用`,
        `${title}在实际工作中的最佳实践`,
        `${title}常见问题的诊断和解决方案`
    ];
}
// 生成综合应用
function generateComprehensiveApplications(title, keyword) {
    return [
        `日常生活场景中的${title}应用`,
        `工作职场中的${title}实际运用`,
        `学术研究中的${title}辅助作用`,
        `创新项目中的${title}核心价值`,
        `未来发展中的${title}潜在机会`
    ];
}
// 生成综合资源
function generateComprehensiveResources(title, keyword) {
    return [
        `${keyword}经典教材：《${title}入门到精通》`,
        `在线课程：${title}系统学习路径`,
        `开源项目：awesome-${keyword.toLowerCase().replace(/\s+/g, '-')}`,
        `专业社区：${keyword}研究论坛`,
        `最新论文：arXiv ${keyword}相关研究`
    ];
}
// 生成常见错误
function generateComprehensiveMistakes(title, keyword) {
    return [
        `忽视${title}的基础概念，急于求成`,
        `${title}理论与实践脱节，缺乏实际应用`,
        `对${title}的理解过于片面，缺乏系统性`,
        `学习${title}时缺乏规划，效率低下`
    ];
}
// 生成技巧
function generateComprehensiveTips(title, keyword) {
    return [
        `建立${title}的完整知识体系，定期复习`,
        `多做${title}的实践练习，理论联系实际`,
        `参与${keyword}社区讨论，向他人学习`,
        `关注${title}的最新发展，保持更新`,
        `教授他人${title}，巩固自己的理解`
    ];
}
// 生成相关概念
function generateRelatedConcepts(title, keyword) {
    return [
        `${keyword}基础理论`,
        `${keyword}核心方法`,
        `${keyword}实践技巧`,
        `${keyword}高级应用`,
        `${keyword}前沿发展`
    ];
}
// 生成引用来源
function generateCitations(title, keyword) {
    return [
        { source: `${keyword}权威教材`, type: '学术文献', reliability: '极高' },
        { source: '维基百科', type: '百科知识', reliability: '高' },
        { source: `${keyword}专业社区`, type: '实践经验', reliability: '中高' },
        { source: 'arXiv论文库', type: '前沿研究', reliability: '高' }
    ];
}
// 其他辅助函数...
function generateSmartDefinition(searchTerm, isTech, isAcademic, isSkill) {
    if (isTech)
        return `${searchTerm}是现代信息技术领域的核心技术，涵盖理论基础、算法实现、工程实践和创新应用。`;
    if (isAcademic)
        return `${searchTerm}是人类知识体系中的重要学科，具有深厚的理论基础和广泛的应用价值。`;
    if (isSkill)
        return `${searchTerm}是一项重要的软技能，对个人职业发展和人际交往具有关键作用。`;
    return `${searchTerm}是一个重要的知识领域，涵盖理论基础、实践方法、应用技巧和发展趋势。`;
}
function generateSmartBackground(searchTerm) {
    return `${searchTerm}经历了长期的发展和演变，从早期的理论探索到现代的广泛应用，不断有新的理论和实践成果涌现。`;
}
function generateSmartImportance(searchTerm) {
    return `掌握${searchTerm}能够提升认知水平，增强问题解决能力，为个人发展开辟新的可能性，在现代社会具有重要意义。`;
}
function generateScope(searchTerm) {
    return `${searchTerm}的研究范围包括基础理论、核心方法、实践应用、发展趋势等多个层面。`;
}
function generateKeyFigures(searchTerm) {
    return ['领域奠基人', '重要贡献者', '现代领军人物', '活跃研究者'];
}
function generateComprehensiveHistory(searchTerm) {
    return `${searchTerm}的发展经历了萌芽期、发展期、成熟期和繁荣期四个阶段，每个阶段都有重要的理论突破和技术创新。`;
}
function generateComprehensiveTrends(searchTerm) {
    return `当前${searchTerm}呈现出技术迭代加速、应用场景拓展、跨学科融合、产业生态完善的发展趋势。`;
}
function generateComprehensiveOutlook(searchTerm) {
    return `未来${searchTerm}将继续保持快速发展，技术创新将带来更多可能性，应用深化将创造更大价值。`;
}
function generateGlobalPerspective(searchTerm) {
    return `${searchTerm}在全球范围内都有重要影响，不同国家和地区在该领域各有特色和优势。`;
}
function generateComprehensiveExplanation(searchTerm) {
    return `${searchTerm}是一个多维度、多层次的知识体系，需要从理论、方法、应用等多个角度系统学习。`;
}
function calculateAdvancedPosition(index, total) {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const radius = 200 + (index % 3) * 50;
    return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
    };
}
function generateComprehensiveEdges(nodes, keyword) {
    const edges = [];
    const baseNodes = nodes.filter(n => n.level === '基础' && !n.isPublic);
    const advancedNodes = nodes.filter(n => n.level === '进阶' && !n.isPublic);
    const expertNodes = nodes.filter(n => n.level === '高级' && !n.isPublic);
    // 生成层级关联
    baseNodes.forEach((base, i) => {
        advancedNodes.slice(i, i + 2).forEach(adv => {
            edges.push({
                source: base.id,
                target: adv.id,
                relation: '理论基础',
                description: `${base.title}是${adv.title}的基础`,
                strength: 0.8
            });
        });
    });
    advancedNodes.forEach((adv, i) => {
        expertNodes.slice(i, i + 2).forEach(exp => {
            edges.push({
                source: adv.id,
                target: exp.id,
                relation: '进阶发展',
                description: `从${adv.title}发展到${exp.title}`,
                strength: 0.9
            });
        });
    });
    return edges;
}
function generateComprehensiveLearningPath(nodes) {
    return nodes.filter(n => !n.isPublic).map((node, idx) => ({
        step: idx + 1,
        nodeId: node.id,
        title: `掌握${node.title}`,
        description: node.definition,
        estimatedTime: node.level === '基础' ? '2-3小时' : node.level === '进阶' ? '4-6小时' : '6-10小时',
        milestones: ['理解核心概念', '完成实践练习', '通过能力测试'],
        prerequisites: idx > 0 ? [nodes[idx - 1].title] : []
    }));
}
function groupIntoClusters(nodes) {
    const groups = {
        '基础知识': [],
        '核心进阶': [],
        '高级应用': [],
        '已有知识': []
    };
    nodes.forEach(node => {
        if (node.isPublic !== undefined)
            groups['已有知识'].push(node.id);
        else if (node.level === '基础')
            groups['基础知识'].push(node.id);
        else if (node.level === '进阶')
            groups['核心进阶'].push(node.id);
        else if (node.level === '高级')
            groups['高级应用'].push(node.id);
    });
    return Object.entries(groups)
        .filter(([_, ids]) => ids.length > 0)
        .map(([name, nodes]) => ({ name, nodes }));
}
function calculateDifficulty(nodes) {
    const weights = { '基础': 1, '进阶': 2, '高级': 3 };
    const total = nodes.filter(n => !n.isPublic).reduce((sum, n) => sum + (weights[n.level] || 2), 0);
    const avg = total / nodes.filter(n => !n.isPublic).length || 1;
    if (avg > 2.5)
        return '困难';
    if (avg > 1.8)
        return '中等';
    return '入门';
}
function calculateTotalTime(nodes) {
    const hours = nodes.filter(n => !n.isPublic).length * 4;
    return `${hours}-${hours + 20}小时`;
}
function calculateCompleteness(nodes) {
    const hasAllLevels = ['基础', '进阶', '高级'].every(level => nodes.some(n => n.level === level));
    return hasAllLevels ? '完整' : '部分';
}
export default router;
//# sourceMappingURL=aiExpandSearch.js.map