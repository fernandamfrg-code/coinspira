'use client';
import parse from 'html-react-parser';
import { useEffect, useRef, useState } from 'react';
import source from '@/content/landing.json';
import LandingControls from './landing-controls';
import TravelMoments from './travel-moments';
import { mountHeroReveal } from './hero-reveal';
export default function Landing({ overrides }: { overrides: Record<string, { es: string; en: string }> }) {
  const [locale, setLocale] = useState<'es' | 'en'>('es');
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = root.current!;
    const hero = container.querySelector<HTMLElement>('.hero');
    const disposeHeroReveal = hero ? mountHeroReveal(hero) : undefined;
    let lang = 'es';
    const controller = new AbortController();
    function translate() {
      document.documentElement.lang = lang;
      setLocale(lang as 'es' | 'en');
      container.querySelectorAll<HTMLElement>('.t').forEach(el => {
        const key = el.dataset.cms;
        const value = key && overrides[key] ? overrides[key][lang as 'es' | 'en'] : el.dataset[lang];
        if (value !== undefined) el.textContent = value;
      });
      container.querySelectorAll<HTMLAnchorElement>('a[data-cms="text-106"]').forEach(link => { link.href = lang === 'en' ? '/historias?lang=en' : '/historias'; });
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
      if (open) { panel.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); panel.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true }); }
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
    container.querySelectorAll('[data-toggle]').forEach(button => button.setAttribute('aria-expanded', 'false'));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
    }, { threshold: 0.08 });
    container.querySelectorAll('.section-title, .choice-card, .actor, .what-grid, .product, .footer-cta').forEach((el, i) => {
      el.classList.add('reveal');
      (el as HTMLElement).style.transitionDelay = `${(i % 3) * 70}ms`;
      observer.observe(el);
    });
    container.classList.add('motion-ready');
    translate();
    return () => { controller.abort(); observer.disconnect(); disposeHeroReveal?.(); };
  }, [overrides]);
  return <div ref={root} className="coinspira-landing"><LandingControls locale={locale} /><TravelMoments locale={locale} />{parse(source.body)}</div>;
}
