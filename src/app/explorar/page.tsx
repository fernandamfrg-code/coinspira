import Link from 'next/link';
import { db, migrate } from '@/lib/db';
export const dynamic = 'force-dynamic';
export default async function Page() {
  await migrate(); const result = await db.execute('SELECT slug,title,kind FROM entries WHERE published=1 ORDER BY updated_at DESC');
  return <main style={{ padding: 40, maxWidth: 900, margin: 'auto', fontFamily: 'Georgia,serif' }}><Link href="/">Coinspira</Link><h1>Historias, recursos y coinspiradores</h1>{!result.rows.length && <p>Estamos preparando esta biblioteca.</p>}{result.rows.map(r => <article key={String(r.slug)}><p>{String(r.kind)}</p><h2><Link href={`/explorar/${r.slug}`}>{String(r.title)}</Link></h2></article>)}</main>;
}
