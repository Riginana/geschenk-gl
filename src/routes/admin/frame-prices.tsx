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
  resolveFramePriceRow,
  clampPercent,
  type FrameMaterial,
  type FramePriceRow,
} from "@/lib/frame-pricing";
import { HolzplattePriceTable } from "@/components/admin/holzplatte-price-table";
import { HolzboxPriceTable } from "@/components/admin/holzbox-price-table";

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
  const [discounts, setDiscounts] = useState<Record<string, string>>({});
  const [bulkDiscount, setBulkDiscount] = useState<string>("");
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
    const nextPrice: Record<string, string> = {};
    const nextDiscount: Record<string, string> = {};
    for (const size of FRAME_SIZES) {
      for (const variant of FRAME_VARIANTS) {
        const key = `${size}|${variant}`;
        const row = productId
          ? resolveFramePriceRow(rows, productId, effectiveMaterial, size, variant)
          : (rows.find(
              (r) =>
                r.product_id === null &&
                (r.material ?? null) === material &&
                r.size === size &&
                r.variant === variant,
            ) ??
            rows.find(
              (r) => r.product_id === null && !r.material && r.size === size && r.variant === variant,
            ) ??
            null);
        nextPrice[key] = row ? centsToEuro(row.price_cents) : "";
        nextDiscount[key] = row ? String(clampPercent(row.discount_percent)) : "";
      }
    }
    setDraft(nextPrice);
    setDiscounts(nextDiscount);
  }, [target, material, effectiveMaterial, pricesQ.data]);

  const hasOverride = (size: string, variant: string) =>
    !!productId && rows.some((r) => r.product_id === productId && r.size === size && r.variant === variant);

  const applyBulkDiscount = () => {
    const raw = bulkDiscount.trim().replace(",", ".");
    const n = Number(raw);
    if (raw === "" || !Number.isFinite(n) || n < 0 || n > 100) {
      toast.error("Bitte einen Rabatt zwischen 0 und 100 angeben");
      return;
    }
    const value = String(Math.round(n));
    setDiscounts(() => {
      const next: Record<string, string> = {};
      for (const size of FRAME_SIZES) {
        for (const variant of FRAME_VARIANTS) next[`${size}|${variant}`] = value;
      }
      return next;
    });
    toast.success(`Rabatt ${value} % in alle Felder eingetragen — jetzt speichern`);
  };

  const onSave = async () => {
    const entries: Array<{ size: any; variant: any; priceCents: number; discountPercent: number }> = [];
    for (const size of FRAME_SIZES) {
      for (const variant of FRAME_VARIANTS) {
        const key = `${size}|${variant}`;
        const raw = draft[key] ?? "";
        if (raw.trim() === "") continue;
        const cents = euroToCents(raw);
        if (cents === null) {
          toast.error(`Ungültiger Preis bei ${size} / ${FRAME_VARIANT_LABELS[variant]}`);
          return;
        }
        const rawDiscount = (discounts[key] ?? "").trim().replace(",", ".");
        const d = rawDiscount === "" ? 0 : Number(rawDiscount);
        if (!Number.isFinite(d) || d < 0 || d > 100) {
          toast.error(`Ungültiger Rabatt bei ${size} / ${FRAME_VARIANT_LABELS[variant]}`);
          return;
        }
        entries.push({ size, variant, priceCents: cents, discountPercent: Math.round(d) });
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
              <span className="ml-2 text-xs opacity-70">
                {materialStats[m]?.products ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {productId
          ? `Produktspezifische Preise (Unterkategorie: ${FRAME_MATERIAL_LABELS[effectiveMaterial]})`
          : (materialStats[material]?.own ?? 0) > 0
            ? `${FRAME_MATERIAL_LABELS[material]}: eigene Preise hinterlegt · ${materialStats[material]?.products ?? 0} Produkte`
            : `${FRAME_MATERIAL_LABELS[material]}: noch keine eigenen Preise — es gelten die allgemeinen Preise · ${materialStats[material]?.products ?? 0} Produkte`}
      </p>


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

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <span className="text-sm text-muted-foreground">Rabatt für alle Felder setzen:</span>
        <input
          value={bulkDiscount}
          onChange={(e) => setBulkDiscount(e.target.value)}
          inputMode="decimal"
          placeholder="z. B. 30"
          aria-label="Rabatt für alle Felder"
          className="w-24 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        />
        <span className="text-xs text-muted-foreground">%</span>
        <button
          type="button"
          onClick={applyBulkDiscount}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
        >
          Übernehmen
        </button>
        <span className="text-xs text-muted-foreground">Danach "Speichern" drücken.</span>
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
                    const priceRaw = draft[key] ?? "";
                    const cents = priceRaw.trim() === "" ? null : euroToCents(priceRaw);
                    const discRaw = (discounts[key] ?? "").trim().replace(",", ".");
                    const disc = discRaw === "" ? 0 : Number(discRaw);
                    const validDisc = Number.isFinite(disc) && disc >= 0 && disc <= 100;
                    const finalCents =
                      cents !== null && validDisc ? Math.round(cents * (1 - disc / 100)) : null;
                    return (
                      <td key={key} className="px-4 py-2 align-top">
                        <div className="flex items-center gap-1.5">
                          <input
                            value={priceRaw}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, [key]: e.target.value }))
                            }
                            inputMode="decimal"
                            aria-label={`${FRAME_VARIANT_LABELS[variant]} ${size}`}
                            className={`w-20 rounded-md border bg-background px-2 py-1.5 text-sm ${
                              hasOverride(size, variant) ? "border-brass" : "border-border"
                            }`}
                          />
                          <span className="text-xs text-muted-foreground">€</span>
                          <input
                            value={discounts[key] ?? ""}
                            onChange={(e) =>
                              setDiscounts((d) => ({ ...d, [key]: e.target.value }))
                            }
                            inputMode="decimal"
                            placeholder="0"
                            aria-label={`Rabatt ${FRAME_VARIANT_LABELS[variant]} ${size}`}
                            className={`w-14 rounded-md border bg-background px-2 py-1.5 text-sm ${
                              validDisc ? "border-border" : "border-destructive"
                            }`}
                          />
                          <span className="text-xs text-muted-foreground">%</span>
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
                        {finalCents !== null && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Endpreis: {centsToEuro(finalCents)} €
                          </p>
                        )}
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

      {overrideProducts.length > 0 && (
        <section className="mt-8 rounded-xl border border-brass/40 bg-card p-4">
          <h2 className="text-sm font-medium text-walnut">
            Produkte mit eigenen Ausnahmepreisen
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Bei diesen Produkten wirken Änderungen an den Unterkategorie-Preisen nicht. Ausnahmen
            entfernen, damit wieder der Preis der Unterkategorie gilt.
          </p>
          <ul className="mt-3 space-y-2">
            {overrideProducts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                <span>
                  {p.name}{" "}
                  <span className="text-xs text-muted-foreground">({p.count} Preisfelder)</span>
                </span>
                <button
                  type="button"
                  onClick={() => onClearOverrides(p.id)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Ausnahmen entfernen
                </button>
              </li>
            ))}
          </ul>
        </section>
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

      <section className="mt-12">
        <h2 className="font-serif text-xl text-walnut">Holzbox-Preise</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Größen <strong>S, M, L</strong> mit Rabatt und Motiv-Aufpreisen — für alle Holzbox-Produkte
          gemeinsam oder für ein einzelnes Produkt.
        </p>
        <div className="mt-4">
          <HolzboxPriceTable />
        </div>
      </section>
    </div>
  );
}
