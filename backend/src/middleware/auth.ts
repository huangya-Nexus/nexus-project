import { Request, Response, NextFunction } from 'express'
import { verifyToken, TokenPayload } from '../lib/jwt.js'

export interface AuthRequest extends Request {
  user?: TokenPayload
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供认证令牌' })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    
    req.user = payload
    next()
  } catch (error) {
    return res.status(401).json({ error: '无效的认证令牌' })
  }
}
