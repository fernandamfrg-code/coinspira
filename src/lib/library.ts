import { db, migrate, databaseConfigured } from './db';
export async function publishedEntries() {
  if (!databaseConfigured() && !process.env.VERCEL) return [];
  await migrate();
  const result = await db.execute('SELECT slug,title,title_en,body,body_en,kind FROM entries WHERE published=1 ORDER BY updated_at DESC');
  return result.rows;
}
export async function publishedEntry(slug: string) {
  if (!databaseConfigured() && !process.env.VERCEL) return null;
  await migrate();
  const result = await db.execute({ sql: 'SELECT * FROM entries WHERE slug=$1 AND published=1', args: [slug] });
  return result.rows[0] || null;
}
