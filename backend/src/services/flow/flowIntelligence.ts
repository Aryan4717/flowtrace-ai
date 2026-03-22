import type { Customer, Delivery, Invoice, Payment, Product, SalesOrder } from '../../models';
import type { NodeType } from '../graph/graph';
import { store } from '../data/store';
import type {
  TraceFlowResult,
  FlowPath,
  FlowNode,
  BrokenLink,
  BrokenFlow,
  BrokenFlowKind,
} from './types';
import { getUnpaidInvoices } from '../query/predefinedQueries';

type StoreType = typeof store;

function resolveEntity(
  id: string,
  dataStore: StoreType
): { type: NodeType; entity: Customer | SalesOrder | Delivery | Invoice | Payment | Product } | null {
  const customer = dataStore.customers.get(id);
  if (customer) return { type: 'Customer', entity: customer };

  const order = dataStore.orders.get(id);
  if (order) return { type: 'SalesOrder', entity: order };

  const delivery = dataStore.deliveries.get(id);
  if (delivery) return { type: 'Delivery', entity: delivery };

  const invoice = dataStore.invoices.get(id);
  if (invoice) return { type: 'Invoice', entity: invoice };

  const payment = dataStore.payments.get(id);
  if (payment) return { type: 'Payment', entity: payment };

  const product = dataStore.products.get(id);
  if (product) return { type: 'Product', entity: product };

  return null;
}

function getUpstreamIds(
  id: string,
  type: NodeType,
  dataStore: StoreType
): { key: string; ids: string[] }[] {
  const result: { key: string; ids: string[] }[] = [];

  if (type === 'SalesOrder') {
    const order = dataStore.orders.get(id) as SalesOrder | undefined;
    if (order?.customerId) result.push({ key: 'customerId', ids: [order.customerId] });
  }
  if (type === 'Delivery') {
    const delivery = dataStore.deliveries.get(id) as Delivery | undefined;
    if (delivery?.salesOrderId) result.push({ key: 'salesOrderId', ids: [delivery.salesOrderId] });
  }
  if (type === 'Invoice') {
    const invoice = dataStore.invoices.get(id) as Invoice | undefined;
    if (invoice?.deliveryId) result.push({ key: 'deliveryId', ids: [invoice.deliveryId] });
  }
  if (type === 'Payment') {
    for (const inv of dataStore.invoices.values()) {
      if (inv.accountingDocument === id) {
        result.push({ key: 'accountingDocument', ids: [inv.id] });
        break;
      }
    }
  }

  return result;
}

function getDownstreamIds(
  id: string,
  type: NodeType,
  dataStore: StoreType
): { key: string; ids: string[] }[] {
  const result: { key: string; ids: string[] }[] = [];

  if (type === 'Customer') {
    const ids = Array.from(dataStore.orders.values())
      .filter((o) => o.customerId === id)
      .map((o) => o.id);
    if (ids.length) result.push({ key: 'orders', ids });
  }
  if (type === 'SalesOrder') {
    const ids = Array.from(dataStore.deliveries.values())
      .filter((d) => d.salesOrderId === id)
      .map((d) => d.id);
    if (ids.length) result.push({ key: 'deliveries', ids });
  }
  if (type === 'Delivery') {
    const ids = Array.from(dataStore.invoices.values())
      .filter((inv) => inv.deliveryId === id)
      .map((inv) => inv.id);
    if (ids.length) result.push({ key: 'invoices', ids });
  }
  if (type === 'Invoice') {
    const inv = dataStore.invoices.get(id) as Invoice | undefined;
    if (inv?.accountingDocument) result.push({ key: 'accountingDocument', ids: [inv.accountingDocument] });
  }

  return result;
}

function toFlowNode(
  id: string,
  type: NodeType,
  dataStore: StoreType,
  broken?: boolean,
  missingRef?: string
): FlowNode {
  const exists = resolveEntity(id, dataStore) !== null;
  return {
    id,
    type,
    broken: broken || !exists,
    missingRef,
  };
}

