import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const html = readFileSync('index.html', 'utf8');
mkdirSync('src/content', { recursive: true });
mkdirSync('public/assets', { recursive: true });
let body = html.split('<body>')[1].split('<script>')[0];
let image = 0;
body = body.replace(/data:image\/png;base64,([A-Za-z0-9+/=]+)/g, (_, data) => {
  const path = `assets/fer-image-${++image}.png`;
  writeFileSync(`public/${path}`, Buffer.from(data, 'base64'));
  return `/${path}`;
});
let field = 0;
const texts: Record<string, { es: string; en: string }> = {};
body = body.replace(/(<[^>]+) data-es="([^"]*)" data-en="([^"]*)"/g, (_, tag, es, en) => {
  const key = `text-${++field}`;
  texts[key] = { es, en };
  return `${tag} data-cms="${key}" data-es="${es}" data-en="${en}"`;
});
writeFileSync('src/content/landing.json', JSON.stringify({ body, texts }, null, 2));
writeFileSync('src/app/landing.css', html.match(/<style>([\s\S]*?)<\/style>/)![1]);
