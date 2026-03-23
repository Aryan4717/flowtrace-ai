import OpenAI from 'openai';
import { config } from '../../config';
import {
  ANSWER_PROMPT,
  GRAPH_PROMPT,
  GUARDRAIL_PROMPT,
  INTENT_PROMPT,
  SQL_PROMPT,
  SYSTEM_PROMPT,
} from './prompts';
import { buildPrompt, getSchemaString } from './promptBuilder';

const DEFAULT_MODEL = 'gpt-4o-mini';
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

function getOpenAIClient(): OpenAI | null {
  const apiKey = config.openai.apiKey;
  if (!apiKey?.trim()) return null;
  return new OpenAI({ apiKey });
}

function isRetryableError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status?: number }).status;
    return status === 429 || status === 500 || status === 502 || status === 503;
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call the LLM with a prompt. Uses OpenAI SDK with retry logic.
 * Supports JSON responses - returns raw string; caller may parse.
 * When OPENAI_API_KEY is not set, returns a stub response for development.
 */
export async function callLLM(prompt: string): Promise<string> {
  const client = getOpenAIClient();
  if (!client) {
    return getStubResponse(prompt);
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
      });

      const content = completion.choices[0]?.message?.content;
      if (content !== undefined && content !== null) {
        return typeof content === 'string' ? content : JSON.stringify(content);
      }
      return '';
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES && isRetryableError(err)) {
        const delay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }

  throw lastError;
}

function getStubResponse(prompt: string): string {
  if (prompt.includes('Classify whether') || (prompt.includes('classify') && prompt.toLowerCase().includes('query'))) {
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
  if (prompt.includes('natural language explanation') || prompt.includes('Explain concisely') || prompt.includes('User question:')) {
    return 'Here is the requested data, summarized for you.';
  }
  return '{"classification": "relevant", "confidence": 0.8}';
}

export function getSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

export function getSqlPrompt(userQuery: string): string {
  return buildPrompt(SQL_PROMPT, {
    schema: getSchemaString(),
    query: userQuery,
  });
}

export function getGraphPrompt(userQuery: string): string {
  return buildPrompt(GRAPH_PROMPT, {
    query: userQuery,
  });
}

export function getGuardrailPrompt(userQuery: string): string {
  return buildPrompt(GUARDRAIL_PROMPT, {
    query: userQuery,
  });
}

export function getIntentPrompt(userQuery: string): string {
  return buildPrompt(INTENT_PROMPT, {
    query: userQuery,
  });
}

export function getAnswerPrompt(data: string, userQuery: string): string {
  return buildPrompt(ANSWER_PROMPT, {
    data,
    query: userQuery,
  });
}
