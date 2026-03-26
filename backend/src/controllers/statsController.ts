import { Request, Response } from 'express';
import { store } from '../services/data/store';

/**
 * Lightweight counts for dashboard KPIs (in-memory store).
 */
export function getStats(_req: Request, res: Response): void {
  res.json({
    customers: store.customers.size,
    orders: store.orders.size,
    deliveries: store.deliveries.size,
    invoices: store.invoices.size,
    payments: store.payments.size,
    products: store.products.size,
  });
}
