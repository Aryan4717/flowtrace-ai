export const PROMPT_KEYS = {
  SYSTEM: 'system',
  FILTER: 'filter',
  GRAPH: 'graph',
  GUARDRAIL: 'guardrail',
  INTENT: 'intent',
  ANSWER: 'answer',
} as const;

export const INTENT_PROMPT = `Given the user query, determine whether it is better answered with filtering/aggregation (counts, lists, filtering by criteria) or graph traversal (path between entities, relationships).

Query: {{query}}

Output strictly as JSON only: {"queryType": "filter"|"graph"}
No other text.`;

export const SYSTEM_PROMPT = `You are a dataset-bound assistant. Only answer using the provided schema and data. Do not hallucinate or invent information. If the answer is not in the data, say so.`;

export const FILTER_PROMPT = `You are a query planner for an in-memory data system.

Your job:
Convert the user query into a STRICT JSON execution plan.

Available entities:
- customers
- orders
- deliveries
- invoices
- payments
- products

Rules:
- DO NOT generate SQL
- DO NOT explain anything
- DO NOT return text outside JSON
- ONLY return valid JSON
- response must be parseable with JSON.parse()

JSON format:

{
  "action": "GET_ALL" | "FILTER",
  "entity": "customers" | "orders" | "invoices" | "payments" | "deliveries" | "products",
  "filters": [
    {
      "field": "string",
      "operator": "equals" | "not_exists",
      "value": "string"
    }
  ]
}

Examples:

User: show all customers
Output:
{
  "action": "GET_ALL",
  "entity": "customers",
  "filters": []
}

User: unpaid invoices
Output:
{
  "action": "FILTER",
  "entity": "invoices",
  "filters": [
    {
      "field": "payment",
      "operator": "not_exists"
    }
  ]
}

User: orders for customer 320000083
Output:
{
  "action": "FILTER",
  "entity": "orders",
  "filters": [
    {
      "field": "customerId",
      "operator": "equals",
      "value": "320000083"
    }
  ]
}

User Query:
{{query}}`;

export const SQL_CORRECTION_PROMPT = `You must NOT output SQL. Return ONLY the same JSON execution plan format as specified (action, entity, filters). No markdown, no explanation.

User query: {{query}}`;

export const JSON_RETRY_PROMPT = `Return ONLY valid JSON. No markdown code fences, no explanation, no text before or after the JSON object.

Use this exact shape:
{"action":"GET_ALL"|"FILTER","entity":"customers"|"orders"|"deliveries"|"invoices"|"payments"|"products","filters":[{"field":"string","operator":"equals"|"not_exists","value":"optional"}]}

User query: {{query}}`;

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

export const ANSWER_PROMPT = `You are answering a user question about dataset results. Be accurate and grounded.

User question: {{query}}

Data (JSON): {{data}}

Rules:
- Only use information explicitly present in the data. Do not invent or assume.
- If the data is empty or does not answer the question, say so clearly.
- Be concise and natural.

Provide:
1. A clear explanation that directly answers the user's question.
2. Any insights (e.g. counts, totals, notable records) from the data.
Use plain text. No markdown tables. No fabricated data.`;
