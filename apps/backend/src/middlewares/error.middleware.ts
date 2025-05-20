import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import {PrismaClientKnownRequestError} from "@prisma/client/runtime/library";

export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export const errorHandler = (
    error: AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal server error';

   /* // Prisma errors
    if (error instanceof PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                statusCode = 409;
                message = 'A record with this information already exists';
                break;
            case 'P2025':
                statusCode = 404;
                message = 'Record not found';
                break;
            default:
                statusCode = 400;
                message = 'Database operation failed';
        }
    }

    // Validation errors
    if (error instanceof PrismaClientValidationError) {
        statusCode = 400;
        message = 'Invalid data provided';
    }*/

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    // Log error in non-production environments
    if (process.env.NODE_ENV !== 'production') {
        console.error('Error:', error);
    }

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Custom error creator
export const createError = (message: string, statusCode: number = 500): AppError => {
    const error: AppError = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};