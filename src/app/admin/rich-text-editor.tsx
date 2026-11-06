'use client';

import { upload } from '@vercel/blob/client';
import { useEffect, useRef, useState } from 'react';

type Props = { value: string; onChange: (value: string) => void; label: string; required?: boolean };

export default function RichTextEditor({ value, onChange, label, required }: Props) {
  const editor = useRef<HTMLDivElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  useEffect(() => { if (editor.current && editor.current.innerHTML !== value) editor.current.innerHTML = value; }, [value]);
  const command = (name: string, argument?: string) => { editor.current?.focus(); document.execCommand(name, false, argument); onChange(editor.current?.innerHTML || ''); };
  const addLink = () => { const url = window.prompt('Pega la URL del enlace (https://…)'); if (url) command('createLink', url); };
  async function addImage(file?: File) {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type) || file.size > 8 * 1024 * 1024) { setUploadError('Usa JPG, PNG, WebP o GIF de hasta 8 MB.'); return; }
    setUploading(true); setUploadError('');
    try {
      const name = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const blob = await upload(`historias/${Date.now()}-${name}`, file, {
        access: 'public', handleUploadUrl: '/api/uploads/story-image',
      });
      command('insertImage', blob.url);
    } catch { setUploadError('No se pudo subir la imagen. Intenta de nuevo.'); }
    finally { setUploading(false); if (imageInput.current) imageInput.current.value = ''; }
  }
  return <div className="rich-editor" aria-label={label}>
    <div className="rich-toolbar" role="toolbar" aria-label={`Herramientas para ${label}`}>
      <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => command('bold')} title="Negritas"><strong>B</strong></button>
      <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => command('italic')} title="Itálicas"><em>I</em></button>
      <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => command('underline')} title="Subrayar"><u>U</u></button>
      <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => command('formatBlock', 'h2')} title="Título">H2</button>
      <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => command('formatBlock', 'blockquote')} title="Cita">❝</button>
      <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => command('insertUnorderedList')} title="Lista">•≡</button>
      <button type="button" onMouseDown={event => event.preventDefault()} onClick={addLink} title="Insertar enlace">↗</button>
      <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => imageInput.current?.click()} title="Subir imagen" disabled={uploading}>{uploading ? '…' : '▧'}</button>
      <label title="Tamaño de texto">Aa<select defaultValue="3" onChange={event => command('fontSize', event.target.value)}><option value="2">Pequeño</option><option value="3">Normal</option><option value="5">Grande</option><option value="6">Muy grande</option></select></label>
      <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => command('removeFormat')} title="Quitar formato">×</button>
    </div>
    <div ref={editor} className="rich-editor-canvas" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label={label} data-placeholder="Escribe una historia. Selecciona texto para darle formato." onInput={event => onChange(event.currentTarget.innerHTML)} onBlur={event => onChange(event.currentTarget.innerHTML)} />
    <input ref={imageInput} className="rich-image-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={event => void addImage(event.target.files?.[0])} />
    {uploadError && <p className="rich-upload-error" role="alert">{uploadError}</p>}
    {required && <input className="rich-required" required value={value.replace(/<[^>]*>/g, '').trim()} onChange={() => {}} tabIndex={-1} aria-hidden="true" />}
  </div>;
}
