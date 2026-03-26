export type NodeType =
  | 'Customer'
  | 'SalesOrder'
  | 'Delivery'
  | 'Invoice'
  | 'Payment'
  | 'Product';

export interface CytoscapeElements {
  elements: {
    nodes: { data: { id: string; type: NodeType } }[];
    edges: { data: { id: string; source: string; target: string } }[];
  };
}

export interface EntityWithType {
  type: NodeType;
  entity: Record<string, unknown>;
}

export interface NeighborsResponse {
  node: { id: string; type: NodeType };
  neighborIds: string[];
  neighbors: { id: string; type: NodeType }[];
}
