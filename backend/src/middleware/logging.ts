import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const loggingMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  logger.info(`${req.method} ${req.url} - ${ip}`);
  next();
};
