import { Request, Response } from 'express';
import { trace } from '../services/trace';
import { ValidationError, NotFoundError } from '../utils/errors';

function validateId(id: string | undefined): string {
  if (id === undefined || id === null) {
    throw new ValidationError('Id is required');
  }
  const trimmed = String(id).trim();
  if (!trimmed) {
    throw new ValidationError('Id cannot be empty');
  }
  return trimmed;
}

export async function getTrace(req: Request, res: Response): Promise<void> {
  const id = validateId(req.params.id);

  const result = trace(id);

  if (!result.found) {
    throw new NotFoundError(result.error ?? `Entity not found: ${id}`);
  }

  res.json(result);
}
