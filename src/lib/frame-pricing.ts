export const FRAME_SIZES = ["A5", "A4", "A3"] as const;
export type FrameSize = (typeof FRAME_SIZES)[number];

export const FRAME_VARIANTS = [
  "ohne_bilderrahmen",
  "standard_weiss",
  "echtholz_weiss",
  "standard_schwarz",
  "echtholz_schwarz",
  "standard_dunkelbraun",
  "echtholz_dunkelbraun",
] as const;
export type FrameVariant = (typeof FRAME_VARIANTS)[number];

export const FRAME_SIZE_LABELS: Record<string, string> = {
  A5: "A5 (14,8 × 21 cm)",
  A4: "A4 (21 × 29,7 cm)",
  A3: "A3 (29,7 × 42 cm)",
};

export const FRAME_VARIANT_LABELS: Record<string, string> = {
  ohne_bilderrahmen: "ohne Bilderrahmen",
  standard_weiss: "Standard Weiß",
  echtholz_weiss: "Echtholz Weiß",
  standard_schwarz: "Standard Schwarz",
  echtholz_schwarz: "Echtholz Schwarz",
  standard_dunkelbraun: "Standard Dunkelbraun",
  echtholz_dunkelbraun: "Echtholz Dunkelbraun",
};

export const FRAME_MATERIALS = ["papier", "holz", "hdf"] as const;
export type FrameMaterial = (typeof FRAME_MATERIALS)[number];

export const FRAME_MATERIAL_LABELS: Record<string, string> = {
  papier: "Papier",
  holz: "Holz",
  hdf: "HDF",
};

export function normalizeFrameMaterial(v?: string | null): FrameMaterial {
  const s = (v ?? "").toLowerCase();
  return (FRAME_MATERIALS as readonly string[]).includes(s) ? (s as FrameMaterial) : "holz";
}

export type FramePriceRow = {
  id: string;
  product_id: string | null;
  material?: string | null;
  size: string;
  variant: string;
  price_cents: number;
  discount_percent?: number | null;
};

export type FramePrice = {
  /** List price before the discount stored in the price table. */
  listCents: number;
  /** Price actually charged. */
  finalCents: number;
  discountPercent: number;
};

export function clampPercent(v: unknown): number {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function frameFinalCents(priceCents: number, discountPercent: unknown): number {
  return Math.round(priceCents * (1 - clampPercent(discountPercent) / 100));
}

/**
 * Cascade: product override > subcategory (material) price > global price.
 * The winning row supplies both price and discount.
 */
export function resolveFramePriceRow(
  rows: FramePriceRow[],
  productId: string,
  material: string | null | undefined,
  size: string,
  variant: string,
): FramePriceRow | null {
  const match = rows.filter((r) => r.size === size && r.variant === variant);
  const override = match.find((r) => r.product_id === productId);
  if (override) return override;
  if (material) {
    const mat = match.find((r) => r.product_id === null && (r.material ?? null) === material);
    if (mat) return mat;
  }
  return match.find((r) => r.product_id === null && !r.material) ?? null;
}

/** Resolved price including the discount stored in the price table. */
export function resolveFramePrice(
  rows: FramePriceRow[],
  productId: string,
  material: string | null | undefined,
  size: string,
  variant: string,
): FramePrice | null {
  const row = resolveFramePriceRow(rows, productId, material, size, variant);
  if (!row) return null;
  const discountPercent = clampPercent(row.discount_percent);
  return {
    listCents: row.price_cents,
    finalCents: frameFinalCents(row.price_cents, discountPercent),
    discountPercent,
  };
}

export function resolveFramePriceCents(
  rows: FramePriceRow[],
  productId: string,
  material: string | null | undefined,
  size: string,
  variant: string,
): number | null {
  return resolveFramePriceRow(rows, productId, material, size, variant)?.price_cents ?? null;
}

