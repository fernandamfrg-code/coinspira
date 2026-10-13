import Link from 'next/link';
import { publishedEntries } from '@/lib/library';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Historias y recursos — CoInspira' };
const labels: Record<string, [string, string]> = { historia: ['Historia', 'Story'], recurso: ['Recurso', 'Resource'], coinspirador: ['Coinspirador', 'Travel ally'] };
export default async function Page({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const en = (await searchParams).lang === 'en';
  const entries = await publishedEntries();
  return <>
    <header className="library-header"><Link href="/" className="library-brand"><span aria-hidden="true">↗</span> coinspira</Link><Link href={`?lang=${en ? 'es' : 'en'}`} className="library-language">{en ? 'Español' : 'English'}</Link></header>
    <main className="library-main"><div className="library-intro"><span className="library-kicker">{en ? 'IDEAS THAT OPEN ROUTES' : 'IDEAS QUE ABREN CAMINO'}</span><h1>{en ? 'Every journey starts with a story.' : 'Cada viaje empieza con una historia.'}</h1><p>{en ? 'Experiences, resources and people to help you plan with more context and fewer unknowns.' : 'Experiencias, recursos y personas para preparar tu viaje con más contexto y menos preguntas sin respuesta.'}</p></div>
      {entries.length ? <div className="library-grid">{entries.map((entry, i) => {
        const title = String(en && entry.title_en || entry.title);
        const body = String(en && entry.body_en || entry.body);
        return <Link href={`/historias/${encodeURIComponent(String(entry.slug))}${en ? '?lang=en' : ''}`} key={String(entry.slug)} className="library-card"><div className="library-card-top"><span>{(labels[String(entry.kind)] || ['Publicación', 'Publication'])[en ? 1 : 0]}</span><span>{String(i + 1).padStart(2, '0')}</span></div><h2>{title}</h2><p>{body.length > 180 ? `${body.slice(0, 180)}…` : body}</p><span className="library-read">{en ? 'Read the story' : 'Leer publicación'} <span aria-hidden="true">↗</span></span></Link>;
      })}</div> : <div className="library-empty"><span aria-hidden="true">↗</span><h2>{en ? 'We’re gathering the first stories.' : 'Estamos reuniendo las primeras historias.'}</h2><p>{en ? 'This library will grow with shared experiences and helpful resources. Do you have something to share?' : 'Esta biblioteca crecerá con experiencias compartidas y recursos que ayuden a viajar. ¿Tienes algo que compartir?'}</p><Link href="/#aportar">{en ? 'Share your experience ↗' : 'Comparte tu experiencia ↗'}</Link></div>}
    </main><footer className="library-footer"><span>© 2026 CoInspira</span><Link href="/#cliente">{en ? 'Let’s plan your journey ↗' : 'Planeemos tu viaje ↗'}</Link></footer>
  </>;
}
