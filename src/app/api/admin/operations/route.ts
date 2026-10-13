import { randomUUID } from 'node:crypto';
import { session, sameOrigin } from '@/lib/auth';
import { db, migrate } from '@/lib/db';

const stages = ['nuevo', 'calificando', 'sesión', 'investigando', 'entregado', 'cerrado'];
const appointmentStatuses = ['tentativa', 'confirmada', 'completada', 'cancelada'];
const paymentStatuses = ['pendiente', 'pagado', 'cancelado'];
const paymentConcepts = ['anticipo', 'saldo', 'honorarios', 'otro'];
const paymentMethods = ['transferencia', 'tarjeta externa', 'efectivo', 'otro'];

class InputError extends Error {}

function field(value: unknown, max = 200) {
  if (typeof value !== 'string' || value.trim().length > max) throw new InputError('Revisa los campos del formulario.');
  return value.trim();
}

function required(value: unknown, max = 200) {
  const text = field(value, max);
  if (!text) throw new InputError('Completa los campos obligatorios.');
  return text;
}

function choice(value: unknown, options: string[]) {
  if (typeof value !== 'string' || !options.includes(value)) throw new InputError('Selecciona una opción válida.');
  return value;
}

function dateOnly(value: unknown) {
  const date = field(value, 10);
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T12:00:00Z`)) || new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date)) throw new InputError('Fecha de seguimiento inválida.');
  return date;
}

function appointmentTime(value: unknown) {
  const time = required(value, 16);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(time) || !Number.isFinite(Date.parse(`${time}:00Z`)) || new Date(`${time}:00Z`).toISOString().slice(0, 16) !== time) throw new InputError('Fecha u hora inválida.');
  return time;
}

function cents(value: unknown) {
  if (typeof value !== 'string' || !/^\d{1,7}(\.\d{1,2})?$/.test(value)) throw new InputError('Ingresa un importe válido en MXN.');
  const [whole, decimals = ''] = value.split('.');
  const result = Number(whole) * 100 + Number(decimals.padEnd(2, '0'));
  if (result < 1 || result > 999999999) throw new InputError('Ingresa un importe válido en MXN.');
  return result;
}

async function readBody(request: Request) {
  const raw = await request.text();
  if (raw.length > 12000) throw new InputError('El formulario es demasiado largo.');
  try { return JSON.parse(raw) as Record<string, unknown>; }
  catch { throw new InputError('Datos inválidos.'); }
}

async function contactExists(id: string) {
  const result = await db.execute({ sql: 'SELECT id FROM crm_contacts WHERE id = ?', args: [id] });
  if (!result.rows.length) throw new InputError('Selecciona un contacto existente.');
}

async function syncTravelRequests() {
  const missing = await db.execute("SELECT s.id, s.payload FROM submissions s WHERE s.type = 'client-form' AND NOT EXISTS (SELECT 1 FROM crm_contacts c WHERE c.submission_id = s.id)");
  if (!missing.rows.length) return;
  await db.batch(missing.rows.map(row => {
    const payload = JSON.parse(String(row.payload)) as Record<string, string[]>;
    return {
      sql: "INSERT OR IGNORE INTO crm_contacts (id, submission_id, name, email, phone, destination) VALUES (?, ?, ?, ?, ?, ?)",
      args: [randomUUID(), String(row.id), payload['Nombre / Name']?.[0] || 'Sin nombre', payload.Email?.[0] || '', payload['WhatsApp / Phone']?.[0] || '', payload['Destination / Trip idea']?.[0] || ''],
    };
  }), 'write');
}

export async function GET() {
  if (!await session()) return Response.json({ error: 'No autorizado.' }, { status: 401 });
  try {
    await migrate();
    await syncTravelRequests();
    const [contacts, appointments, payments] = await Promise.all([
      db.execute('SELECT * FROM crm_contacts ORDER BY updated_at DESC'),
      db.execute('SELECT * FROM appointments ORDER BY starts_at ASC'),
      db.execute('SELECT * FROM payments ORDER BY created_at DESC'),
    ]);
    return Response.json({ contacts: contacts.rows, appointments: appointments.rows, payments: payments.rows });
  } catch (error) {
    console.error('[GET /api/admin/operations]', error);
    return Response.json({ error: 'No se pudieron cargar los datos.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request) || !await session()) return Response.json({ error: 'No autorizado.' }, { status: 403 });
  try {
    await migrate();
    const body = await readBody(request);
    const id = randomUUID();
    if (body.module === 'contact') {
      const name = required(body.name);
      const email = field(body.email);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new InputError('Correo inválido.');
      await db.execute({ sql: 'INSERT INTO crm_contacts (id,name,email,phone,destination,stage,notes,follow_up_at) VALUES (?,?,?,?,?,?,?,?)', args: [id, name, email, field(body.phone, 60), field(body.destination), choice(body.stage, stages), field(body.notes, 6000), dateOnly(body.follow_up_at)] });
    } else if (body.module === 'appointment') {
      const contactId = required(body.contact_id, 50);
      await contactExists(contactId);
      const duration = Number(body.duration_min);
      if (!Number.isInteger(duration) || duration < 15 || duration > 480) throw new InputError('Duración inválida.');
      await db.execute({ sql: 'INSERT INTO appointments (id,contact_id,title,starts_at,duration_min,status,notes) VALUES (?,?,?,?,?,?,?)', args: [id, contactId, required(body.title), appointmentTime(body.starts_at), duration, choice(body.status, appointmentStatuses), field(body.notes, 3000)] });
    } else if (body.module === 'payment') {
      const contactId = required(body.contact_id, 50);
      await contactExists(contactId);
      const status = choice(body.status, paymentStatuses);
      await db.execute({ sql: 'INSERT INTO payments (id,contact_id,concept,amount_cents,method,status,reference,notes,paid_at) VALUES (?,?,?,?,?,?,?,?,?)', args: [id, contactId, choice(body.concept, paymentConcepts), cents(body.amount), choice(body.method, paymentMethods), status, field(body.reference, 150), field(body.notes, 3000), status === 'pagado' ? new Date().toISOString() : null] });
    } else throw new InputError('Módulo inválido.');
    return Response.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    if (error instanceof InputError) return Response.json({ error: error.message }, { status: 400 });
    console.error('[POST /api/admin/operations]', error);
    return Response.json({ error: 'No se pudo guardar.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request) || !await session()) return Response.json({ error: 'No autorizado.' }, { status: 403 });
  try {
    await migrate();
    const body = await readBody(request);
    const id = required(body.id, 50);
    if (body.module === 'contact') {
      const name = required(body.name);
      const email = field(body.email);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new InputError('Correo inválido.');
      const result = await db.execute({ sql: 'UPDATE crm_contacts SET name=?,email=?,phone=?,destination=?,stage=?,notes=?,follow_up_at=?,updated_at=CURRENT_TIMESTAMP WHERE id=?', args: [name, email, field(body.phone, 60), field(body.destination), choice(body.stage, stages), field(body.notes, 6000), dateOnly(body.follow_up_at), id] });
      if (!result.rowsAffected) throw new InputError('Contacto no encontrado.');
    } else if (body.module === 'appointment') {
      const contactId = required(body.contact_id, 50);
      await contactExists(contactId);
      const duration = Number(body.duration_min);
      if (!Number.isInteger(duration) || duration < 15 || duration > 480) throw new InputError('Duración inválida.');
      const result = await db.execute({ sql: 'UPDATE appointments SET contact_id=?,title=?,starts_at=?,duration_min=?,status=?,notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?', args: [contactId, required(body.title), appointmentTime(body.starts_at), duration, choice(body.status, appointmentStatuses), field(body.notes, 3000), id] });
      if (!result.rowsAffected) throw new InputError('Cita no encontrada.');
    } else if (body.module === 'payment') {
      const status = choice(body.status, paymentStatuses);
      const existing = await db.execute({ sql: 'SELECT status FROM payments WHERE id=?', args: [id] });
      if (!existing.rows.length) throw new InputError('Pago no encontrado.');
      if (existing.rows[0].status === 'pagado' && status !== 'pagado') throw new InputError('Un pago registrado como pagado no se puede deshacer desde este panel.');
      const result = await db.execute({ sql: "UPDATE payments SET status=?, paid_at=CASE WHEN ?='pagado' AND paid_at IS NULL THEN CURRENT_TIMESTAMP ELSE paid_at END, updated_at=CURRENT_TIMESTAMP WHERE id=? AND (status!='pagado' OR ?='pagado')", args: [status, status, id, status] });
      if (!result.rowsAffected) throw new InputError('Este pago ya fue marcado como pagado. Recarga el panel.');
    } else throw new InputError('Módulo inválido.');
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof InputError) return Response.json({ error: error.message }, { status: 400 });
    console.error('[PATCH /api/admin/operations]', error);
    return Response.json({ error: 'No se pudo guardar.' }, { status: 500 });
  }
}
