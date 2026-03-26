import Langfuse from 'langfuse';
import { config } from '../../config';

type LangfuseClient = InstanceType<typeof Langfuse> | null;

let client: LangfuseClient = null;

function getClient(): LangfuseClient {
  if (client !== null) return client;
  const { publicKey, secretKey, host } = config.langfuse;
  if (!publicKey || !secretKey) return null;
  client = new Langfuse({
    publicKey,
    secretKey,
    baseUrl: host,
  });
  return client;
}

export interface TraceLlmCallOptions<T> {
  queryType: string;
  input: unknown;
  prompt: string;
  invoke: () => Promise<T>;
  model?: string;
  nodeName?: string;
  attempt?: number;
}

export interface TraceNodeOptions<TInput, TOutput> {
  nodeName: string;
  input: TInput;
  execute: (input: TInput) => Promise<TOutput>;
  queryType?: string;
}

/**
 * Wraps an async LLM call and records input, prompt, response, latency, and errors to Langfuse.
 * Handles failures and retries. No-op when Langfuse keys are not configured.
 */
export async function traceLlmCall<T>(opts: TraceLlmCallOptions<T>): Promise<T> {
  const { queryType, input, prompt, invoke, model, nodeName, attempt } = opts;
  const langfuse = getClient();

  if (!langfuse) {
    return invoke();
  }

  const start = performance.now();
  const trace = langfuse.trace({
    name: `llm:${queryType}`,
    input: { query: input, prompt },
    metadata: {
      queryType,
      ...(nodeName && { nodeName }),
      attempt: attempt ?? 1,
    },
  });

  const generation = trace.generation({
    name: `generation:${queryType}`,
    input: [{ role: 'user', content: prompt }],
    model: model ?? 'gpt-4o-mini',
    metadata: {
      queryType,
      ...(nodeName && { nodeName }),
      success: false,
      attempt: attempt ?? 1,
    },
  });

  try {
    const result = await invoke();
    const latencyMs = performance.now() - start;

    generation.update({
      metadata: {
        queryType,
        ...(nodeName && { nodeName }),
        success: true,
        attempt: attempt ?? 1,
      },
    });
    generation.end({
      output: result,
    });

    trace.update({
      output: result,
      metadata: {
        queryType,
        ...(nodeName && { nodeName }),
        success: true,
        attempt: attempt ?? 1,
        latencyMs,
      },
    });

    return result;
  } catch (err) {
    const latencyMs = performance.now() - start;
    const errorMessage = err instanceof Error ? err.message : String(err);

    generation.update({
      statusMessage: errorMessage,
      metadata: {
        queryType,
        ...(nodeName && { nodeName }),
        success: false,
        attempt: attempt ?? 1,
      },
    });
    generation.end();

    trace.update({
      output: undefined,
      metadata: {
        queryType,
        ...(nodeName && { nodeName }),
        success: false,
        attempt: attempt ?? 1,
        latencyMs,
        error: errorMessage,
      },
    });

    throw err;
  }
}

/**
 * Traces a LangGraph node execution. Records input, output, latency, and metadata.
 */
export async function traceNode<TInput, TOutput>(
  opts: TraceNodeOptions<TInput, TOutput>
): Promise<TOutput> {
  const { nodeName, input, execute, queryType } = opts;
  const langfuse = getClient();

  if (!langfuse) {
    return execute(input);
  }

  const start = performance.now();
  const trace = langfuse.trace({
    name: `node:${nodeName}`,
    input,
    metadata: {
      nodeName,
      ...(queryType && { queryType }),
      success: false,
    },
  });

  try {
    const output = await execute(input);
    const latencyMs = performance.now() - start;

    trace.update({
      output,
      metadata: {
        nodeName,
        ...(queryType && { queryType }),
        success: true,
        latencyMs,
      },
    });

    return output;
  } catch (err) {
    const latencyMs = performance.now() - start;
    const errorMessage = err instanceof Error ? err.message : String(err);

    trace.update({
      output: undefined,
      metadata: {
        nodeName,
        ...(queryType && { queryType }),
        success: false,
        latencyMs,
        error: errorMessage,
      },
    });

    throw err;
  }
}

/**
 * Wraps a LangGraph node function with tracing. Use when defining graph nodes.
 */
export function withNodeTracing<TInput, TOutput>(
  nodeName: string,
  nodeFn: (input: TInput) => Promise<TOutput>,
  queryType?: string
): (input: TInput) => Promise<TOutput> {
  return (input: TInput) =>
    traceNode({
      nodeName,
      input,
      execute: nodeFn,
      queryType,
    });
}

/**
 * Flush pending Langfuse events. Call on graceful shutdown.
 */
export async function flushLangfuse(): Promise<void> {
  const c = getClient();
  if (c) {
    await c.flushAsync();
  }
}
