export interface PromptBuilderConfig {
  schema?: string;
  jsonFormat?: string;
  query?: string;
  data?: string;
  additionalContext?: string;
}

function replacePlaceholders(template: string, config: PromptBuilderConfig): string {
  let result = template;

  if (config.schema !== undefined) {
    result = result.replace(/\{\{schema\}\}/g, config.schema);
  }
  if (config.query !== undefined) {
    result = result.replace(/\{\{query\}\}/g, config.query);
  }
  if (config.jsonFormat !== undefined) {
    result = result.replace(/\{\{jsonExample\}\}/g, config.jsonFormat);
  }
  if (config.data !== undefined) {
    result = result.replace(/\{\{data\}\}/g, config.data);
  }
  if (config.additionalContext !== undefined) {
    result = result.replace(/\{\{context\}\}/g, config.additionalContext);
  }

  return result;
}

export function buildPrompt(
  basePrompt: string,
  config: PromptBuilderConfig = {}
): string {
  return replacePlaceholders(basePrompt, config);
}

/** SQL-style schema (legacy/fallback). */
export function getSchemaString(): string {
  return `customers: id, name, created_at
sales_orders: id, customer_id, created_at, total_amount, currency
deliveries: id, sales_order_id, created_at
invoices: id, customer_id, delivery_id, amount, currency, accounting_document, created_at
payments: id, customer_id, amount, currency, created_at
products: id, type, created_at

Joins:
  sales_orders.customer_id = customers.id
  deliveries.sales_order_id = sales_orders.id
  invoices.delivery_id = deliveries.id
  invoices.accounting_document = payments.id`;
}

/**
 * In-memory store schema for FILTER_PROMPT. Uses camelCase field names as in entity interfaces.
 */
export function getInMemoryStoreSchemaString(): string {
  return `- customers: Map<string, Customer> — id, name, createdAt
- orders: Map<string, SalesOrder> (table name: sales_orders) — id, customerId, createdAt, totalAmount, currency
- deliveries: Map<string, Delivery> — id, salesOrderId, createdAt
- invoices: Map<string, Invoice> — id, customerId, deliveryId, amount, currency, accountingDocument, createdAt
- payments: Map<string, Payment> — id, customerId, amount, currency, createdAt
- products: Map<string, Product> — id, type, createdAt`;
}
