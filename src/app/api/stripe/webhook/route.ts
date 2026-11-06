import Stripe from 'stripe';
import { db, migrate } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const apiKey = process.env.STRIPE_SECRET_KEY;
  const signature = request.headers.get('stripe-signature');
  if (!secret || !apiKey || !signature) return Response.json({ error: 'Webhook no configurado.' }, { status: 400 });
  try {
    const stripe = new Stripe(apiKey);
    const event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const checkout = event.data.object as Stripe.Checkout.Session;
      if (checkout.payment_status === 'paid') {
        const paymentId = checkout.metadata?.payment_id || checkout.client_reference_id;
        if (paymentId) {
          await migrate();
          await db.execute({ sql: "UPDATE payments SET status='pagado', method='stripe', stripe_session_id=$1, stripe_payment_intent_id=$2, reference=$1, paid_at=COALESCE(paid_at,CURRENT_TIMESTAMP), updated_at=CURRENT_TIMESTAMP WHERE id=$3 AND status!='cancelado'", args: [checkout.id, typeof checkout.payment_intent === 'string' ? checkout.payment_intent : null, paymentId] });
        }
      }
    }
    return Response.json({ received: true });
  } catch (error) {
    console.error('[POST /api/stripe/webhook]', error);
    return Response.json({ error: 'Firma de webhook inválida.' }, { status: 400 });
  }
}
