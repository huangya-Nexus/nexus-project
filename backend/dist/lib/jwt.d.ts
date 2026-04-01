export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}
export declare function generateToken(payload: TokenPayload): string;
export declare function verifyToken(token: string): TokenPayload;
