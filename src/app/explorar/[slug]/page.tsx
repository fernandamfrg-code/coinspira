import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, migrate } from '@/lib/db';
export const dynamic = 'force-dynamic';
export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }) {
  await migrate(); const { slug } = await params;
  const result = await db.execute({ sql: 'SELECT * FROM entries WHERE slug=? AND published=1', args: [slug] });
  const entry = result.rows[0]; if (!entry) notFound();
  const english = (await searchParams).lang === 'en';
  return <main style={{ padding: 40, maxWidth: 900, margin: 'auto', fontFamily: 'Georgia,serif' }}><Link href="/explorar">Explorar</Link><p><Link href={`?lang=${english ? 'es' : 'en'}`}>{english ? 'Español' : 'English'}</Link></p><h1>{String(english && entry.title_en || entry.title)}</h1><div style={{ whiteSpace: 'pre-wrap' }}>{String(english && entry.body_en || entry.body)}</div></main>;
}
