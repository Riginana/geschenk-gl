import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Motif, SizeVariant } from "@/lib/product-config";

async function requireAdmin(ctx: { supabase: { rpc: Function }; userId: string }) {
  const { data, error } = await (ctx.supabase as any).rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin only");
}

const SIZE_COLS = "id,product_id,label,dimensions,price_cents,is_active,is_default,sort_order";
const MOTIF_COLS =
  "id,product_id,number,title,description,predefined_text,preview_image_url,allows_custom_text,requires_custom_text,custom_text_max_length,is_active,sort_order,price_delta_cents";

// ---------------- Size variants ----------------

export const adminListProductConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ product_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ sizes: SizeVariant[]; motifs: Motif[] }> => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: sizes, error: e1 }, { data: motifs, error: e2 }] = await Promise.all([
      supabaseAdmin.from("product_size_variants").select(SIZE_COLS).eq("product_id", data.product_id),
      supabaseAdmin.from("product_motifs").select(MOTIF_COLS).eq("product_id", data.product_id),
    ]);
    if (e1 || e2) throw new Error(e1?.message || e2?.message || "Laden fehlgeschlagen");
    return { sizes: (sizes ?? []) as SizeVariant[], motifs: (motifs ?? []) as Motif[] };
  });

const sizeFields = {
  label: z.string().trim().min(1).max(40),
  dimensions: z.string().trim().max(120),
  price_cents: z.number().int().min(0).max(1000000),
  is_active: z.boolean(),
  is_default: z.boolean(),
  sort_order: z.number().int().min(0).max(999),
};

export const adminUpsertSizeVariant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid().optional(),
        product_id: z.string().uuid(),
        ...sizeFields,
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...values } = data;
    let rowId = id;
    if (id) {
      const { error } = await supabaseAdmin.from("product_size_variants").update(values).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { data: row, error } = await supabaseAdmin
        .from("product_size_variants")
        .insert(values)
        .select("id")
        .single();
      if (error || !row) throw new Error(error?.message ?? "Anlegen fehlgeschlagen");
      rowId = row.id;
    }
    if (values.is_default && rowId) {
      await supabaseAdmin
        .from("product_size_variants")
        .update({ is_default: false })
        .eq("product_id", values.product_id)
        .neq("id", rowId);
    }
    return { id: rowId as string };
  });

export const adminDeleteSizeVariant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("product_size_variants").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------- Motifs ----------------

const motifFields = {
  number: z.number().int().min(1).max(999),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000),
  predefined_text: z.string().trim().max(2000),
  preview_image_url: z.string().trim().max(2000).nullable(),
  allows_custom_text: z.boolean(),
  requires_custom_text: z.boolean(),
  custom_text_max_length: z.number().int().min(10).max(2000),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0).max(999),
  price_delta_cents: z.number().int().min(0).max(1000000),
};

export const adminUpsertMotif = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({ id: z.string().uuid().optional(), product_id: z.string().uuid(), ...motifFields })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...values } = data;
    if (id) {
      const { error } = await supabaseAdmin.from("product_motifs").update(values).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await supabaseAdmin
      .from("product_motifs")
      .insert(values)
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Anlegen fehlgeschlagen");
    return { id: row.id as string };
  });

export const adminDeleteMotif = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("product_motifs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Creates the default S/M/L sizes and 4 motifs for a product (idempotent). */
export const adminSeedSchiebeboxDefaults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ product_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const pid = data.product_id;

    const sizes = [
      { label: "S", dimensions: "16 × 11 × 5 cm", price_cents: 2400, is_default: false, sort_order: 1 },
      { label: "M", dimensions: "18 × 13 × 6 cm", price_cents: 2800, is_default: true, sort_order: 2 },
      { label: "L", dimensions: "20 × 15 × 7 cm", price_cents: 3200, is_default: false, sort_order: 3 },
    ];
    const motifs = [
      {
        number: 1,
        title: "Zwei Herzen",
        description: "Zwei Herzen, ein Weg, ein Leben voller Liebe. Alles Gute zur Hochzeit.",
        predefined_text: "Zwei Herzen, ein Weg, ein Leben voller Liebe. Alles Gute zur Hochzeit.",
        allows_custom_text: false,
        requires_custom_text: false,
      },
      {
        number: 2,
        title: "Wunschtext",
        description: "Ihr persönlicher Text im Innenmotiv.",
        predefined_text: "",
        allows_custom_text: true,
        requires_custom_text: true,
      },
      {
        number: 3,
        title: "Hand in Hand",
        description: "Hand in Hand ein Leben lang. Alles Gute zur Hochzeit.",
        predefined_text: "Hand in Hand ein Leben lang. Alles Gute zur Hochzeit.",
        allows_custom_text: false,
        requires_custom_text: false,
      },
      {
        number: 4,
        title: "Eure Liebe",
        description: "Eure Liebe ist einzigartig. Bleibt für immer so glücklich. Alles Liebe zur Hochzeit.",
        predefined_text: "Eure Liebe ist einzigartig. Bleibt für immer so glücklich. Alles Liebe zur Hochzeit.",
        allows_custom_text: false,
        requires_custom_text: false,
      },
    ];

    const { data: existingSizes } = await supabaseAdmin
      .from("product_size_variants")
      .select("label")
      .eq("product_id", pid);
    const haveLabels = new Set((existingSizes ?? []).map((s) => s.label));
    const newSizes = sizes.filter((s) => !haveLabels.has(s.label)).map((s) => ({ ...s, product_id: pid, is_active: true }));
    if (newSizes.length) {
      const { error } = await supabaseAdmin.from("product_size_variants").insert(newSizes);
      if (error) throw new Error(error.message);
    }

    const { data: existingMotifs } = await supabaseAdmin
      .from("product_motifs")
      .select("number")
      .eq("product_id", pid);
    const haveNumbers = new Set((existingMotifs ?? []).map((m) => m.number));
    const newMotifs = motifs
      .filter((m) => !haveNumbers.has(m.number))
      .map((m) => ({
        ...m,
        product_id: pid,
        custom_text_max_length: 150,
        is_active: true,
        sort_order: m.number,
        preview_image_url: null,
      }));
    if (newMotifs.length) {
      const { error } = await supabaseAdmin.from("product_motifs").insert(newMotifs);
      if (error) throw new Error(error.message);
    }
    return { sizes: newSizes.length, motifs: newMotifs.length };
  });

// ---------------- Orders (admin) ----------------

export type AdminOrderAddress = {
  firstName?: string;
  lastName?: string;
  street?: string;
  houseNumber?: string;
  plz?: string;
  city?: string;
  country?: string;
};

export type AdminOrderItem = {
  productId?: string;
  slug?: string;
  name?: string;
  qty?: number;
  unitPriceCents?: number;
  personalization?: Record<string, string>;
};

export type AdminOrderRow = {
  id: string;
  email: string;
  address: AdminOrderAddress;
  items: AdminOrderItem[];

  shipping_method: string;
  payment_method: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  status: string;
  created_at: string;
  payment_environment?: string | null;
  stripe_session_id?: string | null;
};

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminOrderRow[]> => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("id,email,address,items,shipping_method,payment_method,subtotal_cents,shipping_cents,total_cents,status,created_at,payment_environment,stripe_session_id")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as AdminOrderRow[];
  });
