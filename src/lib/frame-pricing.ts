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

export type FramePriceRow = {
  id: string;
  product_id: string | null;
  size: string;
  variant: string;
  price_cents: number;
};

/** Product override wins over the global (product_id = null) price. */
export function resolveFramePriceCents(
  rows: FramePriceRow[],
  productId: string,
  size: string,
  variant: string,
): number | null {
  const match = rows.filter((r) => r.size === size && r.variant === variant);
  const override = match.find((r) => r.product_id === productId);
  if (override) return override.price_cents;
  const global = match.find((r) => r.product_id === null);
  return global ? global.price_cents : null;
}
