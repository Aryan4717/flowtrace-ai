import * as fs from 'fs/promises';
import * as path from 'path';
import {
  mapCustomer,
  mapDelivery,
  mapInvoice,
  mapPayment,
  mapProduct,
  mapSalesOrder,
} from '../../models';
import {
  insertCustomer,
  insertDelivery,
  insertInvoice,
  insertPayment,
  insertProduct,
  insertSalesOrder,
  store,
} from './store';
import { loadJSONFiles } from '../../utils/jsonLoader';
import { normalizeRecord } from '../../utils/normalizeRecord';

const LOG_PREFIX = '[SAP Ingestion]';

/** Resolved from compiled location: dist/services/data -> backend/data/sap-o2c-data */
export const SAP_DATASET_PATH = path.resolve(
  __dirname,
  '../../../data/sap-o2c-data'
);

export interface EntityWithId {
  id: string;
}

export interface IngestCounts {
  ok: number;
  skipped: number;
}

export interface IngestResult {
  customers: IngestCounts;
  products: IngestCounts;
  orders: IngestCounts;
  deliveries: IngestCounts;
  invoices: IngestCounts;
  payments: IngestCounts;
}

const INGESTION_ORDER = [
  'business_partners',
  'products',
  'sales_order_headers',
  'outbound_delivery_headers',
  'billing_document_headers',
  'payments_accounts_receivable',
] as const;

type FolderName = (typeof INGESTION_ORDER)[number];

type MapperFn = (raw: unknown) => EntityWithId;
type InsertFn = (entity: EntityWithId, upsert: boolean) => boolean;

const FOLDER_ENTITY_MAP: Record<FolderName, { mapper: MapperFn; insert: InsertFn }> = {
  business_partners: { mapper: mapCustomer, insert: insertCustomer as InsertFn },
  products: { mapper: mapProduct, insert: insertProduct as InsertFn },
  sales_order_headers: { mapper: mapSalesOrder, insert: insertSalesOrder as InsertFn },
  outbound_delivery_headers: { mapper: mapDelivery, insert: insertDelivery as InsertFn },
  billing_document_headers: { mapper: mapInvoice, insert: insertInvoice as InsertFn },
  payments_accounts_receivable: { mapper: mapPayment, insert: insertPayment as InsertFn },
};

const ENTITY_KEY: Record<FolderName, keyof IngestResult> = {
  business_partners: 'customers',
  products: 'products',
  sales_order_headers: 'orders',
  outbound_delivery_headers: 'deliveries',
  billing_document_headers: 'invoices',
  payments_accounts_receivable: 'payments',
};

function toRecord(input: unknown): Record<string, unknown> {
  return input != null && typeof input === 'object' && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : {};
}

async function isDirectory(folderPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(folderPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function ingestFolder(
  basePath: string,
  folder: FolderName,
  mapper: MapperFn,
  insert: InsertFn
): Promise<IngestCounts> {
  const folderPath = path.join(basePath, folder);
  const rawRecords = await loadJSONFiles(folderPath);

  let ok = 0;
  let skipped = 0;

  for (const raw of rawRecords) {
    try {
      const normalized = normalizeRecord(toRecord(raw));
      const entity = mapper(normalized);

      if (!entity.id) {
        skipped++;
        continue;
      }

      insert(entity, true);
      ok++;
    } catch {
      skipped++;
    }
  }

  return { ok, skipped };
}

function logStoreSizes(): void {
  console.log(
    `${LOG_PREFIX} Store sizes: customers=${store.customers.size}, orders=${store.orders.size}, deliveries=${store.deliveries.size}, invoices=${store.invoices.size}, payments=${store.payments.size}, products=${store.products.size}`
  );
}

/**
 * Loads JSON/JSONL from data folders, normalizes records, maps to entities, and inserts into the in-memory store.
 * Handles invalid data (skips records with empty id), duplicates (upsert), and missing folders (0 items).
 */
export async function ingestData(basePath?: string): Promise<IngestResult> {
  const dataPath = path.resolve(basePath ?? SAP_DATASET_PATH);

  console.log(`${LOG_PREFIX} Base path:`, dataPath);

  const result: IngestResult = {
    customers: { ok: 0, skipped: 0 },
    products: { ok: 0, skipped: 0 },
    orders: { ok: 0, skipped: 0 },
    deliveries: { ok: 0, skipped: 0 },
    invoices: { ok: 0, skipped: 0 },
    payments: { ok: 0, skipped: 0 },
  };

  for (const folder of INGESTION_ORDER) {
    const folderPath = path.join(dataPath, folder);
    const { mapper, insert } = FOLDER_ENTITY_MAP[folder];

    try {
      const exists = await isDirectory(folderPath);
      if (!exists) {
        console.warn(
          `${LOG_PREFIX} Folder missing or not a directory, skipping: ${folderPath}`
        );
        continue;
      }

      const counts = await ingestFolder(dataPath, folder, mapper, insert);
      result[ENTITY_KEY[folder]] = counts;

      console.log(
        `${LOG_PREFIX} Loading ${folder}... ${counts.ok} records loaded (${counts.skipped} skipped)`
      );
    } catch (err) {
      console.warn(
        `${LOG_PREFIX} Error ingesting folder "${folder}":`,
        err instanceof Error ? err.message : err
      );
    }
  }

  logStoreSizes();

  const totalEntities =
    store.customers.size +
    store.orders.size +
    store.deliveries.size +
    store.invoices.size +
    store.payments.size +
    store.products.size;

  if (totalEntities === 0) {
    console.warn(
      `${LOG_PREFIX} Warning: store is empty after ingestion. Check base path and dataset folders.`
    );
  } else {
    console.log(
      `${LOG_PREFIX} Complete. Summary — customers: ${store.customers.size}, products: ${store.products.size}, orders: ${store.orders.size}, deliveries: ${store.deliveries.size}, invoices: ${store.invoices.size}, payments: ${store.payments.size}`
    );
  }

  return result;
}
