// LangGraph service - placeholder for future LangGraph workflows
// When defining nodes, wrap with withNodeTracing for Langfuse observability:
//
// import { withNodeTracing } from '../observability';
//
// const sqlNode = withNodeTracing('sql_node', async (state) => {
//   const result = await invokeSqlLlm(state.query, model);
//   return { ...state, sql: result };
// }, 'sql');

export { withNodeTracing, traceNode, type TraceNodeOptions } from '../observability';
