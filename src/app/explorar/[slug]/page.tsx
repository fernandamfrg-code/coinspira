import { redirect } from 'next/navigation';
export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { slug } = await params;
  const { lang } = await searchParams;
  redirect(`/historias/${encodeURIComponent(slug)}${lang === 'en' ? '?lang=en' : ''}`);
}
