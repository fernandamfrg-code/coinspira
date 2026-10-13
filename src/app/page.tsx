import './landing.css';
import Landing from './landing';
import { db, migrate, databaseConfigured } from '@/lib/db';
export const dynamic = 'force-dynamic';
export default async function Page() {
  if (!databaseConfigured() && !process.env.VERCEL) return <Landing overrides={{}} />;
  await migrate();
  const rows = await db.execute('SELECT * FROM content_blocks');
  return <Landing overrides={Object.fromEntries(rows.rows.map(r => [String(r.id), { es: String(r.es), en: String(r.en) }]))} />;
}
