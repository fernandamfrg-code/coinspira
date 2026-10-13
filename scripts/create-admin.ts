import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db, migrate } from '../src/lib/db';
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 8 || password.length > 256) {
    throw new Error('Define ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 8 caracteres).');
  }
  await migrate();
  await db.execute({
    sql: 'INSERT INTO users (id,email,password_hash) VALUES ($1,$2,$3) ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash',
    args: [randomUUID(), email, await bcrypt.hash(password, 12)],
  });
  console.log('Administrador configurado.');
}
void main().catch(error => { console.error(error.message); process.exitCode = 1; });
