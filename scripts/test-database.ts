import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { neonConfig } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { db, migrate } from '../src/lib/db';
import { schema } from '../src/lib/schema';
import { allowed } from '../src/lib/rate-limit';
import { POST as submit } from '../src/app/api/submissions/route';

async function main() {
  // Always isolated: no application credentials and no network connection are used.
  process.env.DATABASE_URL = 'postgresql://test:test@ep-test.neon.tech/test';
  process.env.ADMIN_EMAIL = 'admin@example.test';
  process.env.ADMIN_PASSWORD = 'test-password-only';
  const pg = new PGlite();
  let failNext = true;
  const previousFetch = neonConfig.fetchFunction;
  neonConfig.fetchFunction = async (_url: string, options?: RequestInit) => {
    if (failNext) { failNext = false; return new Response('Test connection failure', { status: 503 }); }
    const body = JSON.parse(String(options?.body)) as { query?: string; params?: unknown[]; queries?: { query: string; params: unknown[] }[] };
    const run = async (client: Pick<PGlite, 'query'>, item: { query: string; params?: unknown[] }) => {
      const result = await client.query<Record<string, unknown>>(item.query, item.params || []);
      return {
        fields: result.fields,
        rows: result.rows.map(row => result.fields.map(field => {
          const value = row[field.name];
          return value == null ? null : value instanceof Date ? value.toISOString().replace('T', ' ').replace('Z', '+00') : String(value);
        })),
        rowCount: result.affectedRows ?? result.rows.length,
        command: item.query.split(' ')[0],
      };
    };
    try {
      const data = body.queries
        ? { results: await pg.transaction(async transaction => {
          const results = [];
          for (const item of body.queries!) results.push(await run(transaction, item));
          return results;
        }) }
        : await run(pg, { query: body.query!, params: body.params });
      return Response.json(data);
    } catch (error) { return Response.json({ message: (error as Error).message }, { status: 400 }); }
  };
  try {
    await assert.rejects(migrate(), /503/);
    await migrate(); // A temporary connection failure must not poison later initialization.
    const tables = await db.execute("SELECT tablename FROM pg_tables WHERE schemaname='public'");
    assert.equal(tables.rows.length, 8);
    const admin = await db.execute('SELECT * FROM users');
    assert.equal(admin.rows.length, 1);
    assert(await bcrypt.compare('test-password-only', String(admin.rows[0].password_hash)));
    await db.batch(schema); // Safe to initialize again after a cold start.
    assert.equal((await db.execute('SELECT * FROM users')).rows.length, 1);

    const request = (body: unknown) => new Request('https://coinspira.test/api/submissions', {
      method: 'POST', headers: { origin: 'https://coinspira.test', 'content-type': 'application/json' }, body: JSON.stringify(body),
    });
    assert.equal((await submit(request({ type: 'client-form', locale: 'es', payload: {
      'Nombre / Name': ['Viaje de prueba'], Email: ['traveler@example.test'], 'Trip context': ['Viaje accesible'], Consent: ['Yes'],
    } }))).status, 200);
    assert.equal((await submit(request({ type: 'client-form', locale: 'es', payload: {} }))).status, 400);
    assert.equal((await submit(new Request('https://coinspira.test/api/submissions', { method: 'POST', headers: { origin: 'https://other.test' } }))).status, 403);
    const submission = (await db.execute('SELECT * FROM submissions')).rows[0];
    assert.equal(typeof submission.created_at, 'string');

    const operations = readFileSync('src/app/api/admin/operations/route.ts', 'utf8');
    const contactSql = operations.match(/sql: "(INSERT INTO crm_contacts[^"\n]+)"/)![1];
    await db.batch([{ sql: contactSql, args: ['contact', String(submission.id), 'Viaje de prueba', 'traveler@example.test', '', 'Oaxaca'] }]);
    await db.batch([{ sql: contactSql, args: ['duplicate', String(submission.id), 'Duplicate', '', '', ''] }]);
    assert.equal((await db.execute('SELECT * FROM crm_contacts')).rows.length, 1);
    const appointmentSql = operations.match(/sql: '(INSERT INTO appointments[^'\n]+)'/)![1];
    await db.execute({ sql: appointmentSql, args: ['appointment', 'contact', 'Sesión', '2026-10-15T10:30', 30, 'confirmada', ''] });
    assert.equal((await db.execute('SELECT * FROM appointments')).rows[0].starts_at, '2026-10-15T10:30');
    const paymentSql = operations.match(/sql: '(INSERT INTO payments[^'\n]+)'/)![1];
    await db.execute({ sql: paymentSql, args: ['payment', 'contact', 'anticipo', 150050, 'transferencia', 'pendiente', '', '', null] });
    const paidSql = operations.match(/sql: "(UPDATE payments[^"\n]+)"/)![1];
    assert.equal((await db.execute({ sql: paidSql, args: ['pagado', 'pagado', 'payment', 'pagado'] })).rowsAffected, 1);
    assert.equal((await db.execute({ sql: paidSql, args: ['cancelado', 'cancelado', 'payment', 'cancelado'] })).rowsAffected, 0);
    assert.equal((await db.execute('SELECT * FROM payments')).rows[0].amount_cents, 150050);
    await assert.rejects(db.execute({ sql: paymentSql, args: ['bad-contact', 'missing', 'anticipo', 100, 'transferencia', 'pendiente', '', '', null] }), /foreign key/i);

    const adminSource = readFileSync('src/app/api/admin/route.ts', 'utf8');
    const contentSql = adminSource.match(/sql: '(INSERT INTO content_blocks[^'\n]+)'/)![1];
    await db.execute({ sql: contentSql, args: ['text-1', 'Hola', 'Hello'] });
    await db.execute({ sql: contentSql, args: ['text-1', 'Actualizado', 'Updated'] });
    assert.equal((await db.execute('SELECT * FROM content_blocks')).rows[0].es, 'Actualizado');
    const entrySql = adminSource.match(/sql: '(INSERT INTO entries[^'\n]+)'/)![1];
    await db.execute({ sql: entrySql, args: ['entry', 'historia', 'test-entry', 'Historia', 'Story', 'Texto', 'Text', 1] });
    assert.equal((await db.execute({ sql: 'SELECT * FROM entries WHERE slug=$1 AND published=1', args: ['test-entry'] })).rows.length, 1);
    assert.equal((await db.execute({ sql: 'SELECT * FROM entries WHERE slug=$1', args: ["' OR 1=1 --"] })).rows.length, 0);

    const limiterRequest = new Request('https://coinspira.test', { headers: { 'x-forwarded-for': '192.0.2.1' } });
    assert.equal(await allowed(limiterRequest, 'test', 1), true);
    assert.equal(await allowed(limiterRequest, 'test', 1), false);
    await db.execute("UPDATE rate_limits SET expires=0 WHERE key IS NOT NULL");
    assert.equal(await allowed(limiterRequest, 'test', 1), true);
    await assert.rejects(db.batch([
      { sql: 'INSERT INTO content_blocks(id,es,en) VALUES ($1,$2,$3)', args: ['rollback', 'x', 'x'] },
      { sql: 'INSERT INTO content_blocks(id,es,en) VALUES ($1,$2,$3)', args: ['rollback', 'x', 'x'] },
    ]), /duplicate key/i);
    assert.equal((await db.execute("SELECT * FROM content_blocks WHERE id='rollback'")).rows.length, 0);
    console.log('PostgreSQL OK: schema, bootstrap, submissions, CRM, calendar, payments, CMS, publications, rate limits and transaction rollback.');
  } finally { neonConfig.fetchFunction = previousFetch; await pg.close(); }
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
