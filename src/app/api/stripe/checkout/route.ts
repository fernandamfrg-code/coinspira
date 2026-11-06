import Stripe from 'stripe';
import { db, migrate } from '@/lib/db';
import { sameOrigin, session } from '@/lib/auth';

export const runtime = 'nodejs';

function appUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (configured) return configured;
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!sameOrigin(request) || !await session()) return Response.json({ error: 'No autorizado.' }, { status: 403 });
  if (!process.env.STRIPE_SECRET_KEY) return Response.json({ error: 'Stripe no está configurado. Agrega STRIPE_SECRET_KEY al entorno.' }, { status: 503 });
  try {
    const { paymentId } = await request.json() as { paymentId?: string };
    if (!paymentId || typeof paymentId !== 'string' || paymentId.length > 60) return Response.json({ error: 'Pago inválido.' }, { status: 400 });
    await migrate();
    const result = await db.execute({ sql: 'SELECT p.*, c.name, c.email FROM payments p JOIN crm_contacts c ON c.id=p.contact_id WHERE p.id=$1', args: [paymentId] });
    const payment = result.rows[0];
    if (!payment) return Response.json({ error: 'Pago no encontrado.' }, { status: 404 });
    if (payment.status === 'pagado' || payment.status === 'cancelado') return Response.json({ error: 'Este pago ya no está disponible para cobro.' }, { status: 400 });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const base = appUrl(request);
    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: paymentId,
      customer_email: String(payment.email || '') || undefined,
      metadata: { payment_id: paymentId },
      line_items: [{ quantity: 1, price_data: { currency: String(payment.currency || 'MXN').toLowerCase(), unit_amount: Number(payment.amount_cents), product_data: { name: `Coinspira · ${String(payment.concept)}`, description: String(payment.name) } } }],
      success_url: `${base}/pago/confirmado?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/admin?checkout=cancelled`,
    });
    await db.execute({ sql: 'UPDATE payments SET method=$1, stripe_session_id=$2, reference=$3, updated_at=CURRENT_TIMESTAMP WHERE id=$4', args: ['stripe', checkout.id, checkout.id, paymentId] });
    return Response.json({ url: checkout.url });
  } catch (error) {
    console.error('[POST /api/stripe/checkout]', error);
    return Response.json({ error: 'No se pudo crear la página de pago de Stripe.' }, { status: 500 });
  }
}
