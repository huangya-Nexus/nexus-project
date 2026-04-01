import { verifyToken } from '../lib/jwt.js';
export function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: '未提供认证令牌' });
        }
        const token = authHeader.substring(7);
        const payload = verifyToken(token);
        req.user = payload;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: '无效的认证令牌' });
    }
}
//# sourceMappingURL=auth.js.map