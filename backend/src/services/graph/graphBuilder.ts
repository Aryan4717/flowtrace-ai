import { store } from '../data/store';
import { Graph } from './graph';

/**
 * Builds a directed graph from the in-memory store using entity relationships.
 * Edges: Customer→SalesOrder, SalesOrder→Delivery, Delivery→Invoice, Invoice→Payment, SalesOrder→Product
 */
export function buildGraphFromStore(dataStore: typeof store = store): Graph {
  const graph = new Graph();

  // Add nodes
  for (const [, customer] of dataStore.customers) {
    graph.addNode(customer.id, 'Customer');
  }
  for (const [, order] of dataStore.orders) {
    graph.addNode(order.id, 'SalesOrder');
  }
  for (const [, delivery] of dataStore.deliveries) {
    graph.addNode(delivery.id, 'Delivery');
  }
  for (const [, invoice] of dataStore.invoices) {
    graph.addNode(invoice.id, 'Invoice');
  }
  for (const [, payment] of dataStore.payments) {
    graph.addNode(payment.id, 'Payment');
  }
  for (const [, product] of dataStore.products) {
    graph.addNode(product.id, 'Product');
  }

  // Customer → SalesOrder
  for (const [, order] of dataStore.orders) {
    if (order.customerId) {
      graph.addEdge(order.customerId, order.id);
    }
  }

  // SalesOrder → Delivery
  for (const [, delivery] of dataStore.deliveries) {
    if (delivery.salesOrderId) {
      graph.addEdge(delivery.salesOrderId, delivery.id);
    }
  }

  // Delivery → Invoice
  for (const [, invoice] of dataStore.invoices) {
    if (invoice.deliveryId) {
      graph.addEdge(invoice.deliveryId, invoice.id);
    }
  }

  // Invoice → Payment (invoice.accountingDocument matches payment.id)
  for (const [, invoice] of dataStore.invoices) {
    if (invoice.accountingDocument && dataStore.payments.has(invoice.accountingDocument)) {
      graph.addEdge(invoice.id, invoice.accountingDocument);
    }
  }

  // SalesOrder → Product (no order line items in current schema; skip or add when data available)
  // Skipped - would require sales order items

  return graph;
}
