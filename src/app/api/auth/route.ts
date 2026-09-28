import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { db, migrate } from '@/lib/db';
import { login, sameOrigin } from '@/lib/auth';
import { allowed } from '@/lib/rate-limit';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({}, { status: 403 });
  try {
    if (!await allowed(request, 'login', 20)) return Response.json({ error: 'Intenta más tarde.' }, { status: 429 });
    const { email, password } = await request.json();
    if (typeof email !== 'string' || typeof password !== 'string' || password.length > 256) return Response.json({}, { status: 400 });
    await migrate();
    const result = await db.execute({ sql: 'SELECT * FROM users WHERE email=?', args: [email.toLowerCase()] });
    const user = result.rows[0];
    if (!user || !await bcrypt.compare(password, String(user.password_hash))) return Response.json({ error: 'Credenciales incorrectas.' }, { status: 401 });
    await login(String(user.id));
    return Response.json({ ok: true });
  } catch { return Response.json({ error: 'No se pudo iniciar sesión. Revisa la configuración.' }, { status: 500 }); }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return Response.json({}, { status: 403 });
  (await cookies()).delete('coinspira_session');
  return Response.json({ ok: true });
}
