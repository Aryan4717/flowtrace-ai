import dotenv from 'dotenv';

dotenv.config();

/** Comma-separated browser origins allowed to call the API (e.g. your Vercel URL). Empty = reflect any origin (dev-friendly). */
function parseCorsOrigins(raw: string | undefined): string[] | true {
  const list = (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : true;
}

export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  databaseUrl: process.env.DATABASE_URL ?? '',
  dataPath: process.env.DATA_PATH ?? './data',
  /** Set `CORS_ORIGIN` in production to your Vercel URL(s), comma-separated. */
  corsOrigin: parseCorsOrigins(process.env.CORS_ORIGIN),
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
  },
  langfuse: {
    publicKey: process.env.LANGFUSE_PUBLIC_KEY ?? '',
    secretKey: process.env.LANGFUSE_SECRET_KEY ?? '',
    host: process.env.LANGFUSE_HOST ?? 'https://cloud.langfuse.com',
  },
};
