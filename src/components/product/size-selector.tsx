import type { SizeVariant } from "@/lib/product-config";
import { activeSizes } from "@/lib/product-config";
import { formatEUR } from "@/i18n";
import { calculateDiscountedPrice } from "@/lib/pricing";

export function ProductSizeSelector({
  sizes,
  selectedId,
  onSelect,
  discountPercent,
  locale,
}: {
  sizes: SizeVariant[];
  selectedId: string | null;
  onSelect: (size: SizeVariant) => void;
  discountPercent?: number | null;
  locale?: "de" | "en";
}) {
  const list = activeSizes(sizes);
  if (!list.length) return null;
  const selected = list.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="rounded-2xl bg-card p-6 ring-1 ring-border/60">
      <p className="eyebrow mb-3">Größe auswählen</p>
      <div role="radiogroup" aria-label="Größe auswählen" className="grid gap-2 sm:grid-cols-3">
        {list.map((s) => {
          const active = s.id === selectedId;
          const price = calculateDiscountedPrice(s.price_cents, discountPercent);
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(s)}
              className={`rounded-xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brass ${
                active ? "border-walnut bg-walnut/5 ring-1 ring-walnut" : "border-border bg-cream hover:border-walnut/50"
              }`}
            >
              <span className="block text-sm font-medium text-walnut">{s.label}</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">{s.dimensions}</span>
              <span className="mt-1 block text-sm text-walnut">{formatEUR(price, locale)}</span>
            </button>
          );
        })}
      </div>
      {selected?.dimensions && (
        <p className="mt-3 text-xs text-muted-foreground">
          <span className="font-medium text-walnut">Maße:</span> {selected.dimensions}
        </p>
      )}
    </div>
  );
}
