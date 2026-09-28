'use client';

import { useEffect, useState } from 'react';

type Entry = { id?: string; kind: string; slug: string; title: string; title_en: string; body: string; body_en: string; published: number };
type Submission = { id: string; type: string; locale: string; status: string; payload: string; created_at: string };
type Data = { texts: Record<string, { es: string; en: string }>; submissions: Submission[]; entries: Entry[] };
type Tab = 'solicitudes' | 'contenido' | 'publicaciones';
const emptyEntry: Entry = { kind: 'recurso', slug: '', title: '', title_en: '', body: '', body_en: '', published: 0 };
const navigation: { id: Tab; label: string; caption: string }[] = [
  { id: 'solicitudes', label: 'Solicitudes', caption: 'Personas y viajes' },
  { id: 'contenido', label: 'Contenido', caption: 'Textos del sitio' },
  { id: 'publicaciones', label: 'Publicaciones', caption: 'Biblioteca pública' },
];
const typeLabels: Record<string, string> = { 'client-form': 'Nuevo viaje', 'story-form': 'Historia compartida', 'research-form': 'Investigación', 'provider-form': 'Recurso recomendado' };

function Mark() { return <img className="admin-mark" src="/assets/fer-image-1.png" alt="Coinspira" />; }

function Login() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <main className="admin admin-login">
    <section className="login-story">
      <div className="login-story-top"><Mark /><span>ÁREA DE EQUIPO / 001</span></div>
      <div className="login-story-copy"><span className="admin-kicker">EXPEDIENTE ABIERTO · ACCESO INTERNO</span><h1>Las buenas<br />rutas empiezan<br />con <em>preguntas.</em></h1><p>Un lugar para escuchar, investigar y convertir cada “¿y si?” en un plan más claro.</p></div>
      <div className="login-route" aria-hidden="true"><i /><i /></div>
      <div className="login-story-foot"><span>COINSPIRA / BACK OFFICE</span><span>CONSPIRE + INSPIRE</span></div>
    </section>
    <section className="login-access">
      <div className="login-access-top"><span>ACCESO SEGURO</span><a href="/">Volver al sitio ↗</a></div>
      <form className="login-form" onSubmit={async event => {
        event.preventDefault(); setBusy(true); setError('');
        const values = Object.fromEntries(new FormData(event.currentTarget));
        try { const response = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) }); if (response.ok) location.reload(); else setError((await response.json()).error || 'No pudimos iniciar sesión.'); }
        catch { setError('Error de conexión. Intenta de nuevo.'); }
        finally { setBusy(false); }
      }}><span className="admin-kicker">01 / IDENTIFICACIÓN</span><h2>Bienvenido<br />de vuelta<span>.</span></h2><p>Entra al espacio de trabajo de Coinspira.</p><label>Correo electrónico<input name="email" type="email" autoComplete="username" placeholder="tu@correo.com" required /></label><label>Contraseña<input name="password" type="password" autoComplete="current-password" placeholder="Tu contraseña" required /></label>{error && <p className="admin-notice error" role="alert">{error}</p>}<button className="admin-primary login-submit" disabled={busy}>{busy ? 'Entrando...' : 'Entrar al admin'} <span aria-hidden="true">↗</span></button></form>
      <div className="login-access-foot"><span>SOLO PARA EL EQUIPO AUTORIZADO</span><span>© COINSPIRA</span></div>
    </section>
  </main>;
}

function Intro({ eyebrow, title, copy, aside }: { eyebrow: string; title: string; copy: string; aside?: React.ReactNode }) {
  return <div className="admin-intro"><div><span className="admin-kicker">{eyebrow}</span><h2>{title}</h2><p>{copy}</p></div>{aside}</div>;
}

