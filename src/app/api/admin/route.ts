import { randomUUID } from 'node:crypto';
import { session, sameOrigin } from '@/lib/auth';
import { db } from '@/lib/db';
import landing from '@/content/landing.json';
export async function GET() {
  if (!await session()) return Response.json({}, { status: 401 });
  const [content, submissions, entries] = await Promise.all([db.execute('SELECT * FROM content_blocks'), db.execute('SELECT * FROM submissions ORDER BY created_at DESC LIMIT 200'), db.execute('SELECT * FROM entries ORDER BY updated_at DESC')]);
  return Response.json({ texts: { ...landing.texts, ...Object.fromEntries(content.rows.map(r => [r.id, { es: r.es, en: r.en }])) }, submissions: submissions.rows, entries: entries.rows });
}
export async function PUT(request: Request) {
  if (!sameOrigin(request) || !await session()) return Response.json({}, { status: 403 });
  try {
    const raw = await request.text();
    if (raw.length > 100000) return Response.json({}, { status: 413 });
    const body = JSON.parse(raw);
    if (body.module === 'content') {
      if (!(body.id in landing.texts) || typeof body.es !== 'string' || typeof body.en !== 'string' || body.es.length > 10000 || body.en.length > 10000) return Response.json({}, { status: 400 });
      await db.execute({ sql: 'INSERT INTO content_blocks (id,es,en) VALUES ($1,$2,$3) ON CONFLICT(id) DO UPDATE SET es=excluded.es,en=excluded.en', args: [body.id, body.es, body.en] });
    } else if (body.module === 'submission') {
      if (!['nuevo', 'en revisión', 'contactado', 'cerrado'].includes(body.status)) return Response.json({}, { status: 400 });
      await db.execute({ sql: 'UPDATE submissions SET status=$1 WHERE id=$2', args: [body.status, body.id] });
    } else if (body.module === 'entry') {
      if (!['historia', 'recurso', 'coinspirador'].includes(body.kind) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug) || !body.title?.trim() || typeof body.body !== 'string') return Response.json({ error: 'Revisa título y slug (letras minúsculas y guiones).' }, { status: 400 });
      await db.execute({ sql: 'INSERT INTO entries (id,kind,slug,title,title_en,body,body_en,published) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(id) DO UPDATE SET kind=excluded.kind,slug=excluded.slug,title=excluded.title,title_en=excluded.title_en,body=excluded.body,body_en=excluded.body_en,published=excluded.published,updated_at=CURRENT_TIMESTAMP', args: [body.id || randomUUID(), body.kind, body.slug, body.title, body.title_en || '', body.body, body.body_en || '', body.published ? 1 : 0] });
    } else return Response.json({}, { status: 400 });
    return Response.json({ ok: true });
  } catch { return Response.json({ error: 'No se pudo guardar. Comprueba que el slug sea único.' }, { status: 400 }); }
}
