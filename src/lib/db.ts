import { createClient } from '@libsql/client';
export const db = createClient({ url: process.env.TURSO_DATABASE_URL || 'file:local.db', authToken: process.env.TURSO_AUTH_TOKEN });
let ready: Promise<unknown> | undefined;
export function migrate() {
  return ready ??= db.batch([
    'CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL)',
    'CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL)',
    'CREATE TABLE IF NOT EXISTS content_blocks (id TEXT PRIMARY KEY, es TEXT NOT NULL, en TEXT NOT NULL)',
    "CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, type TEXT NOT NULL, locale TEXT NOT NULL, payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'nuevo', created_at TEXT DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS entries (id TEXT PRIMARY KEY, kind TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL, title_en TEXT NOT NULL DEFAULT '', body TEXT NOT NULL, body_en TEXT NOT NULL DEFAULT '', published INTEGER NOT NULL DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)"
  ], 'write');
}
