/**
 * Shared, framework-agnostic types + helpers for configurable products
 * (size variants and motifs). Single source of truth for pricing lookups —
 * never hardcode variant prices in components.
 */

export type SizeVariant = {
  id: string;
  product_id: string;
  label: string;
  dimensions: string;
  price_cents: number;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
};

export type Motif = {
  id: string;
  product_id: string;
  number: number;
  /** Surcharge added on top of the chosen size price (in cents). */
  price_delta_cents: number;
  title: string;
  description: string;
  predefined_text: string;
  preview_image_url: string | null;
  allows_custom_text: boolean;
  requires_custom_text: boolean;
  custom_text_max_length: number;
  is_active: boolean;
  sort_order: number;
};

/** Categories that use size variants + motifs. */
export const CONFIGURABLE_CATEGORIES = ["schiebebox", "holzbox"] as const;
export const CONFIGURABLE_CATEGORY = CONFIGURABLE_CATEGORIES[0];

export function isConfigurableCategory(category?: string | null): boolean {
  return (CONFIGURABLE_CATEGORIES as readonly string[]).includes((category ?? "").toLowerCase());
}

export function sortSizes<T extends { sort_order: number; label: string }>(list: T[]): T[] {
  return list.slice().sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));
}

export function sortMotifs<T extends { sort_order: number; number: number }>(list: T[]): T[] {
  return list.slice().sort((a, b) => a.sort_order - b.sort_order || a.number - b.number);
}

export function activeSizes(list: SizeVariant[]): SizeVariant[] {
  return sortSizes(list.filter((s) => s.is_active));
}

export function activeMotifs(list: Motif[]): Motif[] {
  return sortMotifs(list.filter((m) => m.is_active));
}

/** Default selected size: explicit default, else first active. */
export function defaultSize(list: SizeVariant[]): SizeVariant | undefined {
  const act = activeSizes(list);
  return act.find((s) => s.is_default) ?? act[0];
}

/** Price of one configuration: size price + motif surcharge. */
export function unitPriceCents(
  size?: Pick<SizeVariant, "price_cents"> | null,
  motif?: Pick<Motif, "price_delta_cents"> | null,
): number {
  return (size?.price_cents ?? 0) + (motif?.price_delta_cents ?? 0);
}

/** Lowest active combination price, used for "Ab …" catalog labels. */
export function fromPriceCents(list: SizeVariant[], motifs: Motif[] = []): number | null {
  const act = activeSizes(list);
  if (!act.length) return null;
  const minSize = act.reduce((min, s) => Math.min(min, s.price_cents), act[0].price_cents);
  const act2 = activeMotifs(motifs);
  const minDelta = act2.length
    ? act2.reduce((min, m) => Math.min(min, m.price_delta_cents ?? 0), act2[0].price_delta_cents ?? 0)
    : 0;
  return minSize + minDelta;
}

export function hasMixedPrices(list: SizeVariant[]): boolean {
  const act = activeSizes(list);
  return new Set(act.map((s) => s.price_cents)).size > 1;
}

export function groupByProduct<T extends { product_id: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const r of rows) {
    const arr = map.get(r.product_id) ?? [];
    arr.push(r);
    map.set(r.product_id, arr);
  }
  return map;
}
