/** Soft, fading brush trail that reveals a second illustration beneath the cursor. */
export function mountHeroReveal(hero: HTMLElement) {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const canvas = document.createElement('canvas');
  canvas.className = 'hero-liquid-reveal';
  canvas.setAttribute('aria-hidden', 'true');
  hero.querySelector('.flight-art')?.append(canvas);
  const context = canvas.getContext('2d');
  const cover = document.createElement('canvas');
  const mask = document.createElement('canvas');
  const coverContext = cover.getContext('2d');
  const maskContext = mask.getContext('2d');
  if (!context || !coverContext || !maskContext) { canvas.remove(); return () => {}; }
  let dpr = 1;
  let frame = 0;
  let previousTime = 0;
  let lastMove = 0;
  let last: { x: number; y: number } | null = null;
  let points: { x: number; y: number }[] = [];
  let generation = 0;
  let disposed = false;
  let ready = false;
  const enabled = () => !preference.matches && pointer.matches;

  function resize() {
    generation++;
    ready = false;
    points = [];
    last = null;
    cancelAnimationFrame(frame);
    frame = 0;
    if (!enabled()) { context!.clearRect(0, 0, canvas.width, canvas.height); return; }
    const rect = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = cover.width = mask.width = Math.ceil(rect.width * dpr);
    canvas.height = cover.height = mask.height = Math.ceil(rect.height * dpr);
    const routes = hero.querySelector('.flight-routes')?.cloneNode(true) as SVGElement | undefined;
    const plane = hero.querySelector('.paper-plane')?.cloneNode(true) as SVGElement | undefined;
    const planeRect = hero.querySelector('.plane-wrap')?.getBoundingClientRect();
    if (!routes || !plane || !planeRect) return;
    routes.setAttribute('width', String(rect.width));
    routes.setAttribute('height', String(rect.height));
    routes.querySelectorAll('[stroke]').forEach(el => el.setAttribute('stroke', '#779f9e'));
    plane.querySelectorAll('linearGradient').forEach((gradient, i) => {
      gradient.querySelectorAll('stop').forEach((stop, j) => stop.setAttribute('stop-color', i === 0 ? (j === 0 ? '#ecaf76' : '#b45d38') : (j === 0 ? '#92472d' : '#dc9260')));
    });
    plane.setAttribute('width', String(planeRect.width));
    plane.setAttribute('height', String(planeRect.height));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}" viewBox="0 0 ${rect.width} ${rect.height}"><defs><radialGradient id="sky"><stop stop-color="#d1e5de"/><stop offset="1" stop-color="#e6ece3"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#sky)"/>${new XMLSerializer().serializeToString(routes)}<g transform="translate(${planeRect.left - rect.left} ${planeRect.top - rect.top})"><g transform="rotate(-9 ${planeRect.width / 2} ${planeRect.height / 2})">${new XMLSerializer().serializeToString(plane)}</g></g></svg>`;
    const image = new Image();
    const version = generation;
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    image.onload = () => {
      if (!disposed && version === generation) {
        coverContext!.drawImage(image, 0, 0, cover.width, cover.height);
        ready = true;
      }
      URL.revokeObjectURL(url);
    };
    image.onerror = () => URL.revokeObjectURL(url);
    image.src = url;
  }

  function render(time: number) {
    frame = 0;
    const dt = previousTime ? Math.min((time - previousTime) / (1000 / 60), 4) : 1;
    previousTime = time;
    const idle = Math.max(0, (time - lastMove) / (1000 / 60) - 120);
    const fade = Math.min(0.5, 0.016 + idle * 0.004);
    maskContext!.globalCompositeOperation = 'destination-out';
    maskContext!.fillStyle = `rgba(0,0,0,${1 - Math.pow(1 - fade, dt)})`;
    maskContext!.fillRect(0, 0, mask.width, mask.height);
    maskContext!.globalCompositeOperation = 'source-over';
    const radius = 143 * dpr;
    for (const point of points) {
      const brush = maskContext!.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
      brush.addColorStop(0, 'rgba(255,255,255,1)');
      brush.addColorStop(0.55, 'rgba(255,255,255,.82)');
      brush.addColorStop(1, 'rgba(255,255,255,0)');
      maskContext!.fillStyle = brush;
      maskContext!.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
    }
    points = [];
    context!.globalCompositeOperation = 'source-over';
    context!.clearRect(0, 0, canvas.width, canvas.height);
    context!.drawImage(cover, 0, 0);
    context!.globalCompositeOperation = 'destination-in';
    context!.drawImage(mask, 0, 0);
    if (time - lastMove < 5500 && enabled()) frame = requestAnimationFrame(render);
    else { context!.clearRect(0, 0, canvas.width, canvas.height); maskContext!.clearRect(0, 0, mask.width, mask.height); previousTime = 0; }
  }

  function move(event: PointerEvent) {
    if (!enabled() || !ready || event.pointerType === 'touch') return;
    const rect = hero.getBoundingClientRect();
    const next = { x: (event.clientX - rect.left) * dpr, y: (event.clientY - rect.top) * dpr };
    const radius = 143 * dpr;
    if (next.x < -radius || next.y < -radius || next.x > canvas.width + radius || next.y > canvas.height + radius) { last = null; return; }
    if (last) {
      const steps = Math.min(60, Math.max(1, Math.ceil(Math.hypot(next.x - last.x, next.y - last.y) / (radius * 0.3))));
      for (let i = 1; i <= steps; i++) points.push({ x: last.x + (next.x - last.x) * i / steps, y: last.y + (next.y - last.y) * i / steps });
    } else points.push(next);
    last = next;
    lastMove = performance.now();
    if (!frame) frame = requestAnimationFrame(render);
  }
  const resetPointer = () => { last = null; };
  const observer = new ResizeObserver(resize);
  observer.observe(hero);
  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('scroll', resetPointer, { passive: true });
  window.addEventListener('blur', resetPointer);
  preference.addEventListener('change', resize);
  pointer.addEventListener('change', resize);
  return () => {
    disposed = true;
    generation++;
    cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener('pointermove', move);
    window.removeEventListener('scroll', resetPointer);
    window.removeEventListener('blur', resetPointer);
    preference.removeEventListener('change', resize);
    pointer.removeEventListener('change', resize);
    canvas.remove();
  };
}
