import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  databaseUrl: process.env.DATABASE_URL ?? '',
  dataPath: process.env.DATA_PATH ?? './data',
  langfuse: {
    publicKey: process.env.LANGFUSE_PUBLIC_KEY ?? '',
    secretKey: process.env.LANGFUSE_SECRET_KEY ?? '',
    host: process.env.LANGFUSE_HOST ?? 'https://cloud.langfuse.com',
  },
};
