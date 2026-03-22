import * as path from 'path';
import { config } from '../../config';
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
} from './store';
import { loadJSONFiles } from '../../utils/jsonLoader';
import { normalizeRecord } from '../../utils/normalizeRecord';

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
    const normalized = normalizeRecord(toRecord(raw));
    const entity = mapper(normalized);

    if (!entity.id) {
      skipped++;
      continue;
    }

    insert(entity, true);
    ok++;
  }

  return { ok, skipped };
}

/**
 * Loads JSON from data folders, normalizes records, maps to entities, and inserts into the in-memory store.
 * Handles invalid data (skips records with empty id), duplicates (upsert), and missing folders (0 items).
 */
export async function ingestData(basePath?: string): Promise<IngestResult> {
  const dataPath = basePath ?? config.dataPath;
  const result: IngestResult = {
    customers: { ok: 0, skipped: 0 },
    products: { ok: 0, skipped: 0 },
    orders: { ok: 0, skipped: 0 },
    deliveries: { ok: 0, skipped: 0 },
    invoices: { ok: 0, skipped: 0 },
    payments: { ok: 0, skipped: 0 },
  };

  for (const folder of INGESTION_ORDER) {
    const { mapper, insert } = FOLDER_ENTITY_MAP[folder];
    const counts = await ingestFolder(dataPath, folder, mapper, insert);
    result[ENTITY_KEY[folder]] = counts;
  }

  return result;
}
