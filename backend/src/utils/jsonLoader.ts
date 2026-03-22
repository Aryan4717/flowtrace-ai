import * as fs from 'fs/promises';
import { createReadStream } from 'fs';
import * as path from 'path';
import { createInterface } from 'readline';
import { logger } from './logger';

const JSON_EXT = /\.(json|jsonl)$/i;

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return [value];
}

async function loadJsonFile(filePath: string): Promise<unknown[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const trimmed = content.trim();
    if (!trimmed) return [];

    const parsed = JSON.parse(trimmed);
    return toArray(parsed);
  } catch (err) {
    logger.warn(`Failed to parse JSON file ${filePath}:`, err);
    return [];
  }
}

async function loadJsonlFile(filePath: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const results: unknown[] = [];
    const stream = createReadStream(filePath, { encoding: 'utf-8' });
    const rl = createInterface({ input: stream });

    rl.on('line', (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      try {
        const parsed = JSON.parse(trimmed);
        results.push(parsed);
      } catch {
        // Skip invalid line, don't log every bad line to avoid noise
      }
    });

    rl.on('error', (err) => {
      logger.warn(`Error reading JSONL file ${filePath}:`, err);
      resolve([]);
    });

    rl.on('close', () => resolve(results));
    stream.on('error', (err) => {
      logger.warn(`Error streaming file ${filePath}:`, err);
      resolve([]);
    });
  });
}

/**
 * Loads all .json and .jsonl files from a folder and returns their parsed contents as a flat array.
 * - .json files: parsed once; arrays are flattened, objects/other values added as single items.
 * - .jsonl files: streamed line-by-line for memory efficiency.
 * Handles invalid JSON, empty files, and missing folders gracefully; never throws.
 */
export async function loadJSONFiles(folderPath: string): Promise<unknown[]> {
  try {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile() && JSON_EXT.test(e.name))
      .map((e) => path.join(folderPath, e.name));

    if (files.length === 0) return [];

    const results = await Promise.all(
      files.map((filePath) =>
        filePath.endsWith('.jsonl')
          ? loadJsonlFile(filePath)
          : loadJsonFile(filePath)
      )
    );

    return results.flat();
  } catch (err) {
    logger.warn(`Failed to load JSON files from ${folderPath}:`, err);
    return [];
  }
}
