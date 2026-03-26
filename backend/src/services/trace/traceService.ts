import type { TraceFlowResult } from '../flow';
import { traceFlow } from '../flow';

/**
 * Trace flow from an entity id (upstream and downstream paths).
 */
export function trace(id: string): TraceFlowResult {
  return traceFlow(id);
}
