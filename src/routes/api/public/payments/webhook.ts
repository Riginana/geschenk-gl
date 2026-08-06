import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import type { Database } from "@/integrations/supabase/types";

let _supabase: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

async function setOrderStatus(
  sessionId: string | undefined,
  orderId: string | undefined,
  status: "paid" | "cancelled",
  env: StripeEnv,
) {
  if (!sessionId && !orderId) {
    console.error("[payments webhook] event without session or order reference");
    return;
  }
  const query = getSupabase()
    .from("orders")
    .update({ status })
    .eq("payment_environment", env);
  const { error } = sessionId
    ? await query.eq("stripe_session_id", sessionId)
    : await query.eq("id", orderId!);
  if (error) console.error("[payments webhook] order update failed:", error.message);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  const session = event.data.object;
  const orderId: string | undefined = session?.metadata?.orderId;

  switch (event.type) {
    case "checkout.session.completed":
      // Delayed-notification methods stay "unpaid" until settlement; those
      // are confirmed later via async_payment_succeeded.
      if (session.payment_status !== "unpaid") {
        await setOrderStatus(session.id, orderId, "paid", env);
      }
      break;
    case "checkout.session.async_payment_succeeded":
      await setOrderStatus(session.id, orderId, "paid", env);
      break;
    case "checkout.session.async_payment_failed":
    case "checkout.session.expired":
      await setOrderStatus(session.id, orderId, "cancelled", env);
      break;
    default:
      console.log("[payments webhook] unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("[payments webhook] invalid env query parameter:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("[payments webhook] error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
