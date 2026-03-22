/**
 * Predefined query handlers for common intents.
 */
import type { Customer, Delivery, Invoice, Payment, Product, SalesOrder } from '../../models';
import type { PredefinedQueryKey, QueryResult } from './types';

type StoreType = {
  customers: Map<string, Customer>;
  orders: Map<string, SalesOrder>;
  deliveries: Map<string, Delivery>;
  invoices: Map<string, Invoice>;
  payments: Map<string, Payment>;
  products: Map<string, Product>;
};

/**
 * Highest billing invoices (top by amount).
 * Schema has no product-invoice link; returns top invoices as "highest billing".
 */
export function getHighestBillingInvoices(
  dataStore: StoreType,
  limit = 10
): QueryResult {
  const rows = Array.from(dataStore.invoices.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)
    .map((inv) => ({
      id: inv.id,
      customerId: inv.customerId,
      amount: inv.amount,
      currency: inv.currency,
      accountingDocument: inv.accountingDocument,
      createdAt: inv.createdAt,
    }));
  return { rows, rowCount: rows.length };
}

/**
 * Orders that have no invoice in the chain (no delivery has been invoiced).
 */
export function getOrdersNotBilled(dataStore: StoreType): QueryResult {
  const orderToInvoiced = new Set<string>();
  for (const inv of dataStore.invoices.values()) {
    if (inv.deliveryId) {
      const delivery = dataStore.deliveries.get(inv.deliveryId);
      if (delivery?.salesOrderId) {
        orderToInvoiced.add(delivery.salesOrderId);
      }
    }
  }

  const rows = Array.from(dataStore.orders.values())
    .filter((order) => !orderToInvoiced.has(order.id))
    .map((order) => ({
      id: order.id,
      customerId: order.customerId,
      totalAmount: order.totalAmount,
      currency: order.currency,
      createdAt: order.createdAt,
    }));

  return { rows, rowCount: rows.length };
}

/**
 * Invoices where accountingDocument does not match any payment.id.
 */
export function getUnpaidInvoices(dataStore: StoreType): QueryResult {
  const paymentIds = new Set(dataStore.payments.keys());

  const rows = Array.from(dataStore.invoices.values())
    .filter((inv) => !paymentIds.has(inv.accountingDocument))
    .map((inv) => ({
      id: inv.id,
      customerId: inv.customerId,
      deliveryId: inv.deliveryId,
      amount: inv.amount,
      currency: inv.currency,
      accountingDocument: inv.accountingDocument,
      createdAt: inv.createdAt,
    }));

  return { rows, rowCount: rows.length };
}

/**
 * Match user query string to a predefined key.
 */
export function matchPredefinedQuery(query: string): PredefinedQueryKey | null {
  const lower = query.toLowerCase().trim();

  if (
    lower.includes('highest') ||
    lower.includes('top') ||
    lower.includes('highest billing') ||
    lower.includes('top billing')
  ) {
    return 'highest_billing_invoices';
  }
  if (
    lower.includes('not billed') ||
    lower.includes('unbilled') ||
    lower.includes('orders not billed') ||
    lower.includes('orders without')
  ) {
    return 'orders_not_billed';
  }
  if (
    lower.includes('unpaid') ||
    lower.includes('unpaid invoices') ||
    lower.includes('not paid')
  ) {
    return 'unpaid_invoices';
  }

  return null;
}
