import { createHash } from 'node:crypto';
import { db, migrate } from './db';
export async function allowed(request: Request, scope: string, limit: number) {
  await migrate();
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const key = createHash('sha256').update(`${scope}:${ip}`).digest('hex');
  const now = Date.now();
  const result = await db.execute({
    sql: 'INSERT INTO rate_limits (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires < ? THEN 1 ELSE count+1 END, expires=CASE WHEN expires < ? THEN excluded.expires ELSE expires END RETURNING count',
    args: [key, now + 3600000, now, now],
  });
  return Number(result.rows[0].count) <= limit;
}
