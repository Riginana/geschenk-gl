import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2, Upload } from "lucide-react";
import type { Motif, SizeVariant } from "@/lib/product-config";
import { sortMotifs, sortSizes } from "@/lib/product-config";
import {
  adminDeleteMotif,
  adminDeleteSizeVariant,
  adminListProductConfig,
  adminSeedSchiebeboxDefaults,
  adminUpsertMotif,
  adminUpsertSizeVariant,
} from "@/lib/admin-config.functions";
import { adminCreateUploadUrl } from "@/lib/admin.functions";

const inputCls =
  "w-full rounded-lg border border-border bg-cream px-3 py-2 text-sm text-walnut outline-none focus:border-brass";

type SizeDraft = Omit<SizeVariant, "id" | "product_id"> & { id?: string };
type MotifDraft = Omit<Motif, "id" | "product_id"> & { id?: string };

export function ProductConfigEditor({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const key = ["admin-product-config", productId] as const;
  const listFn = useServerFn(adminListProductConfig);
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => listFn({ data: { product_id: productId } }),
  });

  const upsertSize = useServerFn(adminUpsertSizeVariant);
  const deleteSize = useServerFn(adminDeleteSizeVariant);
  const upsertMotif = useServerFn(adminUpsertMotif);
  const deleteMotif = useServerFn(adminDeleteMotif);
  const seed = useServerFn(adminSeedSchiebeboxDefaults);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: key });
    void qc.invalidateQueries({ queryKey: ["product-config"] });
  };

  const sizeMut = useMutation({
    mutationFn: (d: SizeDraft) => upsertSize({ data: { ...d, product_id: productId } }),
    onSuccess: () => {
      toast.success("Größe gespeichert");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const sizeDel = useMutation({
    mutationFn: (id: string) => deleteSize({ data: { id } }),
    onSuccess: () => {
      toast.success("Größe gelöscht");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const motifMut = useMutation({
    mutationFn: (d: MotifDraft) => upsertMotif({ data: { ...d, product_id: productId } }),
    onSuccess: () => {
      toast.success("Motiv gespeichert");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const motifDel = useMutation({
    mutationFn: (id: string) => deleteMotif({ data: { id } }),
    onSuccess: () => {
      toast.success("Motiv gelöscht");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const seedMut = useMutation({
    mutationFn: () => seed({ data: { product_id: productId } }),
    onSuccess: () => {
      toast.success("Standardwerte angelegt");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Lade Konfiguration …</p>;

  const sizes = sortSizes(data?.sizes ?? []);
  const motifs = sortMotifs(data?.motifs ?? []);

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif text-lg text-walnut">Größen &amp; Preise</h3>
          <div className="flex gap-2">
            {(!sizes.length || !motifs.length) && (
              <button
                type="button"
                onClick={() => seedMut.mutate()}
                disabled={seedMut.isPending}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-walnut hover:bg-cream"
              >
                Standardwerte anlegen
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                sizeMut.mutate({
                  label: "Neu",
                  dimensions: "",
                  price_cents: 2400,
                  is_active: true,
                  is_default: sizes.length === 0,
                  sort_order: sizes.length + 1,
                })
              }
              className="inline-flex items-center gap-1 rounded-full bg-walnut px-3 py-1.5 text-xs text-cream"
            >
              <Plus size={13} /> Größe
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {sizes.map((s) => (
            <SizeRow
              key={s.id}
              size={s}
              onSave={(d) => sizeMut.mutate({ ...d, id: s.id })}
              onDelete={() => sizeDel.mutate(s.id)}
            />
          ))}
          {!sizes.length && (
            <p className="text-sm text-muted-foreground">Noch keine Größen angelegt.</p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif text-lg text-walnut">Motive</h3>
          <button
            type="button"
            onClick={() =>
              motifMut.mutate({
                number: motifs.length + 1,
                title: "Neues Motiv",
                description: "",
                predefined_text: "",
                preview_image_url: null,
                allows_custom_text: false,
                requires_custom_text: false,
                custom_text_max_length: 150,
                is_active: true,
                sort_order: motifs.length + 1,
                price_delta_cents: 0,
              })
            }
            className="inline-flex items-center gap-1 rounded-full bg-walnut px-3 py-1.5 text-xs text-cream"
          >
            <Plus size={13} /> Motiv
          </button>
        </div>
        <div className="space-y-4">
          {motifs.map((m) => (
            <MotifRow
              key={m.id}
              motif={m}
              productId={productId}
              onSave={(d) => motifMut.mutate({ ...d, id: m.id })}
              onDelete={() => motifDel.mutate(m.id)}
            />
          ))}
          {!motifs.length && <p className="text-sm text-muted-foreground">Noch keine Motive angelegt.</p>}
        </div>
      </section>
    </div>
  );
}

function SizeRow({
  size,
  onSave,
  onDelete,
}: {
  size: SizeVariant;
  onSave: (d: SizeDraft) => void;
  onDelete: () => void;
}) {
  const [d, setD] = useState<SizeDraft>({
    label: size.label,
    dimensions: size.dimensions,
    price_cents: size.price_cents,
    is_active: size.is_active,
    is_default: size.is_default,
    sort_order: size.sort_order,
  });
  const [euro, setEuro] = useState((size.price_cents / 100).toFixed(2));

  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[90px_1fr_120px_auto]">
      <label className="block">
        <span className="text-[11px] text-muted-foreground">Label</span>
        <input className={inputCls} value={d.label} onChange={(e) => setD({ ...d, label: e.target.value })} />
      </label>
      <label className="block">
        <span className="text-[11px] text-muted-foreground">Maße</span>
        <input
          className={inputCls}
          value={d.dimensions}
          placeholder="18 × 13 × 6 cm"
          onChange={(e) => setD({ ...d, dimensions: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="text-[11px] text-muted-foreground">Preis (€)</span>
        <input
          className={inputCls}
          inputMode="decimal"
          value={euro}
          onChange={(e) => {
            setEuro(e.target.value);
            const n = Number(e.target.value.replace(",", "."));
            if (Number.isFinite(n)) setD({ ...d, price_cents: Math.round(n * 100) });
          }}
        />
      </label>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex items-center gap-1.5 text-xs text-walnut">
          <input
            type="checkbox"
            checked={d.is_active}
            onChange={(e) => setD({ ...d, is_active: e.target.checked })}
          />
          Aktiv
        </label>
        <label className="flex items-center gap-1.5 text-xs text-walnut">
          <input
            type="checkbox"
            checked={d.is_default}
            onChange={(e) => setD({ ...d, is_default: e.target.checked })}
          />
          Standard
        </label>
        <label className="block w-20">
          <span className="text-[11px] text-muted-foreground">Reihenfolge</span>
          <input
            className={inputCls}
            type="number"
            value={d.sort_order}
            onChange={(e) => setD({ ...d, sort_order: Number(e.target.value) || 0 })}
          />
        </label>
        <button
          type="button"
          onClick={() => onSave(d)}
          className="rounded-full bg-walnut px-4 py-2 text-xs text-cream"
        >
          Speichern
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm(`Größe „${size.label}" löschen?`)) onDelete();
          }}
          aria-label="Größe löschen"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function MotifRow({
  motif,
  productId,
  onSave,
  onDelete,
}: {
  motif: Motif;
  productId: string;
  onSave: (d: MotifDraft) => void;
  onDelete: () => void;
}) {
  const [d, setD] = useState<MotifDraft>({
    number: motif.number,
    title: motif.title,
    description: motif.description,
    predefined_text: motif.predefined_text,
    preview_image_url: motif.preview_image_url,
    allows_custom_text: motif.allows_custom_text,
    requires_custom_text: motif.requires_custom_text,
    custom_text_max_length: motif.custom_text_max_length,
    is_active: motif.is_active,
    sort_order: motif.sort_order,
    price_delta_cents: motif.price_delta_cents ?? 0,
  });
  const [surcharge, setSurcharge] = useState(((motif.price_delta_cents ?? 0) / 100).toFixed(2));
  const [uploading, setUploading] = useState(false);
  const createUpload = useServerFn(adminCreateUploadUrl);

  const onFile = async (file: File) => {
    setUploading(true);
    try {
      const signed = await createUpload({
        data: {
          product_id: productId,
          filename: file.name,
          content_type: file.type,
          kind: "image",
          size: file.size,
        },
      });
      const res = await fetch(signed.signedUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("Upload fehlgeschlagen");
      setD((p) => ({ ...p, preview_image_url: signed.publicUrl }));
      toast.success("Bild hochgeladen – bitte speichern");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-[140px_1fr]">
      <div>
        <div className="aspect-square w-full overflow-hidden rounded-lg bg-linen">
          {d.preview_image_url ? (
            <img
              src={d.preview_image_url}
              alt={`Motiv ${d.number}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-xs text-muted-foreground">
              kein Bild
            </span>
          )}
        </div>
        <label className="mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-walnut hover:bg-cream">
          <Upload size={12} />
          {uploading ? "Lädt …" : "Bild wählen"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              e.target.value = "";
            }}
          />
        </label>
        {d.preview_image_url && (
          <button
            type="button"
            onClick={() => setD({ ...d, preview_image_url: null })}
            className="mt-1 w-full text-[11px] text-muted-foreground hover:text-destructive"
          >
            Bild entfernen
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[80px_1fr]">
          <label className="block">
            <span className="text-[11px] text-muted-foreground">Nr.</span>
            <input
              className={inputCls}
              type="number"
              value={d.number}
              onChange={(e) => setD({ ...d, number: Number(e.target.value) || 1 })}
            />
          </label>
          <label className="block">
            <span className="text-[11px] text-muted-foreground">Titel</span>
            <input className={inputCls} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} />
          </label>
        </div>
        <label className="block">
          <span className="text-[11px] text-muted-foreground">Beschreibung</span>
          <input
            className={inputCls}
            value={d.description}
            onChange={(e) => setD({ ...d, description: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-muted-foreground">Vorgegebener Text</span>
          <textarea
            rows={2}
            className={`${inputCls} resize-none`}
            value={d.predefined_text}
            onChange={(e) => setD({ ...d, predefined_text: e.target.value })}
          />
        </label>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex items-center gap-1.5 text-xs text-walnut">
            <input
              type="checkbox"
              checked={d.allows_custom_text}
              onChange={(e) =>
                setD({
                  ...d,
                  allows_custom_text: e.target.checked,
                  requires_custom_text: e.target.checked ? d.requires_custom_text : false,
                })
              }
            />
            Wunschtext erlaubt
          </label>
          <label className="flex items-center gap-1.5 text-xs text-walnut">
            <input
              type="checkbox"
              disabled={!d.allows_custom_text}
              checked={d.requires_custom_text}
              onChange={(e) => setD({ ...d, requires_custom_text: e.target.checked })}
            />
            Pflichtfeld
          </label>
          <label className="block w-24">
            <span className="text-[11px] text-muted-foreground">Max. Zeichen</span>
            <input
              className={inputCls}
              type="number"
              value={d.custom_text_max_length}
              onChange={(e) => setD({ ...d, custom_text_max_length: Number(e.target.value) || 150 })}
            />
          </label>
          <label className="block w-28">
            <span className="text-[11px] text-muted-foreground">Aufpreis (€)</span>
            <input
              className={inputCls}
              inputMode="decimal"
              value={surcharge}
              onChange={(e) => {
                setSurcharge(e.target.value);
                const n = Number(e.target.value.replace(",", "."));
                if (Number.isFinite(n) && n >= 0) setD({ ...d, price_delta_cents: Math.round(n * 100) });
              }}
            />
          </label>
          <label className="block w-24">
            <span className="text-[11px] text-muted-foreground">Reihenfolge</span>
            <input
              className={inputCls}
              type="number"
              value={d.sort_order}
              onChange={(e) => setD({ ...d, sort_order: Number(e.target.value) || 0 })}
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-walnut">
            <input
              type="checkbox"
              checked={d.is_active}
              onChange={(e) => setD({ ...d, is_active: e.target.checked })}
            />
            Aktiv
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSave(d)}
            className="rounded-full bg-walnut px-4 py-2 text-xs text-cream"
          >
            Speichern
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Motiv „${motif.title}" löschen?`)) onDelete();
            }}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 size={14} /> Löschen
          </button>
        </div>
      </div>
    </div>
  );
}
