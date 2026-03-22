import type {
  Customer,
  Delivery,
  Invoice,
  Payment,
  Product,
  SalesOrder,
} from '../../models';

export const store = {
  customers: new Map<string, Customer>(),
  orders: new Map<string, SalesOrder>(),
  deliveries: new Map<string, Delivery>(),
  invoices: new Map<string, Invoice>(),
  payments: new Map<string, Payment>(),
  products: new Map<string, Product>(),
};

function safeInsert<V>(
  map: Map<string, V>,
  key: string,
  value: V,
  upsert: boolean
): boolean {
  if (!key) return false;
  if (!upsert && map.has(key)) return false;
  map.set(key, value);
  return true;
}

export function insertCustomer(
  customer: Customer,
  upsert = true
): boolean {
  return safeInsert(store.customers, customer.id, customer, upsert);
}

export function insertSalesOrder(
  order: SalesOrder,
  upsert = true
): boolean {
  return safeInsert(store.orders, order.id, order, upsert);
}

export function insertDelivery(
  delivery: Delivery,
  upsert = true
): boolean {
  return safeInsert(store.deliveries, delivery.id, delivery, upsert);
}

export function insertInvoice(
  invoice: Invoice,
  upsert = true
): boolean {
  return safeInsert(store.invoices, invoice.id, invoice, upsert);
}

export function insertPayment(
  payment: Payment,
  upsert = true
): boolean {
  return safeInsert(store.payments, payment.id, payment, upsert);
}

export function insertProduct(
  product: Product,
  upsert = true
): boolean {
  return safeInsert(store.products, product.id, product, upsert);
}

export function getCustomer(id: string): Customer | undefined {
  return store.customers.get(id);
}

export function getSalesOrder(id: string): SalesOrder | undefined {
  return store.orders.get(id);
}

export function getDelivery(id: string): Delivery | undefined {
  return store.deliveries.get(id);
}

export function getInvoice(id: string): Invoice | undefined {
  return store.invoices.get(id);
}

export function getPayment(id: string): Payment | undefined {
  return store.payments.get(id);
}

export function getProduct(id: string): Product | undefined {
  return store.products.get(id);
}
