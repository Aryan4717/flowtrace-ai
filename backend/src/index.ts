import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { loggingMiddleware } from './middleware/logging';
import routes from './routes';
import { ingestData } from './services/data/data.service';

const app = express();

app.use(cors());
app.use(express.json());
app.use(loggingMiddleware);

app.use(routes);

app.use(errorHandler);

async function main(): Promise<void> {
  try {
    await ingestData();
  } catch (err) {
    console.error('[SAP Ingestion] Startup ingestion failed:', err);
  }

  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
  });
}

void main();
