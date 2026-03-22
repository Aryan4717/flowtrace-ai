export const PROMPT_KEYS = {
  SYSTEM: 'system',
  SQL: 'sql',
  GRAPH: 'graph',
  GUARDRAIL: 'guardrail',
  INTENT: 'intent',
  ANSWER: 'answer',
} as const;

export const INTENT_PROMPT = `Given the user query, determine whether it is better answered with SQL (aggregations, counts, filtering) or graph traversal (path between entities, relationships).

Query: {{query}}

Output strictly as JSON only: {"queryType": "sql"|"graph"}
No other text.`;

export const SYSTEM_PROMPT = `You are a dataset-bound assistant. Only answer using the provided schema and data. Do not hallucinate or invent information. If the answer is not in the data, say so.`;

export const SQL_PROMPT = `Convert the following natural language question to SQL.

Schema:
{{schema}}

Join chain (use when needed): sales_orders -> deliveries -> invoices -> payments
- sales_orders JOIN deliveries ON deliveries.sales_order_id = sales_orders.id
- deliveries JOIN invoices ON invoices.delivery_id = deliveries.id
- invoices JOIN payments ON invoices.accounting_document = payments.id

Question: {{query}}

Output strictly as JSON only: {"sql": "SELECT ..."}
No other text.`;

export const GRAPH_PROMPT = `Convert the following natural language question to a graph traversal plan.

Node types: Customer, SalesOrder, Delivery, Invoice, Payment, Product
Edges: Customer→SalesOrder, SalesOrder→Delivery, Delivery→Invoice, Invoice→Payment, SalesOrder→Product

Question: {{query}}

Output strictly as JSON only: {"startType": "Customer"|"SalesOrder"|"Delivery"|"Invoice"|"Payment"|"Product", "endType": "...", "pathTypes": ["Customer","SalesOrder",...], "filters": {}}
Include startType, endType, pathTypes (ordered node types to traverse), and optional filters.
No other text.`;

export const GUARDRAIL_PROMPT = `Classify whether the following user query is relevant to the sales/delivery/billing dataset.

Query: {{query}}

Output strictly as JSON only: {"classification": "relevant"|"off_topic"|"general_knowledge"|"creative"|"ambiguous", "confidence": 0.0-1.0}
- relevant: query can be answered with the schema (customers, orders, deliveries, invoices, payments, products)
- off_topic: unrelated to the dataset (recipes, weather, sports, etc.)
- general_knowledge: factual questions outside the dataset (capital of, who is, history, etc.)
- creative: requests for creative writing (poem, story, joke, etc.)
- ambiguous: unclear, mixed intent, or needs clarification
No other text.`;

export const ANSWER_PROMPT = `Given the following data, produce a clear, natural language explanation for the user.

Data:
{{data}}

Explain concisely. Use plain text.`;
