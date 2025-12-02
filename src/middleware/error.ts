import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  error: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(error);

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      res.status(409).json({
        message: 'A record with this value already exists',
        code: 'DUPLICATE_ENTRY',
        field: error.meta?.target,
      });
      return;
    }

    if (error.code === 'P2025') {
      res.status(404).json({
        message: 'Record not found',
        code: 'NOT_FOUND',
      });
      return;
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      message: 'Invalid data provided',
      code: 'VALIDATION_ERROR',
    });
    return;
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      message: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      message: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
    return;
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  const code = error.code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    message,
    code,
  });
}

export function notFound(req: Request, res: Response) {
  res.status(404).json({
    message: 'Route not found',
    code: 'NOT_FOUND',
    path: req.originalUrl,
  });
}
