import type { GraphNode } from './graph';
import { buildGraphFromStore } from './graphBuilder';
import { store } from '../data/store';

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
