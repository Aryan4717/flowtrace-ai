import type { Request, Response, NextFunction } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

/**
 * Wraps async route handlers so thrown errors are passed to the error handler.
 */
export function asyncHandler(fn: AsyncRequestHandler): AsyncRequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
