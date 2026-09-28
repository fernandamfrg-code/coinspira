'use client';
import parse from 'html-react-parser';
import { useEffect, useRef } from 'react';
import source from '@/content/landing.json';
export default function Landing({ overrides }: { overrides: Record<string, { es: string; en: string }> }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = root.current!;
    let lang = 'es';
    const controller = new AbortController();
    function translate() {
      document.documentElement.lang = lang;
      container.querySelectorAll<HTMLElement>('.t').forEach(el => {
        const key = el.dataset.cms;
        const value = key && overrides[key] ? overrides[key][lang as 'es' | 'en'] : el.dataset[lang];
        if (value !== undefined) el.textContent = value;
      });
      container.querySelectorAll<HTMLElement>('.lang button').forEach(el => el.classList.toggle('active', el.dataset.lang === lang));
    }
    container.querySelectorAll<HTMLInputElement>('input,select,textarea').forEach((el, i) => {
      el.id ||= `field-${i}`;
      const label = el.closest('.field')?.querySelector('label');
      if (label && !label.contains(el)) label.htmlFor = el.id;
    });
    container.addEventListener('click', event => {
      const target = (event.target as Element).closest<HTMLElement>('button');
      if (!target) return;
      if (target.dataset.lang) { lang = target.dataset.lang; translate(); }
      const id = target.dataset.toggle || target.dataset.close;
      if (!id) return;
      const panel = document.getElementById(id)!;
      const open = !target.dataset.close && !panel.classList.contains('open');
      container.querySelectorAll('.form-panel').forEach(el => {
        const active = el === panel && open;
        el.classList.toggle('open', active);
        container.querySelectorAll(`[data-toggle="${el.id}"]`).forEach(btn => btn.setAttribute('aria-expanded', String(active)));
      });
    }, { signal: controller.signal });
    container.addEventListener('submit', async event => {
      const form = event.target as HTMLFormElement;
      if (!form.matches('.capture-form')) return;
      event.preventDefault();
      const status = form.querySelector<HTMLElement>('.submit-status')!;
      const button = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
      button.disabled = true;
      status.textContent = lang === 'es' ? 'Enviando...' : 'Sending...';
      const data = new FormData(form);
      const payload = Object.fromEntries([...new Set(data.keys())].map(key => [key, data.getAll(key).map(String)]));
      try {
        const response = await fetch('/api/submissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: form.closest('.form-panel')?.id, locale: lang, payload }) });
        if (!response.ok) throw new Error();
        status.className = 'submit-status success';
        status.textContent = lang === 'es' ? 'Listo. Recibimos tu información.' : 'Done. We received your information.';
        form.reset();
      } catch {
        status.className = 'submit-status error';
        status.textContent = lang === 'es' ? 'No se pudo enviar. Intenta de nuevo.' : 'Could not send. Please try again.';
      } finally { button.disabled = false; }
    }, { signal: controller.signal });
    translate();
    return () => controller.abort();
  }, [overrides]);
  return <div ref={root}>{parse(source.body)}</div>;
}
