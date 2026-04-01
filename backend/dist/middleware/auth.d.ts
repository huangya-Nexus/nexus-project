import { Request, Response, NextFunction } from 'express';
import { TokenPayload } from '../lib/jwt.js';
export interface AuthRequest extends Request {
    user?: TokenPayload;
}
export declare function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
