import { randomUUID } from 'node:crypto';
import { db, migrate } from '@/lib/db';
import { sameOrigin } from '@/lib/auth';
import { allowed } from '@/lib/rate-limit';
const required: Record<string, string[]> = {
  'client-form': ['Nombre / Name', 'Email', 'Trip context', 'Consent'],
  'story-form': ['Trip', 'What made it difficult', 'What worked'],
  'research-form': ['Name', 'Email', 'Research context', 'Consent'],
  'provider-form': ['Resource name', 'What it does'],
};
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({}, { status: 403 });
  try {
    if (!await allowed(request, 'submissions', 15)) return Response.json({}, { status: 429 });
    const raw = await request.text();
    if (raw.length > 24000) return Response.json({}, { status: 413 });
    const { type, locale, payload } = JSON.parse(raw);
    if (!required[type] || !['es', 'en'].includes(locale) || !payload || typeof payload !== 'object' || Array.isArray(payload)) return Response.json({}, { status: 400 });
    for (const value of Object.values(payload)) if (!Array.isArray(value) || value.length > 20 || value.some(v => typeof v !== 'string' || v.length > 6000)) return Response.json({}, { status: 400 });
    if (required[type].some(key => !payload[key]?.[0]?.trim())) return Response.json({ error: 'Faltan campos obligatorios.' }, { status: 400 });
    for (const key of ['Email', 'Email (optional)', 'Referrer email']) if (payload[key]?.[0] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload[key][0])) return Response.json({}, { status: 400 });
    await migrate();
    await db.execute({ sql: 'INSERT INTO submissions (id,type,locale,payload) VALUES (?,?,?,?)', args: [randomUUID(), type, locale, JSON.stringify(payload)] });
    return Response.json({ ok: true });
  } catch { return Response.json({ error: 'No se pudo guardar.' }, { status: 500 }); }
}
