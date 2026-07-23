import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  adminGetProduct,
  adminUpdateProduct,
  adminAddImage,
  adminDeleteImage,
  adminReorderImages,
  adminAddVariant,
  adminUpdateVariant,
  adminDeleteVariant,
  type AdminProductRow,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/products/$id")({
  ssr: false,
  head: () => ({ meta: [{ title: "Товар — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminProductEdit,
});

type ImageRow = { id: string; product_id: string; url: string; role: string; alt: string | null; sort_order: number };
type VariantRow = { id: string; product_id: string; format: string | null; material: string; price_cents: number; is_default: boolean; sort_order: number };

function AdminProductEdit() {
  const { id } = Route.useParams();
  const get = useServerFn(adminGetProduct);
  const update = useServerFn(adminUpdateProduct);
  const addImg = useServerFn(adminAddImage);
  const delImg = useServerFn(adminDeleteImage);
  const reorderImg = useServerFn(adminReorderImages);
  const addVar = useServerFn(adminAddVariant);
  const updVar = useServerFn(adminUpdateVariant);
  const delVar = useServerFn(adminDeleteVariant);

  const [product, setProduct] = useState<AdminProductRow | null>(null);
  const [images, setImages] = useState<ImageRow[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newImgUrl, setNewImgUrl] = useState("");
  const [newImgRole, setNewImgRole] = useState("gallery");
  const [newVar, setNewVar] = useState({ format: "", material: "", price_cents: 0 });

  async function reload() {
    setLoading(true);
    try {
      const r = await get({ data: { id } });
      setProduct(r.product);
      setImages(r.images as ImageRow[]);
      setVariants(r.variants as VariantRow[]);
    } catch (e: any) {
      toast.error(e?.message ?? "Fehler");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { reload(); }, [id]);

  async function saveField<K extends keyof AdminProductRow>(field: K, value: AdminProductRow[K]) {
    if (!product) return;
    setSaving(true);
    try {
      await update({ data: { id, patch: { [field]: value } as any } });
      setProduct({ ...product, [field]: value });
    } catch (e: any) {
      toast.error(e?.message ?? "Fehler");
    } finally {
      setSaving(false);
    }
  }

  async function onAddImage() {
    if (!newImgUrl) return;
    try {
      const row = await addImg({ data: { product_id: id, url: newImgUrl, role: newImgRole, sort_order: images.length } });
      setImages([...images, row as ImageRow]);
      setNewImgUrl("");
      toast.success("Bild hinzugefügt");
    } catch (e: any) { toast.error(e?.message ?? "Fehler"); }
  }

  async function onDeleteImage(imgId: string) {
    if (!confirm("Löschen?")) return;
    try {
      await delImg({ data: { id: imgId } });
      setImages(images.filter((i) => i.id !== imgId));
    } catch (e: any) { toast.error(e?.message ?? "Fehler"); }
  }

  async function moveImage(imgId: string, dir: -1 | 1) {
    const idx = images.findIndex((i) => i.id === imgId);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= images.length) return;
    const next = images.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    const withOrder = next.map((im, i) => ({ ...im, sort_order: i }));
    setImages(withOrder);
    try {
      await reorderImg({ data: { items: withOrder.map(({ id: iid, sort_order }) => ({ id: iid, sort_order })) } });
    } catch (e: any) { toast.error(e?.message ?? "Fehler"); }
  }

  async function onAddVariant() {
    if (!newVar.material) { toast.error("Material erforderlich"); return; }
    try {
      const row = await addVar({ data: { product_id: id, format: newVar.format || null, material: newVar.material, price_cents: newVar.price_cents, sort_order: variants.length } });
      setVariants([...variants, row as VariantRow]);
      setNewVar({ format: "", material: "", price_cents: 0 });
    } catch (e: any) { toast.error(e?.message ?? "Fehler"); }
  }

  async function patchVariant(vid: string, patch: Partial<VariantRow>) {
    try {
      await updVar({ data: { id: vid, patch: patch as any } });
      setVariants((vs) => vs.map((v) => (v.id === vid ? { ...v, ...patch } : v)));
    } catch (e: any) { toast.error(e?.message ?? "Fehler"); }
  }

  async function onDeleteVariant(vid: string) {
    if (!confirm("Löschen?")) return;
    try {
      await delVar({ data: { id: vid } });
      setVariants(variants.filter((v) => v.id !== vid));
    } catch (e: any) { toast.error(e?.message ?? "Fehler"); }
  }

  async function setDefaultVariant(vid: string) {
    await patchVariant(vid, { is_default: true });
    setVariants((vs) => vs.map((v) => ({ ...v, is_default: v.id === vid })));
  }

  if (loading) return <div className="text-muted-foreground">Загрузка…</div>;
  if (!product) return <div>Не найдено</div>;

  return (
    <div className="max-w-5xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link to="/admin/products" className="text-sm text-muted-foreground hover:underline">← Товары</Link>
          <h1 className="mt-1 font-serif text-2xl text-walnut">{product.name_de}</h1>
        </div>
        <div className="text-xs text-muted-foreground">{saving ? "Сохраняю…" : "Сохранено"}</div>
      </div>

      {/* Base fields */}
      <section className="mb-6 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 font-serif text-lg">Основные поля</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Name (DE)" value={product.name_de} onSave={(v) => saveField("name_de", v)} />
          <TextField label="Name (EN)" value={product.name_en} onSave={(v) => saveField("name_en", v)} />
          <TextField label="Slug" value={product.slug} onSave={(v) => saveField("slug", v)} />
          <TextField label="Occasion" value={product.occasion} onSave={(v) => saveField("occasion", v)} />
          <TextField label="Category" value={product.category ?? ""} onSave={(v) => saveField("category", (v || null) as any)} />
          <TextField label="Material" value={product.material} onSave={(v) => saveField("material", v)} />
          <TextField label="Material label" value={product.material_label ?? ""} onSave={(v) => saveField("material_label", (v || null) as any)} />
          <TextField label="Badge" value={product.badge ?? ""} onSave={(v) => saveField("badge", (v || null) as any)} />
          <NumberField label="Basispreis (Cent)" value={product.base_price_cents} onSave={(v) => saveField("base_price_cents", v)} />
          <NumberField label="Discount %" value={product.discount_percent} onSave={(v) => saveField("discount_percent", v)} />
          <NumberField label="Sort order" value={product.sort_order ?? 0} onSave={(v) => saveField("sort_order", v)} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextArea label="Beschreibung (DE)" value={product.description_de ?? ""} onSave={(v) => saveField("description_de", v)} />
          <TextArea label="Description (EN)" value={product.description_en ?? ""} onSave={(v) => saveField("description_en", v)} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField label="hero_image URL" value={product.hero_image ?? ""} onSave={(v) => saveField("hero_image", (v || null) as any)} />
          <TextField label="hover_image URL" value={product.hover_image ?? ""} onSave={(v) => saveField("hover_image", (v || null) as any)} />
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <Toggle label="is_active" value={product.is_active} onSave={(v) => saveField("is_active", v)} />
          <Toggle label="is_bestseller" value={product.is_bestseller} onSave={(v) => saveField("is_bestseller", v)} />
          <Toggle label="is_featured" value={product.is_featured} onSave={(v) => saveField("is_featured", v)} />
          <Toggle label="in_stock" value={product.in_stock} onSave={(v) => saveField("in_stock", v)} />
        </div>
      </section>

      {/* Images */}
      <section className="mb-6 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 font-serif text-lg">Галерея ({images.length})</h2>
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <input
            className="min-w-[280px] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="URL нового изображения"
            value={newImgUrl}
            onChange={(e) => setNewImgUrl(e.target.value)}
          />
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={newImgRole}
            onChange={(e) => setNewImgRole(e.target.value)}
          >
            <option value="gallery">gallery</option>
            <option value="product">product</option>
            <option value="hero">hero</option>
            <option value="thumbnail">thumbnail</option>
          </select>
          <button onClick={onAddImage} className="rounded-md bg-walnut px-4 py-2 text-sm text-cream">Добавить</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {images.map((im, i) => (
            <div key={im.id} className="flex gap-3 rounded-lg border border-border p-2">
              <img src={im.url} alt="" className="h-24 w-24 rounded object-cover" />
              <div className="flex flex-1 flex-col justify-between text-xs">
                <div>
                  <div className="text-muted-foreground">{im.role}</div>
                  <div className="truncate" title={im.url}>{im.url}</div>
                </div>
                <div className="flex gap-1">
                  <button className="rounded border border-border px-2 py-1" onClick={() => moveImage(im.id, -1)} disabled={i === 0}>↑</button>
                  <button className="rounded border border-border px-2 py-1" onClick={() => moveImage(im.id, 1)} disabled={i === images.length - 1}>↓</button>
                  <button className="ml-auto rounded border border-destructive px-2 py-1 text-destructive" onClick={() => onDeleteImage(im.id)}>Löschen</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Variants */}
      <section className="mb-6 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 font-serif text-lg">Варианты ({variants.length})</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-2 py-1">Format</th>
              <th className="px-2 py-1">Material</th>
              <th className="px-2 py-1">Preis (Cent)</th>
              <th className="px-2 py-1">Default</th>
              <th className="px-2 py-1">Sort</th>
              <th className="px-2 py-1"></th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => (
              <tr key={v.id} className="border-t border-border">
                <td className="px-2 py-1">
                  <input className="w-24 rounded border border-input bg-background px-2 py-1"
                    defaultValue={v.format ?? ""} onBlur={(e) => patchVariant(v.id, { format: e.target.value || null })} />
                </td>
                <td className="px-2 py-1">
                  <input className="w-32 rounded border border-input bg-background px-2 py-1"
                    defaultValue={v.material} onBlur={(e) => e.target.value && patchVariant(v.id, { material: e.target.value })} />
                </td>
                <td className="px-2 py-1">
                  <input type="number" className="w-24 rounded border border-input bg-background px-2 py-1"
                    defaultValue={v.price_cents} onBlur={(e) => patchVariant(v.id, { price_cents: parseInt(e.target.value, 10) || 0 })} />
                </td>
                <td className="px-2 py-1">
                  <input type="radio" name="defvar" checked={v.is_default} onChange={() => setDefaultVariant(v.id)} />
                </td>
                <td className="px-2 py-1">
                  <input type="number" className="w-16 rounded border border-input bg-background px-2 py-1"
                    defaultValue={v.sort_order} onBlur={(e) => patchVariant(v.id, { sort_order: parseInt(e.target.value, 10) || 0 })} />
                </td>
                <td className="px-2 py-1">
                  <button className="rounded border border-destructive px-2 py-1 text-xs text-destructive" onClick={() => onDeleteVariant(v.id)}>×</button>
                </td>
              </tr>
            ))}
            <tr className="border-t border-border bg-muted/30">
              <td className="px-2 py-1">
                <input className="w-24 rounded border border-input bg-background px-2 py-1" placeholder="A5"
                  value={newVar.format} onChange={(e) => setNewVar({ ...newVar, format: e.target.value })} />
              </td>
              <td className="px-2 py-1">
                <input className="w-32 rounded border border-input bg-background px-2 py-1" placeholder="MDF"
                  value={newVar.material} onChange={(e) => setNewVar({ ...newVar, material: e.target.value })} />
              </td>
              <td className="px-2 py-1">
                <input type="number" className="w-24 rounded border border-input bg-background px-2 py-1" placeholder="1500"
                  value={newVar.price_cents} onChange={(e) => setNewVar({ ...newVar, price_cents: parseInt(e.target.value, 10) || 0 })} />
              </td>
              <td colSpan={2}></td>
              <td className="px-2 py-1">
                <button onClick={onAddVariant} className="rounded-md bg-walnut px-3 py-1 text-xs text-cream">+</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}

function TextField({ label, value, onSave }: { label: string; value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase text-muted-foreground">{label}</span>
      <input
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => v !== value && onSave(v)}
      />
    </label>
  );
}
function NumberField({ label, value, onSave }: { label: string; value: number; onSave: (v: number) => void }) {
  const [v, setV] = useState(String(value));
  useEffect(() => setV(String(value)), [value]);
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase text-muted-foreground">{label}</span>
      <input
        type="number"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          const n = parseInt(v, 10);
          if (!Number.isNaN(n) && n !== value) onSave(n);
        }}
      />
    </label>
  );
}
function TextArea({ label, value, onSave }: { label: string; value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase text-muted-foreground">{label}</span>
      <textarea
        rows={6}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => v !== value && onSave(v)}
      />
    </label>
  );
}
function Toggle({ label, value, onSave }: { label: string; value: boolean; onSave: (v: boolean) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" checked={value} onChange={(e) => onSave(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
