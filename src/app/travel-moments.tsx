'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';

const wishes = [
  ['Quiero ver el mar con mi mamá, a nuestro ritmo y con su silla de ruedas.', 'I want to see the sea with my mum, at our own pace and with her wheelchair.'],
  ['Sueño con conocer Kyoto y encontrar una ruta que pueda recorrer con mi bastón.', 'I dream of visiting Kyoto and finding a route I can explore with my cane.'],
  ['Quiero conocer las historias de Oaxaca con una guía en lengua de señas.', 'I want to discover Oaxaca’s stories with a sign language guide.'],
  ['Quiero sentir la brisa de Lisboa y descubrirla con una visita audiodescrita.', 'I want to feel Lisbon’s breeze and discover it with an audio-described tour.'],
  ['Sueño con viajar en tren con mi papá, con descansos y sin prisas.', 'I dream of taking a train trip with my dad, with breaks and no rush.'],
  ['Quiero llevar a mis hijos a la playa y saber que tendremos un espacio tranquilo.', 'I want to take my children to the beach and know we’ll have a quiet space.'],
  ['Quiero llegar a la Patagonia y encontrar senderos accesibles para mí.', 'I want to reach Patagonia and find trails that are accessible to me.'],
  ['Sueño con un museo en Madrid donde también pueda conocer el arte a través del tacto.', 'I dream of a museum in Madrid where I can also discover art through touch.'],
  ['Quiero visitar Roma sabiendo dónde encontrar ayuda en mi idioma.', 'I want to visit Rome knowing where to find help in my language.'],
  ['Quiero escuchar el mar a mi manera y tener información escrita durante el viaje.', 'I want to experience the sea in my own way and have written information along the journey.'],
  ['Quiero volver al pueblo de mi abuela con transporte que se adapte a mi movilidad.', 'I want to return to my grandmother’s village with transport that suits my mobility.'],
  ['Sueño con viajar por primera vez, con tiempo para mis cuidados y para disfrutar.', 'I dream of travelling for the first time, with time for my care and for enjoyment.'],
];

function WishLetters({ hero, locale }: { hero: HTMLElement; locale: 'es' | 'en' }) {
  const field = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const [positions, setPositions] = useState([0, 1, 2, 3, 4, 5]);
  useEffect(() => {
    const indices = wishes.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setSelected(indices.slice(0, 6));
  }, []);
  useEffect(() => {
    let inView = false;
    const observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; }, { threshold: .15 });
    observer.observe(hero);
    const timer = window.setInterval(() => {
      if (!inView || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const hidden = Array.from(field.current?.querySelectorAll<HTMLElement>('.wish-whisper') ?? [])
        .map((element, i) => ({ element, i }))
        .filter(({ element }) => !element.classList.contains('wish-near'))
        .map(({ i }) => i);
      if (hidden.length < 2) return;
      const offset = Math.floor(Math.random() * hidden.length);
      const first = hidden[offset];
      const second = hidden[(offset + 1) % hidden.length];
      setSelected(current => {
        const next = [...current];
        for (const slot of [first, second]) {
          const available = wishes.map((_, i) => i).filter(i => !next.includes(i));
          next[slot] = available[Math.floor(Math.random() * available.length)];
        }
        return next;
      });
      setPositions(current => {
        const next = [...current];
        [next[first], next[second]] = [next[second], next[first]];
        return next;
      });
    }, 9000);
    return () => { observer.disconnect(); window.clearInterval(timer); };
  }, [hero]);
  useEffect(() => {
    const element = field.current;
    if (!element) return;
    const stage = hero.querySelector<HTMLElement>('.mobile-flight-space');
    const resize = new ResizeObserver(() => {
      if (!stage) return;
      const heroRect = hero.getBoundingClientRect();
      const rect = stage.getBoundingClientRect();
      element.style.setProperty('--mobile-wish-top', `${rect.top - heroRect.top}px`);
      element.style.setProperty('--mobile-wish-height', `${rect.height}px`);
    });
    if (stage) resize.observe(stage);
    resize.observe(hero);
    let frame = 0;
    let timer = 0;
    let last = { x: 0, y: 0 };
    const clear = () => element.querySelectorAll('.wish-near').forEach(el => el.classList.remove('wish-near'));
    const render = () => {
      frame = 0;
      const letters = Array.from(element.querySelectorAll<HTMLElement>('.wish-whisper'));
      const distances = letters.map(letter => {
        const rect = letter.getBoundingClientRect();
        return Math.hypot(last.x - (rect.left + rect.width / 2), last.y - (rect.top + rect.height / 2));
      });
      const nearest = Math.min(...distances);
      letters.forEach((letter, i) => letter.classList.toggle('wish-near', distances[i] === nearest && nearest < 210));
    };
    const move = (event: PointerEvent) => {
      last = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(render);
      window.clearTimeout(timer);
      if (event.pointerType === 'touch') timer = window.setTimeout(clear, 4000);
    };
    hero.addEventListener('pointermove', move, { passive: true });
    hero.addEventListener('pointerdown', move, { passive: true });
    hero.addEventListener('pointerleave', clear);
    return () => { resize.disconnect(); cancelAnimationFrame(frame); window.clearTimeout(timer); hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerdown', move); hero.removeEventListener('pointerleave', clear); };
  }, [hero]);
  return <div className="wish-whispers" ref={field} aria-hidden="true">
    {selected.map((index, i) => <p className="wish-whisper" key={i} style={{ '--wish-x': `${[12, 50, 5, 49, 14, 53][positions[i]]}%`, '--wish-y': `${[6, 20, 39, 54, 73, 88][positions[i]]}%` } as CSSProperties}>{wishes[index][locale === 'es' ? 0 : 1]}</p>)}
  </div>;
}

