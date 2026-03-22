import { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape, { type Core } from 'cytoscape';
import { api } from '../services/api';
import type { CytoscapeElements, EntityWithType } from '../types';
import { MetadataPanel } from './MetadataPanel';

const NODE_COLORS: Record<string, string> = {
  Customer: '#4a90d9',
  SalesOrder: '#7b68ee',
  Delivery: '#50c878',
  Invoice: '#f0ad4e',
  Payment: '#5cb85c',
  Product: '#d9534f',
};

const STYLE = [
  { selector: 'node', style: { label: 'data(id)', 'background-color': '#999', color: '#fff', 'text-valign': 'center' as const, 'text-halign': 'center' as const, 'font-size': 10 } },
  { selector: '[type="Customer"]', style: { 'background-color': NODE_COLORS.Customer } },
  { selector: '[type="SalesOrder"]', style: { 'background-color': NODE_COLORS.SalesOrder } },
  { selector: '[type="Delivery"]', style: { 'background-color': NODE_COLORS.Delivery } },
  { selector: '[type="Invoice"]', style: { 'background-color': NODE_COLORS.Invoice } },
  { selector: '[type="Payment"]', style: { 'background-color': NODE_COLORS.Payment } },
  { selector: '[type="Product"]', style: { 'background-color': NODE_COLORS.Product } },
  { selector: 'edge', style: { 'curve-style': 'haystack', 'haystack-radius': 0, width: 1, 'target-arrow-color': '#999', 'target-arrow-shape': 'triangle', 'arrow-scale': 0.5 } },
];

export function GraphView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [elements, setElements] = useState<CytoscapeElements | null>(null);
  const [loading, setLoading] = useState(true);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [entity, setEntity] = useState<EntityWithType | null>(null);
  const [entityError, setEntityError] = useState<string | null>(null);
  const [entityLoading, setEntityLoading] = useState(false);

  useEffect(() => {
    api
      .get<CytoscapeElements>('/graph')
      .then((res) => {
        setElements(res.data);
        setGraphError(null);
      })
      .catch((err) => {
        setGraphError(err.response?.data?.error ?? err.message);
        setElements({ elements: { nodes: [], edges: [] } });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!containerRef.current || !elements) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements.elements,
      style: STYLE,
      layout: {
        name: elements.elements.nodes.length > 100 ? 'grid' : 'breadthfirst',
        directed: true,
        padding: 20,
      },
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [elements]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const onTap = (ev: cytoscape.EventObject) => {
      const node = ev.target;
      if (node.isNode()) {
        const id = node.data('id');
        setSelectedId(id);
        setEntityLoading(true);
        setEntityError(null);
        api
          .get<EntityWithType>(`/graph/entity/${id}`)
          .then((res) => {
            setEntity(res.data);
            setEntityError(null);
          })
          .catch((err) => {
            setEntityError(err.response?.data?.error ?? err.message);
            setEntity(null);
          })
          .finally(() => setEntityLoading(false));
      }
    };

    cy.on('tap', 'node', onTap);
    return () => {
      cy.off('tap', 'node', onTap);
    };
  }, [elements]);

  const handleExpandNeighbors = useCallback(() => {
    if (!selectedId || !cyRef.current) return;

    const cy = cyRef.current;

    api.get(`/graph/neighbors/${selectedId}`).then((res) => {
      const { node, neighbors } = res.data as {
        node: { id: string; type: string };
        neighbors: { id: string; type: string }[];
      };

      const toAdd: cytoscape.ElementDefinition[] = [];

      for (const n of neighbors) {
        if (!cy.getElementById(n.id).length) {
          toAdd.push({
            group: 'nodes',
            data: { id: n.id, type: n.type },
          });
        }
      }

      const existingEdges = new Set(
        cy.edges().map((e) => `${e.data('source')}->${e.data('target')}`)
      );

      for (const n of neighbors) {
        const edgeId = `${node.id}->${n.id}`;
        if (!existingEdges.has(edgeId)) {
          toAdd.push({
            group: 'edges',
            data: {
              id: `e-${node.id}-${n.id}`,
              source: node.id,
              target: n.id,
            },
          });
        }
      }

      if (toAdd.length > 0) {
        cy.batch(() => {
          cy.add(toAdd);
          cy.layout({
            name: 'breadthfirst',
            directed: true,
            roots: [`#${selectedId}`],
            animate: false,
          }).run();
        });
      }
    });
  }, [selectedId]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Loading graph...
      </div>
    );
  }

  if (graphError) {
    return (
      <div style={{ padding: '2rem', color: '#c00' }}>
        Failed to load graph: {graphError}
      </div>
    );
  }

  const isEmpty =
    elements?.elements.nodes.length === 0 && elements?.elements.edges.length === 0;

  if (isEmpty) {
    return (
      <div style={{ padding: '2rem', color: '#666' }}>
        No data. Ensure the backend has ingested data.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <div
        ref={containerRef}
        style={{ height: 400, minHeight: 400, background: '#fafafa', borderRadius: 8 }}
      />
      <MetadataPanel
        entity={entity}
        error={entityError}
        loading={entityLoading}
        onExpandNeighbors={handleExpandNeighbors}
        expandDisabled={!selectedId}
      />
    </div>
  );
}
