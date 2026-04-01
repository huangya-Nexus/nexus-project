// 简单的性能监控中间件
export function performanceMonitor(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const path = req.path;
        const method = req.method;
        const status = res.statusCode;
        // 记录慢请求（超过 500ms）
        if (duration > 500) {
            console.warn(`[SLOW] ${method} ${path} - ${duration}ms`);
        }
        else {
            console.log(`[API] ${method} ${path} - ${duration}ms`);
        }
    });
    next();
}
// 请求限流（简单内存实现）
const requestCounts = new Map();
export function rateLimiter(maxRequests = 100, windowMs = 60000) {
    return (req, res, next) => {
        const key = req.ip || 'unknown';
        const now = Date.now();
        const record = requestCounts.get(key);
        if (!record || now > record.resetTime) {
            requestCounts.set(key, { count: 1, resetTime: now + windowMs });
            next();
            return;
        }
        if (record.count >= maxRequests) {
            res.status(429).json({ error: '请求过于频繁，请稍后再试' });
            return;
        }
        record.count++;
        next();
    };
}
//# sourceMappingURL=performance.js.map