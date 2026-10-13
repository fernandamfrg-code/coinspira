'use client';

import { useEffect, useState } from 'react';

type Tab = 'crm' | 'calendario' | 'pagos';
type Contact = { id: string; submission_id: string | null; name: string; email: string; phone: string; destination: string; stage: string; notes: string; follow_up_at: string; created_at: string };
type Appointment = { id: string; contact_id: string; title: string; starts_at: string; duration_min: number; status: string; notes: string };
type Payment = { id: string; contact_id: string; concept: string; amount_cents: number; method: string; status: string; reference: string; notes: string; paid_at: string | null; created_at: string };
type OperationsData = { contacts: Contact[]; appointments: Appointment[]; payments: Payment[] };

const stages = ['nuevo', 'calificando', 'sesión', 'investigando', 'entregado', 'cerrado'];
const appointmentStatuses = ['tentativa', 'confirmada', 'completada', 'cancelada'];
const paymentStatuses = ['pendiente', 'pagado', 'cancelado'];
const paymentConcepts = ['anticipo', 'saldo', 'honorarios', 'otro'];
const paymentMethods = ['transferencia', 'tarjeta externa', 'efectivo', 'otro'];
const weekdays = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const money = (cents: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100);
const today = () => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
};
const blankContact = (): Contact => ({ id: '', submission_id: null, name: '', email: '', phone: '', destination: '', stage: 'nuevo', notes: '', follow_up_at: '', created_at: '' });
const blankAppointment = (date: string): Appointment => ({ id: '', contact_id: '', title: 'Sesión de planeación', starts_at: `${date}T10:00`, duration_min: 30, status: 'tentativa', notes: '' });
const blankPayment = () => ({ contact_id: '', concept: 'anticipo', amount: '', method: 'transferencia', status: 'pendiente', reference: '', notes: '' });

