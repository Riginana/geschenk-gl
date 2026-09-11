import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { adminListHolzboxConfig, adminBulkUpsertHolzbox } from "@/lib/admin-config.functions";
import { HOLZBOX_SIZE_LABELS, clampPercent, sortMotifs } from "@/lib/product-config";

const ALL = "__all__";

function centsToEuro(c: number) {
  return (c / 100).toFixed(2);
}

function euroToCents(v: string): number | null {
  const n = Number(v.trim().replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function fmtEuro(cents: number) {
  return (cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

type SizeDraft = Record<string, { price: string; discount: string }>;

/** Central Holzbox price table: sizes S/M/L with discount + motif surcharges. */
export function HolzboxPriceTable() {
  const [target, setTarget] = useState<string>(ALL);
  const [sizeDraft, setSizeDraft] = useState<SizeDraft>({});
  const [motifDraft, setMotifDraft] = useState<Record<number, string>>({});
  const [bulkDiscount, setBulkDiscount] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const q = useQuery({ queryKey: ["admin", "holzbox-config"], queryFn: () => adminListHolzboxConfig() });
  const products = q.data?.products ?? [];
  const sizes = q.data?.sizes ?? [];
  const motifs = q.data?.motifs ?? [];

  const referenceProductId = target === ALL ? products[0]?.id ?? null : target;

  /** Motif numbers + titles taken from the reference product. */
  const motifRows = useMemo(() => {
    if (!referenceProductId) return [];
    return sortMotifs(motifs.filter((m) => m.product_id === referenceProductId));
  }, [motifs, referenceProductId]);

  useEffect(() => {
    const nextSizes: SizeDraft = {};
    for (const label of HOLZBOX_SIZE_LABELS) {
      const row = sizes.find(
        (s) => s.product_id === referenceProductId && s.label.toLowerCase() === label.toLowerCase(),
      );
      nextSizes[label] = row
        ? { price: centsToEuro(row.price_cents), discount: String(clampPercent(row.discount_percent)) }
        : { price: "", discount: "" };
    }
    setSizeDraft(nextSizes);
    const nextMotifs: Record<number, string> = {};
    for (const m of motifRows) nextMotifs[m.number] = centsToEuro(m.price_delta_cents ?? 0);
    setMotifDraft(nextMotifs);
  }, [q.data, target, referenceProductId]);

  /** Products whose size prices differ from the reference product. */
  const differing = useMemo(() => {
    if (!referenceProductId) return [];
    const key = (pid: string) =>
      HOLZBOX_SIZE_LABELS.map((l) => {
        const r = sizes.find((s) => s.product_id === pid && s.label.toLowerCase() === l.toLowerCase());
        return r ? `${r.price_cents}/${clampPercent(r.discount_percent)}` : "-";
      }).join("|");
    const ref = key(referenceProductId);
    return products.filter((p) => p.id !== referenceProductId && key(p.id) !== ref);
  }, [products, sizes, referenceProductId]);

  const applyBulkDiscount = () => {
    const n = Number(bulkDiscount.trim().replace(",", "."));
    if (bulkDiscount.trim() === "" || !Number.isFinite(n) || n < 0 || n > 100) {
      toast.error("Bitte einen Rabatt zwischen 0 und 100 angeben");
      return;
    }
    const value = String(Math.round(n));
    setSizeDraft((d) => {
      const next: SizeDraft = {};
      for (const label of HOLZBOX_SIZE_LABELS) {
        next[label] = { ...(d[label] ?? { price: "", discount: "" }), discount: value };
      }
      return next;
    });
    toast.success(`Rabatt ${value} % eingetragen — jetzt speichern`);
  };

  const onSave = async () => {
    const sizeEntries: Array<{ label: string; priceCents: number; discountPercent: number }> = [];
    for (const label of HOLZBOX_SIZE_LABELS) {
      const d = sizeDraft[label] ?? { price: "", discount: "" };
      if (d.price.trim() === "") continue;
      const cents = euroToCents(d.price);
      const disc = d.discount.trim() === "" ? 0 : Number(d.discount.trim().replace(",", "."));
      if (cents === null || !Number.isFinite(disc) || disc < 0 || disc > 100) {
        toast.error(`Ungültiger Wert bei Größe ${label}`);
        return;
      }
      sizeEntries.push({ label, priceCents: cents, discountPercent: Math.round(disc) });
    }
    const motifEntries: Array<{ number: number; surchargeCents: number }> = [];
    for (const m of motifRows) {
      const raw = motifDraft[m.number] ?? "";
      if (raw.trim() === "") continue;
      const cents = euroToCents(raw);
      if (cents === null) {
        toast.error(`Ungültiger Aufpreis bei Motiv ${m.number}`);
        return;
      }
      motifEntries.push({ number: m.number, surchargeCents: cents });
    }
    if (!sizeEntries.length && !motifEntries.length) {
      toast.error("Keine Werte zum Speichern");
      return;
    }
    setSaving(true);
    try {
      const res = await adminBulkUpsertHolzbox({
        data: { productId: target === ALL ? null : target, sizes: sizeEntries, motifs: motifEntries },
      });
      toast.success(`Gespeichert für ${res.products} Produkt(e)`);
      await q.refetch();
      await queryClient.invalidateQueries({ queryKey: ["product-config"] });
      await queryClient.invalidateQueries({ queryKey: ["catalog-pricing"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  if (q.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Lädt…
      </div>
    );
  }

  if (!products.length) {
    return <p className="text-sm text-muted-foreground">Keine aktiven Holzbox-Produkte gefunden.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="min-w-72 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value={ALL}>Alle Holzbox-Produkte ({products.length})</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name_de}
            </option>
          ))}
        </select>
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-walnut px-4 py-2 text-sm text-cream disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Speichern
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <span className="text-sm text-muted-foreground">Rabatt für alle Größen setzen:</span>
        <input
          value={bulkDiscount}
          onChange={(e) => setBulkDiscount(e.target.value)}
          inputMode="decimal"
          placeholder="z. B. 30"
          aria-label="Rabatt für alle Größen"
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

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 font-medium">Größe</th>
              <th className="px-4 py-3 font-medium">Preis (€)</th>
              <th className="px-4 py-3 font-medium">Rabatt (%)</th>
              <th className="px-4 py-3 font-medium">Endpreis</th>
            </tr>
          </thead>
          <tbody>
            {HOLZBOX_SIZE_LABELS.map((label) => {
              const d = sizeDraft[label] ?? { price: "", discount: "" };
              const cents = d.price.trim() === "" ? null : euroToCents(d.price);
              const disc = d.discount.trim() === "" ? 0 : Number(d.discount.trim().replace(",", "."));
              const validDisc = Number.isFinite(disc) && disc >= 0 && disc <= 100;
              const final = cents !== null && validDisc ? Math.round(cents * (1 - disc / 100)) : null;
              return (
                <tr key={label} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-2 font-medium text-walnut">{label}</td>
                  <td className="px-4 py-2">
                    <input
                      value={d.price}
                      onChange={(e) =>
                        setSizeDraft((x) => ({ ...x, [label]: { ...d, price: e.target.value } }))
                      }
                      inputMode="decimal"
                      aria-label={`Preis Größe ${label}`}
                      className="w-24 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={d.discount}
                      onChange={(e) =>
                        setSizeDraft((x) => ({ ...x, [label]: { ...d, discount: e.target.value } }))
                      }
                      inputMode="decimal"
                      placeholder="0"
                      aria-label={`Rabatt Größe ${label}`}
                      className="w-20 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2 font-medium text-walnut">
                    {final !== null ? fmtEuro(final) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {motifRows.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-card p-3">
          <h3 className="text-sm font-medium text-walnut">Motiv-Aufpreise</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Aufpreis wird zum Preis der gewählten Größe addiert (vor Rabatt).
          </p>
          <div className="mt-3 space-y-2">
            {motifRows.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center gap-3">
                <span className="min-w-56 text-sm">
                  Motiv {m.number} — {m.title}
                </span>
                <input
                  value={motifDraft[m.number] ?? ""}
                  onChange={(e) => setMotifDraft((x) => ({ ...x, [m.number]: e.target.value }))}
                  inputMode="decimal"
                  aria-label={`Aufpreis Motiv ${m.number}`}
                  className="w-24 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                />
                <span className="text-xs text-muted-foreground">€</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {target === ALL && differing.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Abweichende Preise bei: {differing.map((p) => p.name_de).join(", ")}. Speichern setzt alle
          Holzbox-Produkte auf die Werte oben.
        </p>
      )}
    </div>
  );
}
