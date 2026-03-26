import { Request, Response } from 'express';
import { chat } from '../services/chat';
import { ValidationError } from '../utils/errors';

const MAX_MESSAGE_LENGTH = 10_000;

export async function postChat(req: Request, res: Response): Promise<void> {
  const { message } = req.body;

  if (message === undefined || message === null) {
    throw new ValidationError('Message is required');
  }
  if (typeof message !== 'string') {
    throw new ValidationError('Message must be a string');
  }
  const trimmed = message.trim();
  if (!trimmed) {
    throw new ValidationError('Message cannot be empty');
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new ValidationError(`Message exceeds maximum length of ${MAX_MESSAGE_LENGTH}`);
  }

  const result = await chat(trimmed);
  res.json(result);
}
