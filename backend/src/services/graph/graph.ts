export type NodeType =
  | 'Customer'
  | 'SalesOrder'
  | 'Delivery'
  | 'Invoice'
  | 'Payment'
  | 'Product';

export interface GraphNode {
  id: string;
  type: NodeType;
}

export class Graph {
  private nodes = new Map<string, GraphNode>();
  private adjacencyList = new Map<string, Set<string>>();

  addNode(id: string, type: NodeType): void {
    if (!id) return;
    if (this.nodes.has(id)) return;
    this.nodes.set(id, { id, type });
    if (!this.adjacencyList.has(id)) {
      this.adjacencyList.set(id, new Set());
    }
  }

  addEdge(fromId: string, toId: string): void {
    if (!fromId || !toId) return;
    if (!this.nodes.has(fromId) || !this.nodes.has(toId)) return;
    const neighbors = this.adjacencyList.get(fromId);
    if (neighbors) neighbors.add(toId);
  }

  getNeighbors(nodeId: string): string[] {
    const neighbors = this.adjacencyList.get(nodeId);
    return neighbors ? Array.from(neighbors) : [];
  }

  tracePath(fromId: string, toId: string, method: 'BFS' | 'DFS'): string[] | null {
    if (!this.nodes.has(fromId) || !this.nodes.has(toId)) return null;
    if (fromId === toId) return [fromId];

    const parent = new Map<string, string>();
    const visited = new Set<string>();
    visited.add(fromId);

    if (method === 'BFS') {
      const queue: string[] = [fromId];
      while (queue.length > 0) {
        const current = queue.shift()!;
        const neighbors = this.getNeighbors(current);
        for (const n of neighbors) {
          if (!visited.has(n)) {
            visited.add(n);
            parent.set(n, current);
            if (n === toId) return this.reconstructPath(parent, fromId, toId);
            queue.push(n);
          }
        }
      }
    } else {
      const stack: string[] = [fromId];
      const dfs = (): boolean => {
        const current = stack[stack.length - 1];
        const neighbors = this.getNeighbors(current);
        for (const n of neighbors) {
          if (!visited.has(n)) {
            visited.add(n);
            parent.set(n, current);
            if (n === toId) return true;
            stack.push(n);
            if (dfs()) return true;
            stack.pop();
          }
        }
        return false;
      };
      if (dfs()) return this.reconstructPath(parent, fromId, toId);
    }

    return null;
  }

  private reconstructPath(
    parent: Map<string, string>,
    fromId: string,
    toId: string
  ): string[] {
    const path: string[] = [];
    let current: string | undefined = toId;
    while (current) {
      path.unshift(current);
      current = parent.get(current);
    }
    return path[0] === fromId ? path : [];
  }
}
