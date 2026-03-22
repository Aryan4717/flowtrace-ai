const timestamp = (): string => new Date().toISOString();

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    console.log(`[${timestamp()}] INFO:`, message, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[${timestamp()}] ERROR:`, message, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[${timestamp()}] WARN:`, message, ...args);
  },
};
