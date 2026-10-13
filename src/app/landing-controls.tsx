'use client';
import { useEffect, useState } from 'react';

const sections = [
  { id: 'top', es: 'Inicio', en: 'Home' },
  { id: 'cliente', es: 'Tu viaje', en: 'Your trip' },
  { id: 'aportar', es: 'Comunidad', en: 'Community' },
  { id: 'que-es', es: 'CoInspira', en: 'CoInspira' },
  { id: 'productos', es: 'Tu ruta', en: 'Your route' },
  { id: 'contacto', es: 'Hablemos', en: 'Let’s talk' },
];
type TextSize = 'base' | 'large' | 'xlarge';

export default function LandingControls({ locale }: { locale: 'es' | 'en' }) {
  const [active, setActive] = useState(0);
  const [size, setSize] = useState<TextSize>('base');
  useEffect(() => {
    try {
      const saved = localStorage.getItem('coinspira-text-size');
      if (saved === 'large' || saved === 'xlarge') setSize(saved);
    } catch { /* Reading preferences is optional in private browsing. */ }
    let frame = 0;
    function update() {
      frame = 0;
      const center = window.innerHeight / 2;
      let nearest = 0;
      let distance = Infinity;
      sections.forEach((section, i) => {
        const rect = document.getElementById(section.id)?.getBoundingClientRect();
        if (!rect) return;
        const delta = rect.top <= center && rect.bottom >= center ? 0 : Math.min(Math.abs(rect.top - center), Math.abs(rect.bottom - center));
        if (delta < distance) { distance = delta; nearest = i; }
      });
      setActive(nearest);
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, []);

  useEffect(() => {
    const landing = document.querySelector<HTMLElement>('.coinspira-landing');
    if (!landing) return;
    landing.dataset.textSize = size;
    landing.style.setProperty('--reading-scale', size === 'xlarge' ? '1.3' : size === 'large' ? '1.15' : '1');
  }, [size]);

  function choose(next: TextSize) {
    setSize(next);
    try { localStorage.setItem('coinspira-text-size', next); } catch { /* Keep session controls available even without storage. */ }
  }
  return <>
    <div className="reading-controls" role="group" aria-label={locale === 'es' ? 'Tamaño del texto' : 'Text size'}>
      {(['base', 'large', 'xlarge'] as const).map((value, i) => <button key={value} type="button" onClick={() => choose(value)} aria-pressed={size === value} aria-label={locale === 'es' ? ['Texto estándar', 'Texto grande', 'Texto extra grande'][i] : ['Standard text', 'Large text', 'Extra large text'][i]}>{['A', 'A+', 'A++'][i]}</button>)}
    </div>
    <nav className="section-navigation" aria-label={locale === 'es' ? 'Secciones de la página' : 'Page sections'}>
      <span className="section-count"><strong>{String(active + 1).padStart(2, '0')}</strong><span>/ 06</span></span>
      <div className="section-stops">{sections.map((section, i) => <a key={section.id} href={`#${section.id}`} aria-current={active === i ? 'location' : undefined} aria-label={`${i + 1}. ${section[locale]}`} title={section[locale]}><span className="stop-dot" /><span className="stop-label">{section[locale]}</span></a>)}</div>
      <span className="current-section">{sections[active][locale]}</span>
    </nav>
  </>;
}
