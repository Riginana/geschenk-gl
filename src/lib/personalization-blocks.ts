import { MESSAGE_MAX, isValidDate, sanitizeMessage, sanitizeName } from "@/lib/personalization-schema";

/** Shared (browser + server) model + resolver for admin-managed personalization blocks. */

export type PersScope = "global" | "occasion" | "category" | "product";
export type PersFieldType = "text" | "textarea" | "date" | "select" | "checkbox" | "font" | "image";
export type PersOption = { value: string; label_de: string; label_en: string; image_url?: string };

export type PersBlock = {
  id: string;
  scope: PersScope;
  scope_value: string;
  internal_name: string;
  field_key: string;
  field_type: PersFieldType;
  title_de: string;
  title_en: string;
  description_de: string;
  description_en: string;
  placeholder_de: string;
  placeholder_en: string;
  hint_de: string;
  hint_en: string;
  error_de: string;
  error_en: string;
  required: boolean;
  is_active: boolean;
  hidden: boolean;
  overrides_block_id: string | null;
  sort_order: number;
  min_length: number;
  max_length: number;
  options: PersOption[];
};

export type PersSection = { scope: PersScope; scope_value: string; heading_de: string; heading_en: string };

export type ResolvedBlock = PersBlock & { source: "product" | "occasion" | "category" | "global" };

export type ProductScopeInfo = { id: string; occasion?: string | null; category?: string | null };

export const FIELD_TYPE_LABELS: Record<PersFieldType, string> = {
  text: "Textfeld (einzeilig)",
  textarea: "Textfeld (mehrzeilig)",
  date: "Datum",
  select: "Auswahlliste",
  checkbox: "Kontrollkästchen",
  font: "Schriftart-Auswahl",
  image: "Bild-/Motivauswahl",
};

export const OPTION_TYPES: PersFieldType[] = ["select", "font", "image"];

/**
 * Priority: product → occasion → category → global.
 * The most specific of occasion/category/global that has blocks forms the base set
 * (so e.g. Christmas products never inherit wedding or global blocks once Christmas blocks exist).
 * Product blocks then add to, override (overrides_block_id) or hide (hidden) base blocks.
 */
export function resolveBlocks(all: PersBlock[], p: ProductScopeInfo): ResolvedBlock[] {
  const active = all.filter((b) => b.is_active);
  const of = (scope: PersScope, value: string) =>
    active.filter((b) => b.scope === scope && b.scope_value === value && !b.hidden && !b.overrides_block_id);
  const occ = p.occasion ? of("occasion", p.occasion) : [];
  const cat = p.category ? of("category", p.category) : [];
  let base: ResolvedBlock[];
  if (occ.length) base = occ.map((b) => ({ ...b, source: "occasion" as const }));
  else if (cat.length) base = cat.map((b) => ({ ...b, source: "category" as const }));
  else base = of("global", "").map((b) => ({ ...b, source: "global" as const }));

  const prod = active.filter((b) => b.scope === "product" && b.scope_value === p.id);
  for (const b of prod) {
    if (b.overrides_block_id) {
      const i = base.findIndex((x) => x.id === b.overrides_block_id);
      if (i >= 0) {
        if (b.hidden) base.splice(i, 1);
        else base[i] = { ...b, source: "product" };
      }
    } else if (!b.hidden) base.push({ ...b, source: "product" });
  }
  return base.sort((a, b) => a.sort_order - b.sort_order);
}

export function resolveHeading(sections: PersSection[], p: ProductScopeInfo, locale: "de" | "en"): string | null {
  const order: [PersScope, string | null | undefined][] = [
    ["product", p.id],
    ["occasion", p.occasion],
    ["category", p.category],
    ["global", ""],
  ];
  for (const [scope, value] of order) {
    if (value === null || value === undefined) continue;
    const s = sections.find((x) => x.scope === scope && x.scope_value === value);
    const h = s && (locale === "en" ? s.heading_en || s.heading_de : s.heading_de);
    if (h) return h;
  }
  return null;
}

const NAME_RE = /^[\p{L}\p{M}' &+-]+$/u;
const TEXT_RE = /^[\p{L}\p{M}\p{N} \n.,!?:;\-'"&()❤\u2019\u201E\u201C\uFE0F]*$/u;
const URL_RE = /(https?:\/\/|www\.|\b[\w-]+\.(com|de|net|org|io|info|ru|eu|co|app|shop)\b)/i;

/** Normalises a raw answer for storage. */
export function cleanAnswer(b: PersBlock, raw: string): string {
  const v = String(raw ?? "");
  if (b.field_type === "text") return b.field_key === "names" ? sanitizeName(v) : sanitizeMessage(v).replace(/\n/g, " ");
  if (b.field_type === "textarea") return sanitizeMessage(v);
  return v.trim();
}

/** Returns an error key (pers.errors.*) or null. Value must already be cleaned. */
export function validateAnswer(b: PersBlock, v: string): string | null {
  if (!v) return b.required ? "required" : null;
  switch (b.field_type) {
    case "date":
      return isValidDate(v) ? null : "date";
    case "checkbox":
      return v === "ja" ? null : "required";
    case "select":
    case "font":
    case "image":
      return b.options.some((o) => o.value === v) ? null : "option";
    case "text":
    case "textarea": {
      const max = Math.min(b.max_length || MESSAGE_MAX, 500);
      if (v.length < (b.min_length || 0)) return "tooShort";
      if (v.length > max) return "tooLong";
      if (b.field_key === "names" && b.field_type === "text") return NAME_RE.test(v) ? null : "nameChars";
      if (!TEXT_RE.test(v) || URL_RE.test(v) || /(.)\1{3,}/u.test(v) || (v.match(/\n/g)?.length ?? 0) > 3)
        return "messageChars";
      return null;
    }
  }
  return null;
}

export function optionLabel(o: PersOption, locale: "de" | "en") {
  return locale === "en" ? o.label_en || o.label_de : o.label_de;
}

export function parseOptions(raw: unknown): PersOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((o): o is Record<string, unknown> => !!o && typeof o === "object")
    .map((o) => ({
      value: String(o.value ?? ""),
      label_de: String(o.label_de ?? ""),
      label_en: String(o.label_en ?? ""),
      image_url: o.image_url ? String(o.image_url) : undefined,
    }))
    .filter((o) => o.value);
}

export function toBlock(row: Record<string, unknown>): PersBlock {
  return { ...(row as unknown as PersBlock), options: parseOptions(row.options) };
}
