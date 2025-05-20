import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface JwtPayload {
    userId: string;
    email: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                username: string;
            };
        }
    }
}

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token required'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, username: true }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
};

// Optional auth - doesn't fail if no token provided
export const optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, email: true, username: true }
            });

            if (user) {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        next();
    }
};