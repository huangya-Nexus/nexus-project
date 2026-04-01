import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/db.js';
import { generateToken } from '../lib/jwt.js';
import { authMiddleware } from '../middleware/auth.js';
const router = Router();
// 注册
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        // 验证输入
        if (!email || !password) {
            return res.status(400).json({ error: '邮箱和密码不能为空' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: '密码至少需要6位' });
        }
        // 检查邮箱是否已存在
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(409).json({ error: '该邮箱已被注册' });
        }
        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);
        // 创建用户
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || email.split('@')[0]
            }
        });
        // 生成令牌
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role
        });
        res.status(201).json({
            message: '注册成功',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({ error: '注册失败，请稍后重试' });
    }
});
// 登录
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: '邮箱和密码不能为空' });
        }
        // 查找用户
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(401).json({ error: '邮箱或密码错误' });
        }
        // 验证密码
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: '邮箱或密码错误' });
        }
        // 更新最后登录时间
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });
        // 生成令牌
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role
        });
        res.json({
            message: '登录成功',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                aiQuotaMonthly: user.aiQuotaMonthly,
                aiQuotaUsed: user.aiQuotaUsed,
                graphQuota: user.graphQuota
            }
        });
    }
    catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ error: '登录失败，请稍后重试' });
    }
});
// 获取当前用户信息
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
                aiQuotaMonthly: true,
                aiQuotaUsed: true,
                graphQuota: true,
                createdAt: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }
        res.json({ user });
    }
    catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({ error: '获取用户信息失败' });
    }
});
// 更新用户信息
router.put('/me', authMiddleware, async (req, res) => {
    try {
        const { name, avatar } = req.body;
        const user = await prisma.user.update({
            where: { id: req.user.userId },
            data: { name, avatar },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true
            }
        });
        res.json({ message: '更新成功', user });
    }
    catch (error) {
        console.error('更新用户信息错误:', error);
        res.status(500).json({ error: '更新失败' });
    }
});
// 获取用户统计数据
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { range = '30d' } = req.query;
        // 计算时间范围
        const now = new Date();
        let startDate = new Date();
        if (range === '7d')
            startDate.setDate(now.getDate() - 7);
        else if (range === '30d')
            startDate.setDate(now.getDate() - 30);
        else if (range === '90d')
            startDate.setDate(now.getDate() - 90);
        else
            startDate = new Date(0); // all time
        // 获取用户所有图谱
        const graphs = await prisma.knowledgeGraph.findMany({
            where: { userId },
            include: {
                nodes: true,
                edges: true
            }
        });
        // 统计总数
        const totalGraphs = graphs.length;
        const totalNodes = graphs.reduce((sum, g) => sum + g.nodes.length, 0);
        const totalEdges = graphs.reduce((sum, g) => sum + g.edges.length, 0);
        // 统计最近活动（按天分组）
        const activityMap = new Map();
        graphs.forEach(graph => {
            graph.nodes.forEach(node => {
                if (node.createdAt >= startDate) {
                    const date = node.createdAt.toISOString().split('T')[0];
                    const current = activityMap.get(date) || { nodesCreated: 0, edgesCreated: 0 };
                    current.nodesCreated++;
                    activityMap.set(date, current);
                }
            });
        });
        const recentActivity = Array.from(activityMap.entries())
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-30); // 最多显示30天
        // 统计热门关键词
        const keywordCount = new Map();
        graphs.forEach(graph => {
            graph.nodes.forEach(node => {
                if (node.keywords) {
                    try {
                        const keywords = JSON.parse(node.keywords);
                        keywords.forEach((keyword) => {
                            keywordCount.set(keyword, (keywordCount.get(keyword) || 0) + 1);
                        });
                    }
                    catch (e) {
                        // 忽略解析错误
                    }
                }
            });
        });
        const topKeywords = Array.from(keywordCount.entries())
            .map(([keyword, count]) => ({ keyword, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        // 计算连续学习天数
        let learningStreak = 0;
        let lastStudyDate = null;
        const sortedDates = Array.from(activityMap.keys()).sort().reverse();
        if (sortedDates.length > 0) {
            lastStudyDate = sortedDates[0];
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            // 检查今天或昨天是否有活动
            if (sortedDates[0] === today || sortedDates[0] === yesterday) {
                learningStreak = 1;
                // 计算连续天数
                for (let i = 1; i < sortedDates.length; i++) {
                    const currentDate = new Date(sortedDates[i - 1]);
                    const prevDate = new Date(sortedDates[i]);
                    const diffDays = Math.floor((currentDate.getTime() - prevDate.getTime()) / 86400000);
                    if (diffDays === 1) {
                        learningStreak++;
                    }
                    else {
                        break;
                    }
                }
            }
        }
        res.json({
            totalGraphs,
            totalNodes,
            totalEdges,
            recentActivity,
            topKeywords,
            learningStreak,
            lastStudyDate
        });
    }
    catch (error) {
        console.error('获取统计数据错误:', error);
        res.status(500).json({ error: '获取统计数据失败' });
    }
});
export default router;
//# sourceMappingURL=users.js.map