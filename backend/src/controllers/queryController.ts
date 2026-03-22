import { Request, Response } from 'express';
import { runPipeline } from '../services/langgraph';

export async function postQuery(req: Request, res: Response): Promise<void> {
  try {
    const { query } = req.body;
    if (typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ error: 'Query string is required' });
      return;
    }

    const result = await runPipeline(query.trim());
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      error: 'Pipeline failed',
      message: msg,
    });
  }
}
