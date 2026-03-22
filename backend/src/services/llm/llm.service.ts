import {
  ANSWER_PROMPT,
  GRAPH_PROMPT,
  GUARDRAIL_PROMPT,
  INTENT_PROMPT,
  SQL_PROMPT,
  SYSTEM_PROMPT,
} from './prompts';
import { buildPrompt, getSchemaString } from './promptBuilder';

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

export function getAnswerPrompt(data: string): string {
  return buildPrompt(ANSWER_PROMPT, {
    data,
  });
}
