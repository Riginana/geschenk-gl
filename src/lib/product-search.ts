import type { ProductRow } from "@/lib/products.functions";
import { de } from "@/i18n/de";
import { en } from "@/i18n/en";

export function normalizeQuery(q: string | undefined | null): string {
  return (q ?? "").trim().toLowerCase();
}

export function matchesSearch(p: ProductRow, query: string): boolean {
  const q = normalizeQuery(query);
  if (!q) return true;
  const occDe = (de.occasions as Record<string, string>)[p.occasion] ?? "";
  const occEn = (en.occasions as Record<string, string>)[p.occasion] ?? "";
  const hay = [p.name_de, p.name_en, p.description_de, p.description_en, p.category, p.occasion, occDe, occEn]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return q.split(/\s+/).every((w) => hay.includes(w));
}
