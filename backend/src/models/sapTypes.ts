/**
 * Loose input types for SAP JSON payloads.
 * All fields optional to accept partial/malformed data safely.
 */

export interface SapCustomer {
  businessPartner?: unknown;
  businessPartnerFullName?: unknown;
  creationDate?: unknown;
}

export interface SapSalesOrder {
  salesOrder?: unknown;
  soldToParty?: unknown;
  creationDate?: unknown;
  totalNetAmount?: unknown;
  transactionCurrency?: unknown;
}

export interface SapDelivery {
  deliveryDocument?: unknown;
  creationDate?: unknown;
}

export interface SapInvoice {
  billingDocument?: unknown;
  soldToParty?: unknown;
  totalNetAmount?: unknown;
  transactionCurrency?: unknown;
  accountingDocument?: unknown;
  creationDate?: unknown;
}

export interface SapPayment {
  accountingDocument?: unknown;
  customer?: unknown;
  amountInTransactionCurrency?: unknown;
  transactionCurrency?: unknown;
  postingDate?: unknown;
}

export interface SapProduct {
  product?: unknown;
  productType?: unknown;
  creationDate?: unknown;
}
