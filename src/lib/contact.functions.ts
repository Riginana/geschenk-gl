import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function pub() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().trim().email().max(255), locale: z.enum(["de", "en"]).default("de") }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await pub().from("newsletter_subscribers").insert({ email: data.email, locale: data.locale });
    if (error && !/duplicate key/i.test(error.message)) throw new Error(error.message);
    return { ok: true };
  });

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        name: z.string().trim().min(1).max(120),
        email: z.string().trim().email().max(255),
        phone: z.string().trim().max(40).optional().or(z.literal("")),
        message: z.string().trim().min(1).max(2000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { error } = await pub().from("contact_messages").insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      message: data.message,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
