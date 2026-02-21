import { UploadImageHandler } from '../../src/handlers/upload_image.js';
import { UploadMarkdownHandler } from '../../src/handlers/upload_markdown.js';
import { UploadJsonHandler } from '../../src/handlers/upload_json.js';
import { recordUpload, getUserUploads, getUserUploadCount, exportUploadsJson, exportUploadsCsv } from '../../src/services/database.js';
import type { JobRequirements, JobResult } from '../../src/types/index.js';

export interface OfferingConfig {
  evmPrivateKey: string;
}

let imageHandler: UploadImageHandler | null = null;
let markdownHandler: UploadMarkdownHandler | null = null;
let jsonHandler: UploadJsonHandler | null = null;

export function initializeOffering(config: OfferingConfig): void {
  imageHandler = new UploadImageHandler(config.evmPrivateKey);
  markdownHandler = new UploadMarkdownHandler(config.evmPrivateKey);
  jsonHandler = new UploadJsonHandler(config.evmPrivateKey);
}

export async function executeJob(requirements: JobRequirements): Promise<JobResult> {
  if (!imageHandler || !markdownHandler || !jsonHandler) {
    throw new Error('Offering not initialized. Call initializeOffering first.');
  }

  const { data, type, encrypted, cipherIv, walletAddress } = requirements;

  let result;

  switch (type) {
    case 'image':
      result = await imageHandler.handle(data, encrypted, cipherIv);
      break;
    case 'markdown':
      result = await markdownHandler.handle(data, encrypted, cipherIv);
      break;
    case 'json':
      result = await jsonHandler.handle(data, encrypted, cipherIv);
      break;
    default:
      throw new Error(`Unknown upload type: ${type}`);
  }

  if (walletAddress) {
    const sizeBytes = typeof data === 'string' ? new TextEncoder().encode(data).length : data.length;
    const costUsd = Math.max(0.01, (sizeBytes / 1024) * 0.001 * 1.1);
    recordUpload(walletAddress, result.id, result.url, type, encrypted || false, sizeBytes, costUsd);
  }

  return result;
}

export { getUserUploads, getUserUploadCount, exportUploadsJson, exportUploadsCsv };

export function validateRequirements(requirements: unknown): requirements is JobRequirements {
  if (!requirements || typeof requirements !== 'object') {
    return false;
  }

  const req = requirements as Record<string, unknown>;

  if (typeof req.data !== 'string') {
    throw new Error('Missing or invalid required field: data (string)');
  }

  if (!['image', 'markdown', 'json'].includes(req.type as string)) {
    throw new Error('Missing or invalid required field: type (must be image, markdown, or json)');
  }

  if (req.encrypted === true && !req.cipherIv) {
    throw new Error('cipherIv is required when encrypted is true');
  }

  return true;
}

export const metadata = {
  name: 'chronicle-storage',
  description: 'Persistent storage service for AI agents',
  version: '1.0.0',
};