function Header({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <div className="admin-intro"><div><span className="admin-kicker">{eyebrow}</span><h2>{title}</h2><p>{copy}</p></div></div>;
}

function Field({ title, children }: { title: string; children: React.ReactNode }) {
  return <label className="ops-field">{title}{children}</label>;
}

export default function Operations({ tab }: { tab: Tab }) {
  const [data, setData] = useState<OperationsData | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [contact, setContact] = useState<Contact>(blankContact);
  const [appointment, setAppointment] = useState<Appointment>(() => blankAppointment(today()));
  const [payment, setPayment] = useState(blankPayment);
  const [selectedDay, setSelectedDay] = useState(today);
  const [month, setMonth] = useState(() => today().slice(0, 7));
  const [contactSearch, setContactSearch] = useState('');

  async function load() {
    try {
      const response = await fetch('/api/admin/operations');
      if (!response.ok) throw new Error();
      setData(await response.json());
      setError('');
    } catch { setError('No pudimos cargar la información. Intenta recargar el panel.'); }
  }
  useEffect(() => { void load(); }, []);

  async function save(method: 'POST' | 'PATCH', body: Record<string, unknown>, done: (id?: string) => void) {
    setBusy(true); setError(''); setSuccess('');
    try {
      const response = await fetch('/api/admin/operations', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo guardar.');
      done(result.id);
      setSuccess('Cambios guardados.');
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Error de conexión.'); }
    finally { setBusy(false); }
  }

  const contacts = data?.contacts || [];
  const nameFor = (id: string) => contacts.find(item => item.id === id)?.name || 'Contacto no disponible';
  const filteredContacts = contacts.filter(item => `${item.name} ${item.email} ${item.destination}`.toLocaleLowerCase().includes(contactSearch.toLocaleLowerCase()));

  return <section className="operations">
    {error && <p className="admin-notice error" role="alert">{error}</p>}
    {success && <p className="admin-notice success" role="status">{success}</p>}
    {!data ? <div className="admin-empty"><p>Cargando información...</p></div> : <>
      {tab === 'crm' && <>
        <Header eyebrow="CRM / VIAJES" title="Cada viaje, con seguimiento" copy="Las solicitudes de viaje llegan aquí automáticamente. También puedes crear contactos manualmente." />
        <div className="ops-metrics"><div><span>CONTACTOS</span><strong>{contacts.length.toString().padStart(2, '0')}</strong></div><div><span>POR CALIFICAR</span><strong>{contacts.filter(item => item.stage === 'nuevo' || item.stage === 'calificando').length.toString().padStart(2, '0')}</strong></div><div><span>PRÓXIMOS SEGUIMIENTOS</span><strong>{contacts.filter(item => item.follow_up_at && item.follow_up_at >= today() && item.stage !== 'cerrado').length.toString().padStart(2, '0')}</strong></div></div>
        <div className="ops-split">
          <div className="ops-list"><div className="ops-list-title">CONTACTOS <span>{contacts.length}</span></div><input type="search" aria-label="Buscar contacto" placeholder="Buscar nombre, correo o destino..." value={contactSearch} onChange={event => setContactSearch(event.target.value)} /><button className="ops-add" onClick={() => setContact(blankContact())}>+ Nuevo contacto</button>{filteredContacts.map(item => <button key={item.id} className={`ops-list-item ${contact.id === item.id ? 'selected' : ''}`} onClick={() => setContact(item)}><span className="record-type">{item.stage.toUpperCase()}</span><strong>{item.name}</strong><small>{item.destination || item.email || 'Sin destino todavía'}</small></button>)}{filteredContacts.length === 0 && <p className="ops-empty">No hay contactos que coincidan.</p>}</div>
          <form className="ops-editor" onSubmit={event => { event.preventDefault(); void save(contact.id ? 'PATCH' : 'POST', { module: 'contact', ...contact }, id => setContact({ ...contact, id: id || contact.id })); }}><span className="admin-kicker">{contact.id ? 'FICHA DE CONTACTO' : 'NUEVO CONTACTO'}</span><h3>{contact.name || 'Abrir una ficha'}</h3>{contact.submission_id && <p className="ops-linked">Creado desde el formulario de viaje.</p>}<div className="ops-fields"><Field title="NOMBRE *"><input required value={contact.name} onChange={event => setContact({ ...contact, name: event.target.value })} /></Field><Field title="ETAPA"><select value={contact.stage} onChange={event => setContact({ ...contact, stage: event.target.value })}>{stages.map(stage => <option key={stage}>{stage}</option>)}</select></Field><Field title="CORREO"><input type="email" value={contact.email} onChange={event => setContact({ ...contact, email: event.target.value })} /></Field><Field title="TELÉFONO"><input type="tel" value={contact.phone} onChange={event => setContact({ ...contact, phone: event.target.value })} /></Field><Field title="DESTINO / IDEA"><input value={contact.destination} onChange={event => setContact({ ...contact, destination: event.target.value })} /></Field><Field title="PRÓXIMO SEGUIMIENTO"><input type="date" value={contact.follow_up_at} onChange={event => setContact({ ...contact, follow_up_at: event.target.value })} /></Field><Field title="NOTAS INTERNAS"><textarea rows={6} value={contact.notes} onChange={event => setContact({ ...contact, notes: event.target.value })} /></Field></div><div className="ops-actions"><button className="admin-primary" disabled={busy}>{busy ? 'Guardando...' : 'Guardar contacto ↗'}</button></div></form>
        </div>
      </>}

      {tab === 'calendario' && <>
        <Header eyebrow="AGENDA / SESIONES" title="El plan también necesita tiempo" copy="Agenda y actualiza citas del equipo. Horarios expresados en hora de Ciudad de México." />
        <div className="calendar-layout"><div className="calendar-board"><div className="calendar-header"><h3>{new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T12:00:00Z`))}</h3><div><button aria-label="Mes anterior" onClick={() => setMonth(shiftMonth(month, -1))}>←</button><button aria-label="Mes siguiente" onClick={() => setMonth(shiftMonth(month, 1))}>→</button></div></div><div className="calendar-grid">{weekdays.map(day => <span className="weekday" key={day}>{day}</span>)}{monthDays(month).map((day, index) => day ? <button key={index} className={`calendar-day ${day === selectedDay ? 'selected' : ''} ${day === today() ? 'today' : ''}`} onClick={() => { setSelectedDay(day); setAppointment(blankAppointment(day)); }}><strong>{Number(day.slice(-2))}</strong><span>{data.appointments.filter(item => item.starts_at.startsWith(day) && item.status !== 'cancelada').length || ''}</span></button> : <span className="calendar-gap" key={index} />)}</div></div><div className="calendar-aside"><div className="ops-list-title">{selectedDay} <span>{data.appointments.filter(item => item.starts_at.startsWith(selectedDay)).length} CITAS</span></div>{data.appointments.filter(item => item.starts_at.startsWith(selectedDay)).map(item => <button className={`ops-list-item ${appointment.id === item.id ? 'selected' : ''}`} key={item.id} onClick={() => setAppointment(item)}><span className="record-type">{item.starts_at.slice(11)} · {item.status.toUpperCase()}</span><strong>{item.title}</strong><small>{nameFor(item.contact_id)}</small></button>)}<button className="ops-add" onClick={() => setAppointment(blankAppointment(selectedDay))}>+ Nueva cita para este día</button></div></div>
        <form className="ops-editor calendar-editor" onSubmit={event => { event.preventDefault(); void save(appointment.id ? 'PATCH' : 'POST', { module: 'appointment', ...appointment }, id => setAppointment({ ...appointment, id: id || appointment.id })); }}><span className="admin-kicker">{appointment.id ? 'EDITAR CITA' : 'NUEVA CITA'}</span><h3>{appointment.title || 'Programar una cita'}</h3>{!contacts.length && <p className="ops-linked">Primero crea un contacto en CRM para asociar la cita.</p>}<div className="ops-fields"><Field title="CONTACTO *"><select required value={appointment.contact_id} onChange={event => setAppointment({ ...appointment, contact_id: event.target.value })}><option value="">Selecciona un contacto</option>{contacts.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></Field><Field title="TÍTULO *"><input required value={appointment.title} onChange={event => setAppointment({ ...appointment, title: event.target.value })} /></Field><Field title="FECHA Y HORA CDMX *"><input type="datetime-local" required value={appointment.starts_at} onChange={event => setAppointment({ ...appointment, starts_at: event.target.value })} /></Field><Field title="DURACIÓN"><select value={appointment.duration_min} onChange={event => setAppointment({ ...appointment, duration_min: Number(event.target.value) })}>{[15, 30, 45, 60, 90, 120].map(minutes => <option key={minutes} value={minutes}>{minutes} min</option>)}</select></Field><Field title="ESTADO"><select value={appointment.status} onChange={event => setAppointment({ ...appointment, status: event.target.value })}>{appointmentStatuses.map(status => <option key={status}>{status}</option>)}</select></Field><Field title="NOTAS"><textarea rows={4} value={appointment.notes} onChange={event => setAppointment({ ...appointment, notes: event.target.value })} /></Field></div><div className="ops-actions"><button className="admin-primary" disabled={busy || !contacts.length}>{busy ? 'Guardando...' : 'Guardar cita ↗'}</button></div></form>
      </>}

      {tab === 'pagos' && <>
        <Header eyebrow="PAGOS / CONTROL INTERNO" title="Anticipos y saldos, claros" copy="Registra pagos y referencias de Periplo. Este panel no procesa cobros ni confirma transferencias automáticamente." />
        <div className="ops-metrics"><div><span>REGISTRADO COMO PAGADO</span><strong>{money(data.payments.filter(item => item.status === 'pagado').reduce((sum, item) => sum + item.amount_cents, 0))}</strong></div><div><span>PENDIENTE DE COBRO</span><strong>{money(data.payments.filter(item => item.status === 'pendiente').reduce((sum, item) => sum + item.amount_cents, 0))}</strong></div><div><span>MOVIMIENTOS</span><strong>{String(data.payments.length).padStart(2, '0')}</strong></div></div>
        <div className="payment-layout"><form className="ops-editor" onSubmit={event => { event.preventDefault(); void save('POST', { module: 'payment', ...payment }, () => setPayment(blankPayment())); }}><span className="admin-kicker">NUEVO REGISTRO</span><h3>Registrar un movimiento</h3>{!contacts.length && <p className="ops-linked">Primero crea un contacto en CRM para asociar el pago.</p>}<div className="ops-fields"><Field title="CONTACTO *"><select required value={payment.contact_id} onChange={event => setPayment({ ...payment, contact_id: event.target.value })}><option value="">Selecciona un contacto</option>{contacts.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></Field><Field title="CONCEPTO"><select value={payment.concept} onChange={event => setPayment({ ...payment, concept: event.target.value })}>{paymentConcepts.map(concept => <option key={concept}>{concept}</option>)}</select></Field><Field title="IMPORTE MXN *"><input required inputMode="decimal" placeholder="1500.00" value={payment.amount} onChange={event => setPayment({ ...payment, amount: event.target.value })} /></Field><Field title="MÉTODO"><select value={payment.method} onChange={event => setPayment({ ...payment, method: event.target.value })}>{paymentMethods.map(method => <option key={method}>{method}</option>)}</select></Field><Field title="ESTADO"><select value={payment.status} onChange={event => setPayment({ ...payment, status: event.target.value })}>{paymentStatuses.map(status => <option key={status}>{status}</option>)}</select></Field><Field title="REFERENCIA"><input value={payment.reference} onChange={event => setPayment({ ...payment, reference: event.target.value })} placeholder="Folio o referencia externa" /></Field><Field title="NOTAS"><textarea rows={4} value={payment.notes} onChange={event => setPayment({ ...payment, notes: event.target.value })} /></Field></div><div className="ops-actions"><button className="admin-primary" disabled={busy || !contacts.length}>{busy ? 'Guardando...' : 'Registrar pago ↗'}</button></div></form><div className="payment-records"><div className="ops-list-title">MOVIMIENTOS <span>{data.payments.length}</span></div>{!data.payments.length && <p className="ops-empty">Aún no hay pagos registrados.</p>}{data.payments.map(item => <article className="payment-row" key={item.id}><div><span className="record-type">{item.concept.toUpperCase()} · {item.method.toUpperCase()}</span><h3>{nameFor(item.contact_id)}</h3><small>{item.reference || item.created_at}</small></div><div className="payment-right"><strong>{money(item.amount_cents)}</strong><label>ESTADO<select aria-label={`Estado del pago de ${nameFor(item.contact_id)}`} value={item.status} disabled={busy || item.status === 'pagado'} onChange={event => void save('PATCH', { module: 'payment', id: item.id, status: event.target.value }, () => {})}>{paymentStatuses.map(status => <option key={status}>{status}</option>)}</select></label></div></article>)}</div></div>
      </>}
    </>}
  </section>;
}

function shiftMonth(month: string, amount: number) {
  const [year, index] = month.split('-').map(Number);
  return new Date(Date.UTC(year, index - 1 + amount, 1)).toISOString().slice(0, 7);
}

function monthDays(month: string) {
  const [year, index] = month.split('-').map(Number);
  const offset = (new Date(Date.UTC(year, index - 1, 1)).getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, index, 0)).getUTCDate();
  return [...Array(offset).fill(''), ...Array.from({ length: count }, (_, day) => `${month}-${String(day + 1).padStart(2, '0')}`)] as string[];
}
