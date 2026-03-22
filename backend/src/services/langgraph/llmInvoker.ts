/**
 * LLM invoker - stubs when OPENAI_API_KEY is not set.
 * Used by pipeline nodes; integrate with traceLlmCall for observability.
 */

export async function invokeLlm(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return stubLlmResponse(prompt);
  }
  try {
    const { ChatOpenAI } = await import('@langchain/openai');
    const model = new ChatOpenAI({ modelName: 'gpt-4o-mini', temperature: 0 });
    const response = await model.invoke([{ role: 'user', content: prompt }]);
    return typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);
  } catch (err) {
    throw err;
  }
}

function stubLlmResponse(prompt: string): string {
  if (prompt.includes('Classify whether')) {
    return '{"classification": "relevant", "confidence": 0.9}';
  }
  if (prompt.includes('classify') && prompt.toLowerCase().includes('query')) {
    return '{"classification": "relevant", "confidence": 0.9}';
  }
  if (prompt.includes('traversal plan') || prompt.includes('pathTypes')) {
    return '{"startType": "Customer", "endType": "Payment", "pathTypes": ["Customer","SalesOrder","Delivery","Invoice","Payment"], "filters": {}}';
  }
  if (prompt.includes('"sql"')) {
    return '{"sql": "SELECT * FROM customers LIMIT 5"}';
  }
  if (prompt.includes('"queryType"')) {
    return '{"queryType": "graph"}';
  }
  if (prompt.includes('natural language explanation') || prompt.includes('Explain concisely')) {
    return 'Here is the requested data, summarized for you.';
  }
  return '{"classification": "relevant", "confidence": 0.8}';
}
