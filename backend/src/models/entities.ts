/**
 * Domain entity interfaces for mapped SAP data.
 */

export interface Customer {
  id: string;
  name: string;
  createdAt: string;
}

export interface SalesOrder {
  id: string;
  customerId: string;
  createdAt: string;
  totalAmount: number;
  currency: string;
}

export interface Delivery {
  id: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  accountingDocument: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  createdAt: string;
}

export interface Product {
  id: string;
  type: string;
  createdAt: string;
}