function collectPaths(
  id: string,
  type: NodeType,
  dataStore: StoreType,
  direction: 'upstream' | 'downstream',
  visited: Set<string>,
  brokenLinks: BrokenLink[]
): FlowPath[] {
  if (visited.has(id)) return [{ nodes: [], brokenLinks }];
  visited.add(id);

  const resolved = resolveEntity(id, dataStore);
  const nodes: FlowNode[] = [
    toFlowNode(id, type, dataStore, !resolved, undefined),
  ];

  const refs =
    direction === 'upstream'
      ? getUpstreamIds(id, type, dataStore)
      : getDownstreamIds(id, type, dataStore);

  if (refs.length === 0) return [{ nodes, brokenLinks }];

  const allPaths: FlowPath[] = [];
  for (const { key, ids } of refs) {
    for (const refId of ids) {
      const refEntity = resolveEntity(refId, dataStore);
      const isMissing = !refEntity;

      if (isMissing) {
        brokenLinks.push({
          fromId: id,
          fromType: type,
          refKey: key,
          refId,
          reason: 'missing',
        });
      }

      const refType = refEntity!.type;
      const subPaths = isMissing
        ? [{ nodes: [], brokenLinks }]
        : collectPaths(refId, refType, dataStore, direction, new Set(visited), [...brokenLinks]);

      for (const sp of subPaths) {
        const pathNodes =
          direction === 'upstream'
            ? [...sp.nodes, ...nodes]
            : [...nodes, ...sp.nodes];
        allPaths.push({
          nodes: pathNodes,
          brokenLinks: sp.brokenLinks,
        });
      }
    }
  }

  return allPaths.length ? allPaths : [{ nodes, brokenLinks }];
}

/**
 * Traces the flow from a given entity id: upstream (sources) and downstream (destinations).
 * Handles missing nodes and multiple paths (e.g. order -> many deliveries -> many invoices).
 */
export function traceFlow(
  id: string,
  dataStore: StoreType = store
): TraceFlowResult {
  const resolved = resolveEntity(id, dataStore);
  if (!resolved) {
    return {
      found: false,
      brokenLinks: [],
      paths: [],
      error: `Node not found: ${id}`,
    };
  }

  const { type } = resolved;
  const brokenLinks: BrokenLink[] = [];

  const upstreamPaths = collectPaths(id, type, dataStore, 'upstream', new Set(), brokenLinks);
  const downstreamPaths = collectPaths(id, type, dataStore, 'downstream', new Set(), brokenLinks);

  const paths: FlowPath[] = [];
  for (const up of upstreamPaths) {
    for (const down of downstreamPaths) {
      const nodes = [...up.nodes, ...down.nodes.filter((n) => n.id !== id)];
      const seen = new Set<string>();
      const deduped = nodes.filter((n) => {
        if (seen.has(n.id)) return false;
        seen.add(n.id);
        return true;
      });
      paths.push({
        nodes: deduped,
        brokenLinks: [...up.brokenLinks, ...down.brokenLinks],
      });
    }
  }

  if (paths.length === 0) {
    paths.push({
      nodes: [toFlowNode(id, type, dataStore)],
      brokenLinks,
    });
  }

  return {
    found: true,
    rootId: id,
    rootType: type,
    paths,
    brokenLinks,
  };
}

/**
 * Detects broken flows: delivered not billed, billed without delivery, unpaid invoices.
 * Uses graph traversal and query engine logic.
 */
export function detectBrokenFlows(
  dataStore: StoreType = store
): BrokenFlow[] {
  const results: BrokenFlow[] = [];

  // 1. Delivered not billed: delivery exists but no invoice references it
  for (const [, delivery] of dataStore.deliveries) {
    const hasInvoice = Array.from(dataStore.invoices.values()).some(
      (inv) => inv.deliveryId === delivery.id
    );
    if (!hasInvoice) {
      results.push({
        kind: 'delivered_not_billed',
        entityId: delivery.id,
        entityType: 'Delivery',
        details: {
          salesOrderId: delivery.salesOrderId,
          createdAt: delivery.createdAt,
        },
      });
    }
  }

  // 2. Billed without delivery: invoice has deliveryId that is missing/invalid, or no deliveryId when expected
  for (const [, invoice] of dataStore.invoices) {
    if (invoice.deliveryId) {
      const delivery = dataStore.deliveries.get(invoice.deliveryId);
      if (!delivery) {
        results.push({
          kind: 'billed_without_delivery',
          entityId: invoice.id,
          entityType: 'Invoice',
          details: {
            deliveryId: invoice.deliveryId,
            reason: 'delivery_not_found',
          },
        });
      }
    }
    // Invoice with no deliveryId could be "billed without delivery" - optional, depends on business rules
  }

  // 3. Unpaid invoices (reuse query engine)
  const unpaid = getUnpaidInvoices(dataStore);
  for (const row of unpaid.rows) {
    const inv = row as { id: string; accountingDocument: string };
    results.push({
      kind: 'unpaid_invoice',
      entityId: inv.id,
      entityType: 'Invoice',
      details: {
        accountingDocument: inv.accountingDocument,
      },
    });
  }

  return results;
}
