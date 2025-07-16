import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../configs/env';
import { createError } from './error.middleware';

// Define the expected JWT payload
interface JwtPayload {
  id: string;
  email: string;
  username: string;
}

export interface AuthedRequest extends Request {
  user?: JwtPayload;
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('Authorization header missing or malformed', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    (req as AuthedRequest).user = decoded;
    next();
  } catch (error) {
    next(createError('Unauthorized: Invalid or expired token', 401));
  }
};
