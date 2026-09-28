import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Coinspira', description: 'Investigamos, preparamos y coordinamos viajes que necesitan más planeación.' };
export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="es"><head><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" /></head><body style={{ margin: 0 }}>{children}</body></html>; }
