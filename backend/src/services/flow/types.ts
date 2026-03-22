import type { NodeType } from '../graph/graph';

export interface FlowNode {
  id: string;
  type: NodeType;
  broken?: boolean;
  missingRef?: string;
}

export interface FlowPath {
  nodes: FlowNode[];
  brokenLinks: BrokenLink[];
}

export interface BrokenLink {
  fromId: string;
  fromType: NodeType;
  refKey: string;
  refId: string;
  reason: 'missing' | 'invalid';
}

export interface TraceFlowResult {
  found: boolean;
  rootId?: string;
  rootType?: NodeType;
  paths: FlowPath[];
  brokenLinks: BrokenLink[];
  error?: string;
}

export type BrokenFlowKind =
  | 'delivered_not_billed'
  | 'billed_without_delivery'
  | 'unpaid_invoice';

export interface BrokenFlow {
  kind: BrokenFlowKind;
  entityId: string;
  entityType: NodeType;
  details: Record<string, unknown>;
}
