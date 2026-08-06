import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCartCheckoutSession } from "@/lib/payments.functions";
import type { CheckoutInput } from "@/lib/checkout-schema";

type Props = {
  payload: Omit<CheckoutInput, "origin" | "environment">;
  onOrderCreated: (orderId: string) => void;
};

export function StripeEmbeddedCheckout({ payload, onOrderCreated }: Props) {
  const fetchClientSecret = async (): Promise<string> => {
    const result = await createCartCheckoutSession({
      data: { ...payload, origin: window.location.origin, environment: getStripeEnvironment() },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Zahlung konnte nicht gestartet werden.");
    onOrderCreated(result.orderId);
    return result.clientSecret;
  };

  return (
    <div id="checkout" className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
