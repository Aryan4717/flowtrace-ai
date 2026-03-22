/**
 * Keyword-based guardrail fallback. Rejects obvious off-topic queries without LLM.
 */
const REJECT_PATTERNS: { pattern: RegExp; category: 'general_knowledge' | 'creative' | 'off_topic' }[] = [
  { pattern: /^(write|compose|create|make me)\s+(a|an)\s+(poem|story|song|joke|essay|letter)/i, category: 'creative' },
  { pattern: /^(tell me\s+)?(a|the)\s+(joke|story|poem)/i, category: 'creative' },
  { pattern: /^(what is|who is|when did|where is|why do|how does)\s+(the\s+)?(capital|president|population|meaning of)/i, category: 'general_knowledge' },
  { pattern: /^(capital of|population of|history of)\s+/i, category: 'general_knowledge' },
  { pattern: /^(explain|define|what does)\s+(quantum|philosophy|religion|politics)/i, category: 'general_knowledge' },
  { pattern: /^(recipe|how to cook|weather|sports score|movie|music|game)/i, category: 'off_topic' },
  { pattern: /\b(recipe|weather|sports|movie|music|game|joke|poem)\b/i, category: 'off_topic' },
];

/**
 * Returns reject category if query matches known off-topic patterns, else null.
 */
export function keywordReject(query: string): 'general_knowledge' | 'creative' | 'off_topic' | null {
  const trimmed = query.trim();
  if (!trimmed) return 'off_topic';

  for (const { pattern, category } of REJECT_PATTERNS) {
    if (pattern.test(trimmed)) return category;
  }
  return null;
}
