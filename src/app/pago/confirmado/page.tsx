import Link from 'next/link';

export default function PaymentConfirmed() {
  return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#faf9f4', color: '#242b27' }}><section style={{ maxWidth: 560, padding: 42, border: '1px solid #d5dfd9', borderRadius: 24, background: '#fff' }}><span style={{ color: '#39767d', letterSpacing: '.12em', fontSize: 12 }}>COINSPIRA · PAGO RECIBIDO</span><h1 style={{ fontSize: 42, lineHeight: 1.1, fontWeight: 500 }}>Gracias.</h1><p>Stripe confirmó tu pago. Nuestro equipo recibirá el aviso y dará seguimiento a tu viaje.</p><Link href="/" style={{ color: '#39767d' }}>Volver a Coinspira ↗</Link></section></main>;
}
