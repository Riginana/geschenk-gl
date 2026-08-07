import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save, Undo2 } from "lucide-react";
import {
  listHolzplattePrices,
  adminUpsertHolzplattePrices,
  adminDeleteHolzplattePriceOverride,
} from "@/lib/holzplatte-prices.functions";
import {
  HOLZPLATTE_SIZES,
  HOLZPLATTE_SIZE_LABELS,
  finalPriceCents,
  resolveHolzplattePrice,
  type HolzplattePriceRow,
} from "@/lib/holzplatte-pricing";

function fmtEuro(cents: number) {
  return (cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function parseNum(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

type Draft = Record<string, { price: string; discount: string }>;

/**
 * Inline editor for Holzplatte prices.
 * productId = null → global defaults; productId set → per-product override.
 */
export function HolzplattePriceTable({ productId }: { productId: string | null }) {
  const [draft, setDraft] = useState<Draft>({});
  const [saving, setSaving] = useState(false);

  const q = useQuery({ queryKey: ["holzplatte-prices"], queryFn: () => listHolzplattePrices() });
  const rows: HolzplattePriceRow[] = q.data ?? [];

  const ownRow = (size: string) =>
    rows.find((r) => (productId ? r.product_id === productId : r.product_id === null) && r.size === size) ?? null;

  useEffect(() => {
    const next: Draft = {};
    for (const size of HOLZPLATTE_SIZES) {
      const own = rows.find(
        (r) => (productId ? r.product_id === productId : r.product_id === null) && r.size === size,
      );
      next[size] = own
        ? { price: own.original_price.toFixed(2), discount: String(own.discount_percent) }
        : { price: "", discount: "" };
    }
    setDraft(next);
  }, [q.data, productId]);

  const onSave = async () => {
    const entries: Array<{ size: any; originalPrice: number; discountPercent: number }> = [];
    for (const size of HOLZPLATTE_SIZES) {
      const d = draft[size] ?? { price: "", discount: "" };
      const price = parseNum(d.price);
      if (price === null) continue;
      const discount = parseNum(d.discount) ?? 0;
      if (Number.isNaN(price) || Number.isNaN(discount) || discount > 100) {
        toast.error(`Ungültiger Wert bei ${HOLZPLATTE_SIZE_LABELS[size]}`);
        return;
      }
      entries.push({ size, originalPrice: price, discountPercent: discount });
    }
    if (!entries.length) {
      toast.error("Keine Werte zum Speichern");
      return;
    }
    setSaving(true);
    try {
      await adminUpsertHolzplattePrices({ data: { productId, entries } });
      toast.success("Preise gespeichert");
      await q.refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  const onReset = async (size: string) => {
    if (!productId) return;
    try {
      await adminDeleteHolzplattePriceOverride({ data: { productId, size: size as any } });
      toast.success("Override entfernt — globaler Preis gilt");
      await q.refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Fehlgeschlagen");
    }
  };

  if (q.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Lädt…
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {HOLZPLATTE_SIZES.map((size) => {
          const d = draft[size] ?? { price: "", discount: "" };
          const own = ownRow(size);
          const effective = own ?? resolveHolzplattePrice(rows, productId, size);
          const previewPrice = parseNum(d.price);
          const previewDiscount = parseNum(d.discount) ?? 0;
          const showFinal =
            previewPrice !== null && !Number.isNaN(previewPrice) && !Number.isNaN(previewDiscount)
              ? finalPriceCents(previewPrice, previewDiscount)
              : effective
                ? finalPriceCents(effective.original_price, effective.discount_percent)
                : null;
          return (
            <div
              key={size}
              className="rounded-xl border border-border bg-card p-3 sm:flex sm:flex-wrap sm:items-end sm:gap-4"
            >
              <div className="min-w-32 text-sm font-medium text-walnut sm:py-2">
                {HOLZPLATTE_SIZE_LABELS[size]}
              </div>
              <label className="mt-2 block sm:mt-0">
                <span className="block text-[11px] text-muted-foreground">Normalpreis (€)</span>
                <input
                  value={d.price}
                  onChange={(e) => setDraft((x) => ({ ...x, [size]: { ...d, price: e.target.value } }))}
                  inputMode="decimal"
                  placeholder={productId ? "global" : ""}
                  aria-label={`Normalpreis ${HOLZPLATTE_SIZE_LABELS[size]}`}
                  className={`mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm sm:w-28 ${
                    own && productId ? "border-brass" : "border-border"
                  }`}
                />
              </label>
              <label className="mt-2 block sm:mt-0">
                <span className="block text-[11px] text-muted-foreground">Rabatt (%)</span>
                <input
                  value={d.discount}
                  onChange={(e) => setDraft((x) => ({ ...x, [size]: { ...d, discount: e.target.value } }))}
                  inputMode="decimal"
                  placeholder={productId ? "global" : "0"}
                  aria-label={`Rabatt ${HOLZPLATTE_SIZE_LABELS[size]}`}
                  className={`mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm sm:w-24 ${
                    own && productId ? "border-brass" : "border-border"
                  }`}
                />
              </label>
              <div className="mt-2 text-sm sm:mt-0 sm:py-2">
                <span className="text-[11px] text-muted-foreground">Endpreis: </span>
                <span className="font-medium text-walnut">{showFinal !== null ? fmtEuro(showFinal) : "—"}</span>
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground sm:ml-auto sm:py-2">
                {effective?.updated_at
                  ? `Zuletzt geändert: ${new Date(effective.updated_at).toLocaleString("de-DE")}`
                  : "—"}
                {productId && own && (
                  <button
                    type="button"
                    onClick={() => onReset(size)}
                    title="Override entfernen"
                    className="ml-2 inline-flex rounded p-1 align-middle text-muted-foreground hover:bg-accent"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={onSave}
        disabled={saving}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-walnut px-4 py-2 text-sm text-cream disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Speichern
      </button>
      {productId && (
        <p className="mt-2 text-xs text-muted-foreground">
          Leere Felder = globaler Preis gilt. Felder mit goldenem Rahmen sind produktspezifische Overrides.
        </p>
      )}
    </div>
  );
}
