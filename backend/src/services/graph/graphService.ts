import type { GraphNode } from './graph';
import { buildGraphFromStore } from './graphBuilder';
import { store } from '../data/store';
import {
  getCustomer,
  getDelivery,
  getInvoice,
  getPayment,
  getProduct,
  getSalesOrder,
} from '../data/store';
import type { NodeType } from './graph';

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

/**
 * Get the full graph in Cytoscape elements format.
 */
export function getFullGraph(): CytoscapeElements {
  const graph = buildGraphFromStore(store);
  const nodes = graph.getAllNodes();
  const edges = graph.getAllEdges();

  return {
    elements: {
      nodes: nodes.map((n) => ({ data: { id: n.id, type: n.type } })),
      edges: edges.map((e, i) => ({
        data: { id: `e${i}-${e.source}-${e.target}`, source: e.source, target: e.target },
      })),
    },
  };
}

/**
 * Get full entity metadata by id. Returns null if not found.
 */
export function getEntityById(id: string): EntityWithType | null {
  const customer = getCustomer(id);
  if (customer) return { type: 'Customer', entity: customer as unknown as Record<string, unknown> };

  const order = getSalesOrder(id);
  if (order) return { type: 'SalesOrder', entity: order as unknown as Record<string, unknown> };

  const delivery = getDelivery(id);
  if (delivery) return { type: 'Delivery', entity: delivery as unknown as Record<string, unknown> };

  const invoice = getInvoice(id);
  if (invoice) return { type: 'Invoice', entity: invoice as unknown as Record<string, unknown> };

  const payment = getPayment(id);
  if (payment) return { type: 'Payment', entity: payment as unknown as Record<string, unknown> };

  const product = getProduct(id);
  if (product) return { type: 'Product', entity: product as unknown as Record<string, unknown> };

  return null;
}

/**
 * Get a graph node by id. Returns null if not found.
 */
export function getNodeById(id: string): GraphNode | null {
  const graph = buildGraphFromStore(store);
  const node = graph.getNode(id);
  return node ?? null;
}

/**
 * Get neighbor ids and their node metadata for a given node id.
 */
export function getNeighborsById(id: string): {
  node: GraphNode | null;
  neighborIds: string[];
  neighbors: GraphNode[];
} {
  const graph = buildGraphFromStore(store);
  const node = graph.getNode(id) ?? null;
  const neighborIds = graph.getNeighbors(id);
  const neighbors = neighborIds
    .map((nid) => graph.getNode(nid))
    .filter((n): n is GraphNode => n !== undefined);

  return { node, neighborIds, neighbors };
}