export default function Admin({ authenticated }: { authenticated: boolean }) {
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<Tab>('solicitudes');
  const [notice, setNotice] = useState('');
  const [entry, setEntry] = useState<Entry>(emptyEntry);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');

  async function load() {
    try { const response = await fetch('/api/admin'); if (!response.ok) throw new Error(); setData(await response.json()); }
    catch { setNotice('No se pudo cargar el panel. Revisa tu sesión.'); }
  }
  useEffect(() => { if (authenticated) void load(); }, [authenticated]);
  async function save(body: object) {
    setBusy(true); setNotice('');
    try { const response = await fetch('/api/admin', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'No se pudo guardar.'); setNotice('Cambios guardados.'); await load(); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Error de conexión.'); }
    finally { setBusy(false); }
  }
  if (!authenticated) return <Login />;

  const pending = data?.submissions.filter(item => item.status === 'nuevo').length || 0;
  const active = navigation.find(item => item.id === tab)!;
  const matchingTexts = Object.entries(data?.texts || {}).filter(([, value]) => `${value.es} ${value.en}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return <main className="admin admin-shell">
    <aside className="admin-sidebar"><a className="sidebar-brand" href="/"><Mark /><small>ESPACIO DE TRABAJO</small></a><span className="sidebar-label">NAVEGACIÓN / 01</span><nav aria-label="Secciones del admin">{navigation.map((item, index) => <button key={item.id} className={tab === item.id ? 'active' : ''} aria-current={tab === item.id ? 'page' : undefined} onClick={() => { setTab(item.id); setNotice(''); }}><span className="nav-index">0{index + 1}</span><span><strong>{item.label}</strong><small>{item.caption}</small></span>{item.id === 'solicitudes' && pending > 0 && <b>{pending}</b>}</button>)}</nav><div className="sidebar-bottom"><button onClick={async () => { await fetch('/api/auth', { method: 'DELETE' }); location.reload(); }}>Cerrar sesión ↗</button></div></aside>
    <div className="admin-workspace"><header className="admin-topbar"><span>COINSPIRA <i>/</i> ADMIN <i>/</i> {active.label.toUpperCase()}</span><a href="/" target="_blank" rel="noreferrer">VER SITIO PÚBLICO ↗</a></header><div className="admin-body"><div className="admin-page-heading"><div><span className="admin-kicker">0{navigation.indexOf(active) + 1} / ÁREA DE TRABAJO</span><h1>{active.label}<span>.</span></h1></div><span className="page-stamp">COINSPIRA<br />ARCHIVO VIVO</span></div>
      {notice && <p className={`admin-notice ${notice === 'Cambios guardados.' ? 'success' : 'error'}`} role="status">{notice}</p>}
      {!data ? <div className="admin-empty"><span className="admin-kicker">CARGANDO EXPEDIENTE</span><p>Un momento...</p></div> : <>
        {tab === 'solicitudes' && <section><Intro eyebrow="BANDEJA DE ENTRADA" title="Personas que nos escribieron" copy="Viajes, historias, investigación y recomendaciones en un mismo lugar." aside={<span className="admin-total">{data.submissions.length} REGISTROS</span>} /><div className="admin-stats"><div><span>POR REVISAR</span><strong>{String(pending).padStart(2, '0')}</strong><small>Solicitudes nuevas</small></div><div><span>EN SEGUIMIENTO</span><strong>{String(data.submissions.filter(s => s.status === 'en revisión' || s.status === 'contactado').length).padStart(2, '0')}</strong><small>Conversaciones abiertas</small></div><div><span>TOTAL RECIBIDAS</span><strong>{String(data.submissions.length).padStart(2, '0')}</strong><small>Desde los formularios</small></div></div>{data.submissions.length === 0 ? <div className="admin-empty"><span className="admin-kicker">01 / EN ESPERA</span><h3>Todo listo para escuchar.</h3><p>Las respuestas de los formularios aparecerán aquí.</p></div> : <div className="submission-list">{data.submissions.map((submission, index) => { const fields = JSON.parse(submission.payload) as Record<string, string[]>; const primary = fields['Nombre / Name']?.[0] || fields.Name?.[0] || fields.Trip?.[0] || fields['Resource name']?.[0] || 'Sin nombre'; return <article className="submission-card" key={submission.id}><div className="submission-head"><span className="record-index">{String(index + 1).padStart(2, '0')}</span><div className="submission-identity"><span className="record-type">{typeLabels[submission.type] || submission.type} · {submission.locale.toUpperCase()}</span><h3>{primary}</h3><small>{submission.created_at}</small></div><label className="submission-status">ESTADO<select aria-label={`Estado de ${primary}`} value={submission.status} disabled={busy} onChange={e => void save({ module: 'submission', id: submission.id, status: e.target.value })}>{['nuevo', 'en revisión', 'contactado', 'cerrado'].map(value => <option key={value}>{value}</option>)}</select></label></div><details><summary>Ver respuestas <span aria-hidden="true">+</span></summary><dl>{Object.entries(fields).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value.join(', ') || 'Sin dato'}</dd></div>)}</dl></details></article>; })}</div>}</section>}
        {tab === 'contenido' && <section><Intro eyebrow="CMS / LANDING" title="Las palabras también viajan" copy="Edita los textos en español e inglés. Cada bloque se publica al guardar." aside={<span className="admin-total">{Object.keys(data.texts).length} BLOQUES</span>} /><div className="content-toolbar"><label>BUSCAR UN TEXTO<input type="search" placeholder="Escribe una palabra de la página..." value={search} onChange={e => setSearch(e.target.value)} /></label><span>{matchingTexts.length} resultados</span></div><div className="content-list">{matchingTexts.map(([id, value], index) => <form className="content-card" key={id} onSubmit={event => { event.preventDefault(); const fields = Object.fromEntries(new FormData(event.currentTarget)); void save({ module: 'content', id, ...fields }); }}><div className="content-head"><span className="record-index">{String(index + 1).padStart(2, '0')}</span><div><span className="record-type">BLOQUE EDITABLE</span><h3>{value.es.slice(0, 100)}</h3></div><span className="content-id">{id}</span></div><div className="editor-columns"><label>ESPAÑOL<textarea name="es" defaultValue={value.es} rows={4} /></label><label>ENGLISH<textarea name="en" defaultValue={value.en} rows={4} /></label></div><div className="card-actions"><button className="admin-primary" disabled={busy}>Guardar bloque ↗</button></div></form>)}</div></section>}
        {tab === 'publicaciones' && <section><Intro eyebrow="BIBLIOTECA / EDITORIAL" title="Lo que ponemos en el mundo" copy="Prepara historias, recursos y perfiles; publica solo cuando estén listos." aside={<a className="admin-text-link" href="/explorar" target="_blank" rel="noreferrer">VER BIBLIOTECA ↗</a>} /><div className="publication-grid"><div className="publication-list"><div className="list-heading"><span>PUBLICACIONES</span><span>{String(data.entries.length).padStart(2, '0')}</span></div><button className="new-entry" onClick={() => setEntry({ ...emptyEntry })}>+ Nueva publicación</button>{data.entries.map(item => <button className={`entry-row ${entry.id === item.id ? 'selected' : ''}`} key={item.id} onClick={() => setEntry(item)}><span className="record-type">{item.kind.toUpperCase()}</span><strong>{item.title}</strong><small>{item.published ? '● Publicado' : '○ Borrador'}</small></button>)}{data.entries.length === 0 && <p className="list-empty">Aún no hay publicaciones.</p>}</div><form className="publication-editor" onSubmit={event => { event.preventDefault(); void save({ module: 'entry', ...entry }); }}><div className="publication-head"><div><span className="admin-kicker">{entry.id ? 'EDITAR PUBLICACIÓN' : 'NUEVA PUBLICACIÓN'}</span><h3>{entry.title || 'Una nueva historia empieza aquí.'}</h3></div><span className="draft-badge">{entry.published ? 'PUBLICADO' : 'BORRADOR'}</span></div><div className="publication-fields"><label>TIPO<select value={entry.kind} onChange={event => setEntry({ ...entry, kind: event.target.value })}>{['historia', 'recurso', 'coinspirador'].map(kind => <option key={kind}>{kind}</option>)}</select></label><label>URL / SLUG<input required value={entry.slug} placeholder="mi-historia-de-viaje" onChange={event => setEntry({ ...entry, slug: event.target.value })} /></label>{(['title', 'title_en', 'body', 'body_en'] as const).map(key => <label key={key}>{ { title: 'TÍTULO EN ESPAÑOL', title_en: 'TITLE IN ENGLISH', body: 'CONTENIDO EN ESPAÑOL', body_en: 'CONTENT IN ENGLISH' }[key] }{key.startsWith('body') ? <textarea required={key === 'body'} rows={8} value={entry[key]} onChange={event => setEntry({ ...entry, [key]: event.target.value })} /> : <input required={key === 'title'} value={entry[key]} onChange={event => setEntry({ ...entry, [key]: event.target.value })} />}</label>)}</div><div className="publication-actions"><label className="publish-toggle"><input type="checkbox" checked={Boolean(entry.published)} onChange={event => setEntry({ ...entry, published: Number(event.target.checked) })} /><span><strong>Publicar en la biblioteca</strong><small>Desactiva para conservar como borrador.</small></span></label><button className="admin-primary" disabled={busy}>Guardar publicación ↗</button></div></form></div></section>}
      </>}
    </div></div>
  </main>;
}
