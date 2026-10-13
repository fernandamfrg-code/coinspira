import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { schema } from './schema';

type Row = Record<string, string | number | null>;
type Statement = string | { sql: string; args?: (string | number | null)[] };
type Result = { rows: Row[]; rowsAffected: number };
let client: NeonQueryFunction<false, true> | undefined;
let ready: Promise<void> | undefined;

export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}
function connection() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error('Conecta una base Neon al proyecto en Vercel: falta DATABASE_URL.');
  return client ??= neon(url, { fullResults: true });
}
function query(statement: Statement) {
  return typeof statement === 'string' ? { sql: statement, args: [] } : { sql: statement.sql, args: statement.args || [] };
}
function result(value: { rows: Record<string, unknown>[]; rowCount: number | null }): Result {
  return {
    rows: value.rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value])) as Row),
    rowsAffected: value.rowCount || 0,
  };
}
export const db = {
  async execute(statement: Statement): Promise<Result> {
    const { sql, args } = query(statement);
    return result(await connection().query(sql, args));
  },
  async batch(statements: Statement[], _mode?: 'write'): Promise<Result[]> {
    if (!statements.length) return [];
    const sql = connection();
    const results = await sql.transaction(statements.map(statement => {
      const item = query(statement);
      return sql.query(item.sql, item.args);
    }));
    return results.map(result);
  },
};

async function initialize() {
  // Serialize cold starts so two functions do not create the same tables concurrently.
  await db.batch(['SELECT pg_advisory_xact_lock(734016291)', ...schema]);
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email || password) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 8 || password.length > 256) {
      throw new Error('Configura ADMIN_EMAIL y ADMIN_PASSWORD (8 a 256 caracteres) para el primer acceso.');
    }
    const existing = await db.execute({ sql: 'SELECT id FROM users WHERE email=$1', args: [email] });
    if (!existing.rows.length) await db.execute({
      sql: 'INSERT INTO users (id,email,password_hash) VALUES ($1,$2,$3) ON CONFLICT(email) DO NOTHING',
      args: [randomUUID(), email, await bcrypt.hash(password, 12)],
    });
  }
}
export function migrate() {
  return ready ??= initialize().catch(error => { ready = undefined; throw error; });
}
