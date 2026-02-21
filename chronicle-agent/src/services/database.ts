import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../../chronicle.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    wallet_address TEXT NOT NULL,
    arweave_id TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL,
    encrypted INTEGER DEFAULT 0,
    size_bytes INTEGER,
    cost_usd REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_uploads_wallet ON uploads(wallet_address);
  CREATE INDEX IF NOT EXISTS idx_uploads_created ON uploads(created_at);
`);

export interface UploadRecord {
  id: number;
  wallet_address: string;
  arweave_id: string;
  url: string;
  type: string;
  encrypted: number;
  size_bytes: number;
  cost_usd: number;
  created_at: string;
}

export function getOrCreateUser(walletAddress: string): { id: number; wallet_address: string } {
  const existing = db.prepare('SELECT id, wallet_address FROM users WHERE wallet_address = ?').get(walletAddress) as { id: number; wallet_address: string } | undefined;
  
  if (existing) {
    return existing;
  }
  
  const result = db.prepare('INSERT INTO users (wallet_address) VALUES (?)').run(walletAddress);
  return { id: result.lastInsertRowid as number, wallet_address: walletAddress };
}

export function recordUpload(
  walletAddress: string,
  arweaveId: string,
  url: string,
  type: string,
  encrypted: boolean,
  sizeBytes: number,
  costUsd: number
): number {
  const user = getOrCreateUser(walletAddress);
  
  const result = db.prepare(`
    INSERT INTO uploads (user_id, wallet_address, arweave_id, url, type, encrypted, size_bytes, cost_usd)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(user.id, walletAddress, arweaveId, url, type, encrypted ? 1 : 0, sizeBytes, costUsd);
  
  return result.lastInsertRowid as number;
}

export function getUserUploads(walletAddress: string, limit = 50, offset = 0): UploadRecord[] {
  return db.prepare(`
    SELECT id, wallet_address, arweave_id, url, type, encrypted, size_bytes, cost_usd, created_at
    FROM uploads
    WHERE wallet_address = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(walletAddress, limit, offset) as UploadRecord[];
}

export function getUserUploadCount(walletAddress: string): number {
  const result = db.prepare('SELECT COUNT(*) as count FROM uploads WHERE wallet_address = ?').get(walletAddress) as { count: number };
  return result.count;
}

export function exportUploadsJson(walletAddress: string): string {
  const uploads = getUserUploads(walletAddress, 10000);
  return JSON.stringify(uploads.map(u => ({
    id: u.arweave_id,
    url: u.url,
    type: u.type,
    encrypted: !!u.encrypted,
    size_bytes: u.size_bytes,
    cost_usd: u.cost_usd,
    created_at: u.created_at,
  })), null, 2);
}

export function exportUploadsCsv(walletAddress: string): string {
  const uploads = getUserUploads(walletAddress, 10000);
  const header = 'id,url,type,encrypted,size_bytes,cost_usd,created_at';
  const rows = uploads.map(u => 
    `${u.arweave_id},${u.url},${u.type},${u.encrypted},${u.size_bytes},${u.cost_usd},${u.created_at}`
  );
  return [header, ...rows].join('\n');
}

export default db;