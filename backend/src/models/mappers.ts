import { safeDate, safeNumber, safeString } from '../utils/sapMappers';
import type {
  Customer,
  Delivery,
  Invoice,
  Payment,
  Product,
  SalesOrder,
} from './entities';

type SapRecord = Record<string, unknown>;

function toRecord(input: unknown): SapRecord {
  return input != null && typeof input === 'object' && !Array.isArray(input)
    ? (input as SapRecord)
    : {};
}

export function mapCustomer(input: unknown): Customer {
  const obj = toRecord(input);
  return {
    id: safeString(obj.businessPartner),
    name: safeString(obj.businessPartnerFullName),
    createdAt: safeDate(obj.creationDate),
  };
}

export function mapSalesOrder(input: unknown): SalesOrder {
  const obj = toRecord(input);
  return {
    id: safeString(obj.salesOrder),
    customerId: safeString(obj.soldToParty),
    createdAt: safeDate(obj.creationDate),
    totalAmount: safeNumber(obj.totalNetAmount),
    currency: safeString(obj.transactionCurrency),
  };
}

export function mapDelivery(input: unknown): Delivery {
  const obj = toRecord(input);
  return {
    id: safeString(obj.deliveryDocument),
    createdAt: safeDate(obj.creationDate),
  };
}

export function mapInvoice(input: unknown): Invoice {
  const obj = toRecord(input);
  return {
    id: safeString(obj.billingDocument),
    customerId: safeString(obj.soldToParty),
    amount: safeNumber(obj.totalNetAmount),
    currency: safeString(obj.transactionCurrency),
    accountingDocument: safeString(obj.accountingDocument),
    createdAt: safeDate(obj.creationDate),
  };
}

export function mapPayment(input: unknown): Payment {
  const obj = toRecord(input);
  return {
    id: safeString(obj.accountingDocument),
    customerId: safeString(obj.customer),
    amount: safeNumber(obj.amountInTransactionCurrency),
    currency: safeString(obj.transactionCurrency),
    createdAt: safeDate(obj.postingDate),
  };
}

export function mapProduct(input: unknown): Product {
  const obj = toRecord(input);
  return {
    id: safeString(obj.product),
    type: safeString(obj.productType),
    createdAt: safeDate(obj.creationDate),
  };
}
