import { Request, Response, NextFunction } from 'express';

// Error interface
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Define a type for Express request handler functions
type ExpressHandler = (req: Request, res: Response, next: NextFunction) => Promise<any> | any;

// Error handler middleware
export const errorHandler = (error: AppError, req: Request, res: Response) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });
};

// Async handler wrapper with proper typing
export const asyncHandler = (fn: ExpressHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Helper to create custom errors
export const createError = (message: string, statusCode: number = 400): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
