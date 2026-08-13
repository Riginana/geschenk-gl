import { createServerFn } from "@tanstack/react-start";
import { checkoutSchema } from "@/lib/checkout-schema";
import { shippingMethodLabel, shippingZoneLabel } from "@/lib/shipping";

export type CheckoutSessionResult =
  | { orderId: string; clientSecret: string }
  | { error: string };

function itemLabel(name: string, p?: Record<string, string>): string {
  const parts: string[] = [];
  if (p?.sizeLabel) parts.push(p.sizeLabel);
  else if (p?.format) parts.push(p.format);
  if (p?.motifTitle) parts.push(`Motiv ${p.motifNumber ?? ""} ${p.motifTitle}`.trim());
  const suffix = parts.filter(Boolean).join(" · ");
  return (suffix ? `${name} (${suffix})` : name).slice(0, 250);
}

/**
 * Creates an embedded Stripe Checkout session for the current cart and stores
 * the matching order with status `pending`. All prices are recomputed on the
 * server; client-supplied amounts are never used.
 */
export const createCartCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((d) => checkoutSchema.parse(d))
  .handler(async ({ data }): Promise<CheckoutSessionResult> => {
    const { priceCart, pub } = await import("@/lib/order-pricing.server");
    const { createStripeClient, getStripeErrorMessage } = await import("@/lib/stripe.server");

    let priced: Awaited<ReturnType<typeof priceCart>>;
    try {
      priced = await priceCart(data.items, data.shippingMethod, data.shippingZone);
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Preisprüfung fehlgeschlagen" };
    }
    const { verifiedItems, subtotalCents, shippingCents, totalCents } = priced;

    const orderId = crypto.randomUUID();

    try {
      const stripe = createStripeClient(data.environment);

      const lineItems = verifiedItems.map((item) => ({
        price_data: {
          currency: "eur",
          product_data: { name: itemLabel(item.name, item.personalization) },
          unit_amount: item.unitPriceCents,
        },
        quantity: item.qty,
      }));

      if (shippingCents > 0) {
        lineItems.push({
          price_data: {
            currency: "eur",
            product_data: {
              name: `${shippingMethodLabel(data.shippingMethod, "de")} (${shippingZoneLabel(data.shippingZone, "de")})`,
            },
            unit_amount: shippingCents,
          },
          quantity: 1,
        });
      }

      const sessionParams = {
        line_items: lineItems,
        mode: "payment" as const,
        ui_mode: "embedded_page" as const,
        return_url: `${data.origin}/bestellung-bestaetigt?id=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
        customer_email: data.email,
        payment_intent_data: { description: `DigiNutz Bestellung ${orderId.slice(0, 8)}` },
        metadata: { orderId },
      };

      // PayPal runs through the same Checkout Session as cards. If the Stripe
      // account has not activated PayPal yet, fall back to cards only so the
      // checkout never breaks.
      let session;
      try {
        session = await stripe.checkout.sessions.create({
          ...sessionParams,
          payment_method_types: ["card", "paypal"],
        });
      } catch (paypalError) {
        console.warn(
          "[createCartCheckoutSession] paypal unavailable, falling back to card:",
          getStripeErrorMessage(paypalError),
        );
        session = await stripe.checkout.sessions.create(sessionParams);
      }


      const { error } = await pub()
        .from("orders")
        .insert({
          id: orderId,
          email: data.email,
          address: data.address,
          items: verifiedItems,
          shipping_method: `${data.shippingMethod}_${data.shippingZone}`,
          payment_method: "stripe",
          subtotal_cents: subtotalCents,
          shipping_cents: shippingCents,
          total_cents: totalCents,
          status: "pending",
          locale: data.locale,
          stripe_session_id: session.id,
          payment_environment: data.environment,
        });
      if (error) {
        console.error("[createCartCheckoutSession] order insert", error.message);
        return { error: "Bestellung konnte nicht angelegt werden. Bitte erneut versuchen." };
      }

      return { orderId, clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
