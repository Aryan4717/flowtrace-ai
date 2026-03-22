import { Request, Response } from 'express';
import { getNodeById, getNeighborsById } from '../services/graph';
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

export async function getNode(req: Request, res: Response): Promise<void> {
  const id = validateId(req.params.id);

  const node = getNodeById(id);
  if (!node) {
    throw new NotFoundError(`Node not found: ${id}`);
  }

  res.json(node);
}

export async function getNeighbors(req: Request, res: Response): Promise<void> {
  const id = validateId(req.params.id);

  const { node, neighborIds, neighbors } = getNeighborsById(id);

  if (!node) {
    throw new NotFoundError(`Node not found: ${id}`);
  }

  res.json({
    node,
    neighborIds,
    neighbors,
  });
}
