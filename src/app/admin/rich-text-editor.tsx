'use client';

import { useEffect, useRef } from 'react';

type Props = { value: string; onChange: (value: string) => void; label: string; required?: boolean };

export default function RichTextEditor({ value, onChange, label, required }: Props) {
  const editor = useRef<HTMLDivElement>(null);
  useEffect(() => { if (editor.current && editor.current.innerHTML !== value) editor.current.innerHTML = value; }, [value]);
  const command = (name: string, argument?: string) => { editor.current?.focus(); document.execCommand(name, false, argument); onChange(editor.current?.innerHTML || ''); };
  const addLink = () => { const url = window.prompt('Pega la URL del enlace (https://…)'); if (url) command('createLink', url); };
  const addImage = () => { const url = window.prompt('Pega la URL pública de la imagen (https://…)'); if (url) command('insertImage', url); };
  return <div className="rich-editor" aria-label={label}>
    <div className="rich-toolbar" role="toolbar" aria-label={`Herramientas para ${label}`}>
      <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => command('bold')} title="Negritas"><strong>B</strong></button>
      <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => command('italic')} title="Itálicas"><em>I</em></button>
      <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => command('underline')} title="Subrayar"><u>U</u></button>
      <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => command('formatBlock', 'h2')} title="Título">H2</button>
      <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => command('formatBlock', 'blockquote')} title="Cita">❝</button>
      <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => command('insertUnorderedList')} title="Lista">•≡</button>
      <button type="button" onMouseDown={event => event.preventDefault()} onClick={addLink} title="Insertar enlace">↗</button>
      <button type="button" onMouseDown={event => event.preventDefault()} onClick={addImage} title="Insertar imagen">▧</button>
      <label title="Tamaño de texto">Aa<select defaultValue="3" onChange={event => command('fontSize', event.target.value)}><option value="2">Pequeño</option><option value="3">Normal</option><option value="5">Grande</option><option value="6">Muy grande</option></select></label>
      <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => command('removeFormat')} title="Quitar formato">×</button>
    </div>
    <div ref={editor} className="rich-editor-canvas" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label={label} data-placeholder="Escribe una historia. Selecciona texto para darle formato." onInput={event => onChange(event.currentTarget.innerHTML)} onBlur={event => onChange(event.currentTarget.innerHTML)} />
    {required && <input className="rich-required" required value={value.replace(/<[^>]*>/g, '').trim()} onChange={() => {}} tabIndex={-1} aria-hidden="true" />}
  </div>;
}
