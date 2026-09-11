import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save, Undo2, Trash2 } from "lucide-react";
import { adminListProducts } from "@/lib/admin.functions";
import {
  listFramePrices,
  adminUpsertFramePrices,
  adminDeleteFramePriceOverride,
  adminDeleteAllFramePriceOverrides,
} from "@/lib/frame-prices.functions";
import {
  FRAME_SIZES,
  FRAME_VARIANTS,
  FRAME_SIZE_LABELS,
  FRAME_VARIANT_LABELS,
  FRAME_MATERIALS,
  FRAME_MATERIAL_LABELS,
  normalizeFrameMaterial,
  resolveFramePriceCents,
  type FrameMaterial,
  type FramePriceRow,
} from "@/lib/frame-pricing";
import { HolzplattePriceTable } from "@/components/admin/holzplatte-price-table";

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
  const [material, setMaterial] = useState<FrameMaterial>("papier");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

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
  const selectedProduct = productId ? frameProducts.find((p) => p.id === productId) : undefined;
  const effectiveMaterial: FrameMaterial = productId
    ? normalizeFrameMaterial(selectedProduct?.frame_material)
    : material;

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const size of FRAME_SIZES) {
      for (const variant of FRAME_VARIANTS) {
        const key = `${size}|${variant}`;
        const cents = productId
          ? resolveFramePriceCents(rows, productId, effectiveMaterial, size, variant)
          : (rows.find(
              (r) =>
                r.product_id === null &&
                (r.material ?? null) === material &&
                r.size === size &&
                r.variant === variant,
            )?.price_cents ??
            rows.find(
              (r) => r.product_id === null && !r.material && r.size === size && r.variant === variant,
            )?.price_cents ??
            null);
        next[key] = cents === null ? "" : centsToEuro(cents);
      }
    }
    setDraft(next);
  }, [target, material, effectiveMaterial, pricesQ.data]);

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
      await adminUpsertFramePrices({
        data: { productId, material: productId ? null : material, entries },
      });
      toast.success(
        productId
          ? "Produktpreise gespeichert"
          : `Preise für ${FRAME_MATERIAL_LABELS[material]} gespeichert`,
      );
      await pricesQ.refetch();
      await queryClient.invalidateQueries({ queryKey: ["frame-prices"] });
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
      toast.success("Ausnahme entfernt — Preis der Unterkategorie gilt");
      await pricesQ.refetch();
      await queryClient.invalidateQueries({ queryKey: ["frame-prices"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Fehlgeschlagen");
    }
  };

  /** Products that carry their own exception prices — mass changes skip them. */
  const overrideProducts = useMemo(() => {
    const ids = new Set(rows.filter((r) => r.product_id).map((r) => r.product_id as string));
    return Array.from(ids).map((id) => ({
      id,
      name: frameProducts.find((p) => p.id === id)?.name_de ?? id,
      count: rows.filter((r) => r.product_id === id).length,
    }));
  }, [rows, frameProducts]);

  const materialStats = useMemo(() => {
    const stats: Record<string, { own: number; products: number }> = {};
    for (const m of FRAME_MATERIALS) {
      stats[m] = {
        own: rows.filter((r) => r.product_id === null && (r.material ?? null) === m).length,
        products: frameProducts.filter((p) => normalizeFrameMaterial(p.frame_material) === m).length,
      };
    }
    return stats;
  }, [rows, frameProducts]);

  const onClearOverrides = async (id: string) => {
    if (!confirm("Alle Ausnahmepreise dieses Produkts entfernen?")) return;
    try {
      await adminDeleteAllFramePriceOverrides({ data: { productId: id } });
      toast.success("Ausnahmen entfernt — Preise der Unterkategorie gelten");
      await pricesQ.refetch();
      await queryClient.invalidateQueries({ queryKey: ["frame-prices"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Fehlgeschlagen");
    }
  };

  const loading = productsQ.isLoading || pricesQ.isLoading;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-serif text-2xl text-walnut">Rahmenpreise</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Preise für Bilderrahmen nach Unterkategorie (Papier / Holz / HDF), Größe und Rahmen-Variante.
        Produktspezifische Ausnahmen überschreiben den Preis der Unterkategorie.
      </p>

      <div className="mt-6 inline-flex rounded-lg border border-border bg-card p-1">
        {FRAME_MATERIALS.map((m) => {
          const active = effectiveMaterial === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMaterial(m);
                setTarget(GLOBAL);
              }}
              className={`rounded-md px-4 py-1.5 text-sm ${
                active ? "bg-walnut text-cream" : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {FRAME_MATERIAL_LABELS[m]}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="min-w-72 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value={GLOBAL}>
            Alle Produkte der Unterkategorie {FRAME_MATERIAL_LABELS[material]}
          </option>
          {frameProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name_de} ({FRAME_MATERIAL_LABELS[normalizeFrameMaterial(p.frame_material)]})
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

      <section className="mt-12">
        <h2 className="font-serif text-xl text-walnut">Holzplatte-Preise</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Globale Standardpreise für alle Produkte der Kategorie <strong>holzplatte</strong>.
          Produktspezifische Overrides werden direkt beim jeweiligen Produkt gepflegt.
        </p>
        <div className="mt-4">
          <HolzplattePriceTable productId={null} />
        </div>
      </section>
    </div>
  );
}
