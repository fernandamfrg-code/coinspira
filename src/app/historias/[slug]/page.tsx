import Link from 'next/link';
import { notFound } from 'next/navigation';
import { publishedEntry } from '@/lib/library';
export const dynamic = 'force-dynamic';
export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { slug } = await params;
  const entry = await publishedEntry(slug);
  if (!entry) notFound();
  const en = (await searchParams).lang === 'en';
  const title = String(en && entry.title_en || entry.title);
  const body = String(en && entry.body_en || entry.body);
  return <><header className="library-header"><Link href="/" className="library-brand"><span aria-hidden="true">↗</span> coinspira</Link><Link href={`?lang=${en ? 'es' : 'en'}`} className="library-language">{en ? 'Español' : 'English'}</Link></header><main className="library-article"><Link href={`/historias${en ? '?lang=en' : ''}`} className="library-back">← {en ? 'Back to the library' : 'Volver a la biblioteca'}</Link><span className="library-kicker">{String(entry.kind)}</span><h1>{title}</h1><div className="library-article-body">{body.split(/\n\s*\n/).map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div><Link href="/#cliente" className="library-next">{en ? 'Your next journey starts here ↗' : 'Tu próximo viaje empieza aquí ↗'}</Link></main><footer className="library-footer"><span>© 2026 CoInspira</span><Link href="/">{en ? 'Home ↗' : 'Inicio ↗'}</Link></footer></>;
}
