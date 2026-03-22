import { Request, Response } from 'express';
import { traceFlow, detectBrokenFlows } from '../services/flow';

export async function getTraceFlow(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    if (!id?.trim()) {
      res.status(400).json({ error: 'Entity id is required' });
      return;
    }

    const result = traceFlow(id.trim());
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      error: 'Trace flow failed',
      message: msg,
    });
  }
}

export async function getDetectBrokenFlows(_req: Request, res: Response): Promise<void> {
  try {
    const results = detectBrokenFlows();
    res.json({ brokenFlows: results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      error: 'Detect broken flows failed',
      message: msg,
    });
  }
}
