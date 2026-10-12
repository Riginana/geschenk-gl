import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  adminListProducts,
  adminUpdateProduct,
  adminBulkSetActive,
  adminSetFrameMaterial,
  adminCreateProduct,
  adminDeleteProduct,
  adminCreateUploadUrl,
  adminAddImage,
  type AdminProductRow,
} from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";

const FRAME_MATERIAL_OPTIONS = [
  { value: "papier", label: "Papier" },
  { value: "holz", label: "Holz" },
  { value: "hdf", label: "HDF" },
] as const;

const CATEGORY_OPTIONS = [
  "bilderrahmen",
  "holzbox",
  "holzschild",
  "schiebebox",
  "holzplatte",
  "sculpture",
  "other",
];


export const Route = createFileRoute("/admin/products/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Produkte — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminProductsList,
});

function AdminProductsList() {
  const navigate = useNavigate();
  const list = useServerFn(adminListProducts);
  const update = useServerFn(adminUpdateProduct);
  const bulk = useServerFn(adminBulkSetActive);
  const setFrameMaterial = useServerFn(adminSetFrameMaterial);
  const createProduct = useServerFn(adminCreateProduct);
  const deleteProduct = useServerFn(adminDeleteProduct);

  const [rows, setRows] = useState<AdminProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [fOccasion, setFOccasion] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [fFrameMaterial, setFFrameMaterial] = useState("");
  const [fActive, setFActive] = useState<"all" | "1" | "0">("all");
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name_de: "",
    name_en: "",
    occasion: "",
    category: "other",
    frame_material: "papier",
    price: "",
  });
  const createUpload = useServerFn(adminCreateUploadUrl);
  const addImg = useServerFn(adminAddImage);
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [photoProgress, setPhotoProgress] = useState("");

  function addPhotos(list: FileList | File[] | null) {
    if (!list) return;
    const ok: { file: File; url: string }[] = [];
    for (const f of Array.from(list)) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
        toast.error(`${f.name}: nur JPG, PNG, WebP`);
        continue;
      }
      if (f.size > 20 * 1024 * 1024) {
        toast.error(`${f.name}: größer als 20 MB`);
        continue;
      }
      ok.push({ file: f, url: URL.createObjectURL(f) });
    }
    setPhotos((p) => [...p, ...ok]);
  }
  function removePhoto(i: number) {
    setPhotos((p) => {
      URL.revokeObjectURL(p[i].url);
      return p.filter((_, j) => j !== i);
    });
    setHeroIndex((h) => (i === h ? 0 : i < h ? h - 1 : h));
  }
  function movePhoto(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= photos.length) return;
    setPhotos((p) => {
      const n = [...p];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
    setHeroIndex((h) => (h === i ? j : h === j ? i : h));
  }
  function clearPhotos() {
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos([]);
    setHeroIndex(0);
    setPhotoProgress("");
  }


  async function reload() {
    setLoading(true);
    try {
      const data = await list();
      setRows(data);
    } catch (e: any) {
      toast.error(e?.message ?? "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  const occasions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.occasion).filter(Boolean))).sort(),
    [rows],
  );
  const categories = useMemo(
    () => Array.from(new Set(rows.map((r) => r.category ?? "").filter(Boolean))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (fOccasion && r.occasion !== fOccasion) return false;
      if (fCategory && r.category !== fCategory) return false;
      if (fFrameMaterial && (r.frame_material ?? "holz") !== fFrameMaterial) return false;
      if (fActive === "1" && !r.is_active) return false;
      if (fActive === "0" && r.is_active) return false;
      if (q && !(r.name_de?.toLowerCase().includes(q) || r.name_en?.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [rows, search, fOccasion, fCategory, fFrameMaterial, fActive]);

  const allChecked = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  function toggleOne(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }
  function toggleAll() {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  }

  async function patch(id: string, patchData: Partial<AdminProductRow>) {
    try {
      await update({ data: { id, patch: patchData as any } });
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patchData } : r)));
    } catch (e: any) {
      toast.error(e?.message ?? "Fehler");
    }
  }

  async function bulkToggle(v: boolean) {
    if (selected.size === 0) return;
    try {
      await bulk({ data: { ids: Array.from(selected), is_active: v } });
      toast.success(`${selected.size} aktualisiert`);
      setSelected(new Set());
      reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Fehler");
    }
  }

  async function bulkFrameMaterial(v: "papier" | "holz" | "hdf") {
    if (selected.size === 0) return;
    try {
      await setFrameMaterial({ data: { ids: Array.from(selected), frame_material: v } });
      toast.success(`${selected.size} Produkte → ${v}`);
      setSelected(new Set());
      reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Fehler");
    }
  }

  async function submitNew(e: React.FormEvent) {
    e.preventDefault();
    const price = Math.round(parseFloat(form.price.replace(",", ".")) * 100);
    if (!form.name_de.trim()) return toast.error("Name (DE) ist erforderlich");
    if (!form.occasion.trim()) return toast.error("Anlass ist erforderlich");
    if (!Number.isFinite(price) || price < 0) return toast.error("Ungültiger Preis");
    setCreating(true);
    try {
      const res = await createProduct({
        data: {
          name_de: form.name_de.trim(),
          name_en: form.name_en.trim() || undefined,
          occasion: form.occasion.trim(),
          category: form.category,
          frame_material: form.category === "bilderrahmen" ? (form.frame_material as "papier" | "holz" | "hdf") : undefined,
          base_price_cents: price,
        },
      });
      const failed: string[] = [];
      let heroUrl: string | null = null;
      for (let i = 0; i < photos.length; i++) {
        const f = photos[i].file;
        setPhotoProgress(`${i + 1} / ${photos.length} Fotos`);
        try {
          const signed = await createUpload({
            data: { product_id: res.id, filename: f.name, content_type: f.type, kind: "image", size: f.size },
          });
          const { error: upErr } = await supabase.storage
            .from(signed.bucket)
            .uploadToSignedUrl(signed.path, signed.token, f, { contentType: f.type });
          if (upErr) throw upErr;
          const isHero = i === heroIndex;
          await addImg({
            data: { product_id: res.id, url: signed.publicUrl, role: isHero ? "hero" : "gallery", sort_order: i },
          });
          if (isHero) heroUrl = signed.publicUrl;
        } catch {
          failed.push(f.name);
        }
      }
      if (heroUrl) {
        try { await update({ data: { id: res.id, patch: { hero_image: heroUrl } as any } }); } catch { /* ignore */ }
      }
      if (failed.length) toast.error(`Nicht hochgeladen: ${failed.join(", ")}`);
      toast.success("Produkt erstellt (Entwurf)");
      clearPhotos();
      setShowNew(false);
      setForm({ name_de: "", name_en: "", occasion: "", category: "other", frame_material: "papier", price: "" });
      navigate({ to: "/admin/products/$id", params: { id: res.id } });
    } catch (err: any) {
      toast.error(err?.message ?? "Fehler");
    } finally {
      setCreating(false);
    }
  }

  async function removeProduct(r: AdminProductRow) {
    if (!window.confirm(`Produkt „${r.name_de}" wird unwiderruflich gelöscht. Fortfahren?`)) return;
    try {
      await deleteProduct({ data: { id: r.id } });
      setRows((rs) => rs.filter((x) => x.id !== r.id));
      toast.success("Produkt gelöscht");
    } catch (e: any) {
      toast.error(e?.message ?? "Fehler");
    }
  }


  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-walnut">Produkte</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Gesamt: {rows.length} • Angezeigt: {filtered.length}
          </div>
          <button
            className="rounded-md bg-walnut px-4 py-2 text-sm text-cream hover:opacity-90"
            onClick={() => setShowNew(true)}
          >
            + Neues Produkt
          </button>
        </div>
      </div>

      <p className="mb-5 text-xs text-muted-foreground">
        Ablauf: Produkt anlegen → im Editor Fotos/Video hochladen, Beschreibung & Preis pflegen →
        Schalter <strong>Veröffentlicht</strong> aktivieren → Produkt erscheint im Shop.
      </p>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={submitNew}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-xl"
          >
            <h2 className="mb-4 font-serif text-xl text-walnut">Neues Produkt</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Name (DE) *</label>
                <input
                  autoFocus
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.name_de}
                  onChange={(e) => setForm({ ...form, name_de: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Name (EN)</label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.name_en}
                  onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Anlass *</label>
                <input
                  list="occasion-options"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.occasion}
                  onChange={(e) => setForm({ ...form, occasion: e.target.value })}
                />
                <datalist id="occasion-options">
                  {occasions.map((o) => (
                    <option key={o} value={o} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Kategorie</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              {form.category === "bilderrahmen" && (
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Unterkategorie (Rahmenpreise)</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.frame_material}
                    onChange={(e) => setForm({ ...form, frame_material: e.target.value })}
                  >
                    <option value="papier">Papier</option>
                    <option value="holz">Holz</option>
                    <option value="hdf">HDF</option>
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Grundpreis € *</label>
                <input
                  inputMode="decimal"
                  placeholder="26.00"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs text-muted-foreground">Fotos (JPG, PNG, WebP, max. 20 MB)</label>
              <label
                className="flex cursor-pointer items-center justify-center rounded-md border border-dashed border-input bg-background px-3 py-4 text-sm text-muted-foreground"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); addPhotos(e.dataTransfer.files); }}
              >
                Fotos auswählen oder hierher ziehen
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  aria-label="Fotos auswählen"
                  onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }}
                />
              </label>
              {photos.length > 0 && (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {photos.map((p, i) => (
                    <div key={p.url} className="relative">
                      <button
                        type="button"
                        title="Als Hauptbild setzen"
                        onClick={() => setHeroIndex(i)}
                        className={`block aspect-square w-full overflow-hidden rounded-md border-2 ${i === heroIndex ? "border-walnut" : "border-transparent"}`}
                      >
                        <img src={p.url} alt={p.file.name} className="h-full w-full object-cover" />
                      </button>
                      {i === heroIndex && (
                        <span className="absolute left-1 top-1 rounded bg-walnut px-1 text-[10px] text-cream">★ Haupt</span>
                      )}
                      <div className="mt-1 flex justify-between text-xs">
                        <button type="button" aria-label="Nach links" onClick={() => movePhoto(i, -1)}>←</button>
                        <button type="button" aria-label="Entfernen" onClick={() => removePhoto(i)}>×</button>
                        <button type="button" aria-label="Nach rechts" onClick={() => movePhoto(i, 1)}>→</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-border px-4 py-2 text-sm"
                onClick={() => { clearPhotos(); setShowNew(false); }}
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={creating}
                className="rounded-md bg-walnut px-4 py-2 text-sm text-cream disabled:opacity-60"
              >
                {creating ? (photoProgress ? `Lädt ${photoProgress}…` : "Wird angelegt…") : "Anlegen & bearbeiten"}
              </button>
            </div>
          </form>
        </div>
      )}


      <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4">
        <input
          className="min-w-[220px] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Suche nach Name/Slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={fOccasion}
          onChange={(e) => setFOccasion(e.target.value)}
        >
          <option value="">Alle Anlässe</option>
          {occasions.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={fCategory}
          onChange={(e) => setFCategory(e.target.value)}
        >
          <option value="">Alle Kategorien</option>
          {categories.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={fFrameMaterial}
          onChange={(e) => setFFrameMaterial(e.target.value)}
        >
          <option value="">Alle Unterkategorien</option>
          {FRAME_MATERIAL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={fActive}
          onChange={(e) => setFActive(e.target.value as any)}
        >
          <option value="all">Alle Status</option>
          <option value="1">Nur veröffentlicht</option>
          <option value="0">Nur Entwürfe</option>
        </select>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-border bg-accent/40 px-4 py-2 text-sm">
          <span>Ausgewählt: {selected.size}</span>
          <button className="rounded-md bg-walnut px-3 py-1 text-cream" onClick={() => bulkToggle(true)}>
            Veröffentlichen
          </button>
          <button className="rounded-md border border-border px-3 py-1" onClick={() => bulkToggle(false)}>
            Entwurf
          </button>
          <span className="ml-2 text-xs text-muted-foreground">Unterkategorie:</span>
          {FRAME_MATERIAL_OPTIONS.map((o) => (
            <button
              key={o.value}
              className="rounded-md border border-border px-3 py-1"
              onClick={() => bulkFrameMaterial(o.value)}
            >
              {o.label}
            </button>
          ))}
          <button className="ml-auto text-xs text-muted-foreground underline" onClick={() => setSelected(new Set())}>
            Zurücksetzen
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-10 px-3 py-2">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} />
              </th>
              <th className="w-16 px-3 py-2">Foto</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Anlass</th>
              <th className="px-3 py-2">Kategorie</th>
              <th className="px-3 py-2">Unterkat.</th>
              <th className="px-3 py-2">Preis €</th>
              <th className="px-3 py-2">Rabatt %</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Best</th>
              <th className="px-3 py-2">Feat</th>
              <th className="px-3 py-2">Stock</th>
              <th className="px-3 py-2">Sort</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={14} className="px-3 py-6 text-center text-muted-foreground">Wird geladen…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={14} className="px-3 py-6 text-center text-muted-foreground">Keine Produkte</td></tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} />
                </td>
                <td className="px-3 py-2">
                  {r.hero_image ? (
                    <img src={r.hero_image} alt="" className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted" />
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium">{r.name_de}</div>
                  <div className="text-xs text-muted-foreground">{r.slug}</div>
                </td>
                <td className="px-3 py-2">{r.occasion}</td>
                <td className="px-3 py-2">{r.category ?? "—"}</td>
                <td className="px-3 py-2">
                  {r.category === "bilderrahmen" ? (
                    <select
                      className="rounded border border-input bg-background px-2 py-1 text-xs"
                      value={r.frame_material ?? "holz"}
                      onChange={(e) => patch(r.id, { frame_material: e.target.value })}
                    >
                      {FRAME_MATERIAL_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2">{(r.base_price_cents / 100).toFixed(2)}</td>
                <td className="px-3 py-2">{r.discount_percent}</td>
                <td className="px-3 py-2">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={r.is_active}
                      onChange={(e) => patch(r.id, { is_active: e.target.checked })}
                    />
                    <span className={r.is_active ? "text-emerald-700" : "text-muted-foreground"}>
                      {r.is_active ? "Veröffentlicht" : "Entwurf"}
                    </span>
                  </label>
                </td>
                <td className="px-3 py-2">
                  <input type="checkbox" checked={r.is_bestseller}
                    onChange={(e) => patch(r.id, { is_bestseller: e.target.checked })} />
                </td>
                <td className="px-3 py-2">
                  <input type="checkbox" checked={r.is_featured}
                    onChange={(e) => patch(r.id, { is_featured: e.target.checked })} />
                </td>
                <td className="px-3 py-2">
                  <input type="checkbox" checked={r.in_stock}
                    onChange={(e) => patch(r.id, { in_stock: e.target.checked })} />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    className="w-16 rounded border border-input bg-background px-2 py-1 text-sm"
                    defaultValue={r.sort_order ?? 0}
                    onBlur={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!Number.isNaN(v) && v !== (r.sort_order ?? 0)) patch(r.id, { sort_order: v });
                    }}
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Link
                      to="/admin/products/$id"
                      params={{ id: r.id }}
                      className="rounded-md border border-border px-3 py-1 text-xs hover:bg-accent"
                    >
                      Bearbeiten
                    </Link>
                    <button
                      onClick={() => removeProduct(r)}
                      className="rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                    >
                      Löschen
                    </button>
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
