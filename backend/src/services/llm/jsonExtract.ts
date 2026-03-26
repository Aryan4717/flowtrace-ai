/**
 * Extracts and parses JSON from LLM output (handles markdown fences and surrounding text).
 */

function stripCodeFences(text: string): string {
  let s = text.trim();
  const fence = /^```(?:json)?\s*\n?/i;
  if (fence.test(s)) {
    s = s.replace(fence, '');
    const end = s.lastIndexOf('```');
    if (end !== -1) s = s.slice(0, end);
  }
  return s.trim();
}

/**
 * Finds the outermost JSON object substring `{ ... }` by brace matching.
 */
function extractJsonObjectSubstring(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i]!;
    if (escape) {
      escape = false;
      continue;
    }
    if (c === '\\' && inString) {
      escape = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Parses JSON from raw LLM output. Throws if no valid JSON object.
 */
export function parseJsonFromLlmOutput(raw: string): Record<string, unknown> {
  const cleaned = stripCodeFences(raw);
  let candidate = cleaned;
  try {
    return JSON.parse(candidate) as Record<string, unknown>;
  } catch {
    const sub = extractJsonObjectSubstring(cleaned) ?? extractJsonObjectSubstring(raw);
    if (sub) {
      return JSON.parse(sub) as Record<string, unknown>;
    }
  }
  throw new Error('Invalid LLM JSON output');
}
