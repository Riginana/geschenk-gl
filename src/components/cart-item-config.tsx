import type { CartItem } from "@/contexts/cart";

/** Compact, read-only summary of a configured cart item (size / motif / texts). */
export function CartItemConfig({ item }: { item: CartItem }) {
  const p = item.personalization;
  const rows: Array<[string, string]> = [];
  if (p.sizeLabel) rows.push(["Größe", p.dimensions ? `${p.sizeLabel} — ${p.dimensions}` : p.sizeLabel]);
  if (p.motifTitle) rows.push(["Motiv", p.motifNumber ? `Motiv ${p.motifNumber} — ${p.motifTitle}` : p.motifTitle]);
  if (p.customMotifText) rows.push(["Wunschtext", p.customMotifText]);
  if (!rows.length) return null;

  return (
    <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
      {rows.map(([k, v]) => (
        <li key={k}>
          <span className="font-medium text-walnut">{k}:</span> {v}
        </li>
      ))}
    </ul>
  );
}
