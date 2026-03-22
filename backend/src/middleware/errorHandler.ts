import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(err.message, err.stack);
  const statusCode = (err as Error & { statusCode?: number }).statusCode ?? 500;
  res.status(statusCode).json({ error: err.message });
};
