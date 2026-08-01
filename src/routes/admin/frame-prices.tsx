import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save, Undo2 } from "lucide-react";
import { adminListProducts } from "@/lib/admin.functions";
import {
  listFramePrices,
  adminUpsertFramePrices,
  adminDeleteFramePriceOverride,
} from "@/lib/frame-prices.functions";
import {
  FRAME_SIZES,
  FRAME_VARIANTS,
  FRAME_SIZE_LABELS,
  FRAME_VARIANT_LABELS,
  resolveFramePriceCents,
  type FramePriceRow,
} from "@/lib/frame-pricing";

export const Route = createFileRoute("/admin/frame-prices")({
  head: () => ({
    meta: [
      { title: "Rahmenpreise — Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: FramePricesAdmin,
});

const GLOBAL = "__global__";

function centsToEuro(c: number) {
  return (c / 100).toFixed(2);
}

function euroToCents(v: string): number | null {
  const n = Number(v.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function FramePricesAdmin() {
  const [target, setTarget] = useState<string>(GLOBAL);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const productsQ = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => adminListProducts(),
  });
  const pricesQ = useQuery({
    queryKey: ["frame-prices"],
    queryFn: () => listFramePrices(),
  });

  const frameProducts = useMemo(
    () => (productsQ.data ?? []).filter((p) => p.category === "bilderrahmen"),
    [productsQ.data],
  );

  const rows: FramePriceRow[] = pricesQ.data ?? [];
  const productId = target === GLOBAL ? null : target;

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const size of FRAME_SIZES) {
      for (const variant of FRAME_VARIANTS) {
        const key = `${size}|${variant}`;
        const cents = productId
          ? resolveFramePriceCents(rows, productId, size, variant)
          : (rows.find((r) => r.product_id === null && r.size === size && r.variant === variant)
              ?.price_cents ?? null);
        next[key] = cents === null ? "" : centsToEuro(cents);
      }
    }
    setDraft(next);
  }, [target, pricesQ.data]);

  const hasOverride = (size: string, variant: string) =>
    !!productId && rows.some((r) => r.product_id === productId && r.size === size && r.variant === variant);

  const onSave = async () => {
    const entries: Array<{ size: any; variant: any; priceCents: number }> = [];
    for (const size of FRAME_SIZES) {
      for (const variant of FRAME_VARIANTS) {
        const raw = draft[`${size}|${variant}`] ?? "";
        if (raw.trim() === "") continue;
        const cents = euroToCents(raw);
        if (cents === null) {
          toast.error(`Ungültiger Preis bei ${size} / ${FRAME_VARIANT_LABELS[variant]}`);
          return;
        }
        entries.push({ size, variant, priceCents: cents });
      }
    }
    if (!entries.length) return;
    setSaving(true);
    try {
      await adminUpsertFramePrices({ data: { productId, entries } });
      toast.success("Preise gespeichert");
      await pricesQ.refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  const onResetCell = async (size: string, variant: string) => {
    if (!productId) return;
    try {
      await adminDeleteFramePriceOverride({ data: { productId, size: size as any, variant: variant as any } });
      toast.success("Override entfernt — globaler Preis gilt");
      await pricesQ.refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Fehlgeschlagen");
    }
  };

  const loading = productsQ.isLoading || pricesQ.isLoading;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-serif text-2xl text-walnut">Rahmenpreise</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Preise für Bilderrahmen-Produkte nach Größe und Rahmen-Variante. Produkt-Overrides
        überschreiben die globalen Preise.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="min-w-72 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value={GLOBAL}>Globale Standardpreise</option>
          {frameProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name_de}
            </option>
          ))}
        </select>
        <button
          onClick={onSave}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 rounded-lg bg-walnut px-4 py-2 text-sm text-cream disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Speichern
        </button>
      </div>

      {loading ? (
        <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Lädt…
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium">Variante</th>
                {FRAME_SIZES.map((s) => (
                  <th key={s} className="px-4 py-3 font-medium">
                    {FRAME_SIZE_LABELS[s]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FRAME_VARIANTS.map((variant) => (
                <tr key={variant} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-2">{FRAME_VARIANT_LABELS[variant]}</td>
                  {FRAME_SIZES.map((size) => {
                    const key = `${size}|${variant}`;
                    return (
                      <td key={key} className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          <input
                            value={draft[key] ?? ""}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, [key]: e.target.value }))
                            }
                            inputMode="decimal"
                            aria-label={`${FRAME_VARIANT_LABELS[variant]} ${size}`}
                            className={`w-24 rounded-md border bg-background px-2 py-1.5 text-sm ${
                              hasOverride(size, variant) ? "border-brass" : "border-border"
                            }`}
                          />
                          <span className="text-xs text-muted-foreground">€</span>
                          {hasOverride(size, variant) && (
                            <button
                              type="button"
                              onClick={() => onResetCell(size, variant)}
                              title="Override entfernen"
                              className="rounded p-1 text-muted-foreground hover:bg-accent"
                            >
                              <Undo2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {productId && (
        <p className="mt-3 text-xs text-muted-foreground">
          Felder mit goldenem Rahmen sind produktspezifische Overrides. Leere Felder werden nicht
          gespeichert.
        </p>
      )}
    </div>
  );
}
