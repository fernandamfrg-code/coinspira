import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db, migrate } from './db';
function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error('Configura AUTH_SECRET con al menos 32 caracteres.');
  return new TextEncoder().encode(value);
}
export async function session() {
  try {
    const token = (await cookies()).get('coinspira_session')?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] });
    await migrate();
    const user = await db.execute({ sql: 'SELECT id FROM users WHERE id = ?', args: [String(payload.sub)] });
    return user.rows[0] || null;
  } catch { return null; }
}
export async function login(id: string) {
  const token = await new SignJWT({}).setSubject(id).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1d').sign(secret());
  (await cookies()).set('coinspira_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 86400 });
}
export function sameOrigin(request: Request) {
  return request.headers.get('origin') === new URL(request.url).origin;
}