const flightPaths = [
  'M-30 410C120 40 250 610 450 290S700 20 1230 200',
  'M-20 140C200 450 280 80 540 380S890 560 1240 320',
];
function RouteAtlas({ section }: { section: HTMLElement; locale: 'es' | 'en' }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let frame = 0;
    let timer = 0;
    let point = { x: 50, y: 50 };
    let visible = false;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const playback = () => element.querySelectorAll<SVGSVGElement>('svg').forEach(svg => {
      if (visible && !preference.matches) svg.unpauseAnimations();
      else svg.pauseAnimations();
    });
    const render = () => { frame = 0; element.style.setProperty('--atlas-x', `${point.x}%`); element.style.setProperty('--atlas-y', `${point.y}%`); };
    const move = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      point = { x: (event.clientX - rect.left) / rect.width * 100, y: (event.clientY - rect.top) / rect.height * 100 };
      element.classList.add('atlas-hover');
      if (!frame) frame = requestAnimationFrame(render);
      window.clearTimeout(timer);
      if (event.pointerType === 'touch') timer = window.setTimeout(leave, 2000);
    };
    const leave = () => element.classList.remove('atlas-hover');
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; playback(); }, { threshold: .1 });
    observer.observe(section);
    section.addEventListener('pointermove', move, { passive: true });
    section.addEventListener('pointerdown', move, { passive: true });
    section.addEventListener('pointerleave', leave);
    preference.addEventListener('change', playback);
    playback();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.clearTimeout(timer); section.removeEventListener('pointermove', move); section.removeEventListener('pointerdown', move); section.removeEventListener('pointerleave', leave); preference.removeEventListener('change', playback); };
  }, [section]);
  const drawRoutes = (paths: string[], mobile: boolean) => <svg className={mobile ? 'atlas-route-mobile' : 'atlas-route-wide'} viewBox={mobile ? '0 0 400 600' : '0 0 1200 600'} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g className="atlas-paths">{paths.map(path => <path key={path} d={path} vectorEffect="non-scaling-stroke" />)}</g>
    {paths.map((path, i) => <g className="atlas-flying" key={path}>
      <animateMotion path={path} dur={`${38 + i * 10}s`} begin={`${-i * 17}s`} rotate="auto" repeatCount="indefinite" />
      <path d="M-11-7 13 0-11 7-5 0Z" fill="currentColor" />
    </g>)}
  </svg>;
  const routes = <>{drawRoutes(flightPaths, false)}{drawRoutes([
    'M-20 160C90 50 180 200 130 290S280 500 420 390',
    'M-20 440C100 560 360 380 280 210S220 50 420 100',
  ], true)}</>;

  return <div className="route-atlas" ref={root} aria-hidden="true"><div className="atlas-base">{routes}</div><div className="atlas-reveal">{routes}</div></div>;
}

export default function TravelMoments({ locale }: { locale: 'es' | 'en' }) {
  const [targets, setTargets] = useState<{ hero: HTMLElement; about: HTMLElement } | null>(null);
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>('.coinspira-landing .hero');
    const about = document.querySelector<HTMLElement>('.coinspira-landing .what');
    if (hero && about) setTargets({ hero, about });
  }, []);
  return targets ? <>{createPortal(<WishLetters hero={targets.hero} locale={locale} />, targets.hero)}{createPortal(<RouteAtlas section={targets.about} locale={locale} />, targets.about)}</> : null;
}
