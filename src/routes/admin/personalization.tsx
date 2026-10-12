import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, EyeOff, GripVertical, Pencil, Plus, Trash2, Copy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminListProducts } from "@/lib/admin.functions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PersonalizationFields } from "@/components/product/personalization-fields";
import {
  FIELD_TYPE_LABELS,
  OPTION_TYPES,
  resolveBlocks,
  toBlock,
  type PersBlock,
  type PersFieldType,
  type PersOption,
  type PersScope,
  type PersSection,
  type ResolvedBlock,
} from "@/lib/personalization-blocks";

export const Route = createFileRoute("/admin/personalization")({
  head: () => ({ meta: [{ title: "Personalisierung — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminPersonalization,
});

const SCOPE_LABELS: Record<PersScope, string> = {
  global: "Global (Standard)",
  occasion: "Anlass",
  category: "Kategorie",
  product: "Einzelnes Produkt",
};
const SOURCE_LABELS: Record<ResolvedBlock["source"], string> = {
  product: "eigene",
  occasion: "geerbt von Anlass",
  category: "geerbt von Kategorie",
  global: "geerbt von Global",
};

type Occasion = { id: string; slug: string; name_de: string; name_en: string };

const emptyBlock = (scope: PersScope, scope_value: string, sort: number): Omit<PersBlock, "id"> & { id?: string } => ({
  scope,
  scope_value,
  internal_name: "",
  field_key: "",
  field_type: "text",
  title_de: "",
  title_en: "",
  description_de: "",
  description_en: "",
  placeholder_de: "",
  placeholder_en: "",
  hint_de: "",
  hint_en: "",
  error_de: "",
  error_en: "",
  required: false,
  is_active: true,
  hidden: false,
  overrides_block_id: null,
  sort_order: sort,
  min_length: 0,
  max_length: 150,
  options: [],
});

const strip = (v: string) => v.replace(/<[^>]*>/g, "").replace(/[<>]/g, "").trim();

function AdminPersonalization() {
  const qc = useQueryClient();
  const [scope, setScope] = useState<PersScope>("global");
  const [value, setValue] = useState("");
  const [edit, setEdit] = useState<(Omit<PersBlock, "id"> & { id?: string }) | null>(null);
  const [del, setDel] = useState<PersBlock | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [newOcc, setNewOcc] = useState({ slug: "", name_de: "", name_en: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-pers"],
    queryFn: async () => {
      const [b, s, o] = await Promise.all([
        supabase.from("personalization_blocks").select("*").order("sort_order"),
        supabase.from("personalization_sections").select("*"),
        supabase.from("occasions").select("*").order("sort_order").order("name_de"),
      ]);
      if (b.error) throw b.error;
      return {
        blocks: (b.data ?? []).map((r) => toBlock(r as Record<string, unknown>)),
        sections: (s.data ?? []) as PersSection[],
        occasions: (o.data ?? []) as Occasion[],
      };
    },
  });
  const { data: products = [] } = useQuery({ queryKey: ["admin-products"], queryFn: () => adminListProducts() });
  const categories = useMemo(
    () => [...new Set((products as { category: string }[]).map((p) => p.category).filter(Boolean))].sort(),
    [products],
  );
  const product = (products as { id: string; name_de: string; occasion: string; category: string }[]).find(
    (p) => p.id === value,
  );

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-pers"] });
    qc.invalidateQueries({ queryKey: ["personalization-blocks"] });
  };

  const blocks = data?.blocks ?? [];
  const scoped = blocks.filter((b) => b.scope === scope && b.scope_value === (scope === "global" ? "" : value));
  const needsValue = scope !== "global" && !value;
  const section = data?.sections.find((s) => s.scope === scope && s.scope_value === (scope === "global" ? "" : value));
  const [heading, setHeading] = useState<{ de: string; en: string } | null>(null);
  const resolved = product ? resolveBlocks(blocks, product) : null;
  const scopeValue = scope === "global" ? "" : value;

  const save = async () => {
    if (!edit) return;
    const b = { ...edit };
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(b.field_key))
      return toast.error("Feld-Schlüssel: nur Buchstaben, Ziffern, _ (beginnt mit Buchstabe)");
    if (!b.internal_name.trim() || !b.title_de.trim()) return toast.error("Interner Name und Titel (DE) sind Pflicht");
    if (OPTION_TYPES.includes(b.field_type) && !b.options.length && !b.hidden)
      return toast.error("Bitte mindestens eine Option anlegen");
    const textKeys = [
      "internal_name", "title_de", "title_en", "description_de", "description_en", "placeholder_de",
      "placeholder_en", "hint_de", "hint_en", "error_de", "error_en",
    ] as const;
    for (const k of textKeys) b[k] = strip(b[k]).slice(0, 500);
    b.min_length = Math.max(0, Math.min(500, b.min_length | 0));
    b.max_length = Math.max(1, Math.min(500, b.max_length | 0));
    const { id, ...row } = b;
    const payload = { ...row, options: b.options.map((o) => ({ ...o, label_de: strip(o.label_de), label_en: strip(o.label_en) })) };
    const r = id
      ? await supabase.from("personalization_blocks").update(payload).eq("id", id)
      : await supabase.from("personalization_blocks").insert(payload);
    if (r.error) return toast.error(r.error.code === "23505" ? "Feld-Schlüssel existiert bereits in diesem Bereich" : r.error.message);
    toast.success("Gespeichert");
    setEdit(null);
    refresh();
  };

  const patch = async (id: string, p: Partial<PersBlock>) => {
    const r = await supabase.from("personalization_blocks").update(p).eq("id", id);
    if (r.error) toast.error(r.error.message);
    refresh();
  };

  const reorder = async (list: PersBlock[]) => {
    await Promise.all(list.map((b, i) => supabase.from("personalization_blocks").update({ sort_order: (i + 1) * 10 }).eq("id", b.id)));
    refresh();
  };
  const move = (i: number, d: number) => {
    const list = [...scoped];
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    reorder(list);
  };
  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const list = [...scoped];
    const from = list.findIndex((b) => b.id === dragId);
    const to = list.findIndex((b) => b.id === targetId);
    const [m] = list.splice(from, 1);
    list.splice(to, 0, m);
    setDragId(null);
    reorder(list);
  };

  const saveHeading = async () => {
    if (!heading) return;
    const r = await supabase
      .from("personalization_sections")
      .upsert(
        { scope, scope_value: scopeValue, heading_de: strip(heading.de), heading_en: strip(heading.en) },
        { onConflict: "scope,scope_value" },
      );
    if (r.error) return toast.error(r.error.message);
    toast.success("Überschrift gespeichert");
    setHeading(null);
    refresh();
  };

  const addOccasion = async () => {
    const slug = newOcc.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!slug || !newOcc.name_de.trim()) return toast.error("Slug und Name (DE) sind Pflicht");
    const r = await supabase.from("occasions").insert({ slug, name_de: strip(newOcc.name_de), name_en: strip(newOcc.name_en) });
    if (r.error) return toast.error(r.error.code === "23505" ? "Anlass existiert bereits" : r.error.message);
    setNewOcc({ slug: "", name_de: "", name_en: "" });
    refresh();
  };

  const overrideFor = (b: ResolvedBlock, hide: boolean) => {
    if (!product) return;
    const existing = blocks.find((x) => x.scope === "product" && x.scope_value === product.id && x.overrides_block_id === b.id);
    if (existing) return setEdit(existing);
    const { id, source: _s, ...rest } = b;
    void _s;
    if (hide) {
      supabase
        .from("personalization_blocks")
        .insert({ ...rest, scope: "product", scope_value: product.id, overrides_block_id: id, hidden: true, internal_name: `${rest.internal_name} (ausgeblendet)` })
        .then((r) => (r.error ? toast.error(r.error.message) : (toast.success("Für dieses Produkt ausgeblendet"), refresh())));
    } else setEdit({ ...rest, scope: "product", scope_value: product.id, overrides_block_id: id, hidden: false });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-walnut">Personalisierung</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Priorität: Produkt → Anlass → Kategorie → Global. Sobald ein Anlass (oder eine Kategorie) eigene Blöcke hat,
          werden die globalen Blöcke dort nicht angezeigt.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
        <label className="text-sm">
          Ebene
          <select
            className="mt-1 block h-10 rounded-md border border-border bg-background px-3"
            value={scope}
            onChange={(e) => {
              setScope(e.target.value as PersScope);
              setValue("");
              setHeading(null);
            }}
          >
            {(Object.keys(SCOPE_LABELS) as PersScope[]).map((s) => (
              <option key={s} value={s}>{SCOPE_LABELS[s]}</option>
            ))}
          </select>
        </label>
        {scope !== "global" && (
          <label className="min-w-64 text-sm">
            {SCOPE_LABELS[scope]}
            <select
              className="mt-1 block h-10 w-full rounded-md border border-border bg-background px-3"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setHeading(null);
              }}
            >
              <option value="">— bitte wählen —</option>
              {scope === "occasion" && data?.occasions.map((o) => <option key={o.slug} value={o.slug}>{o.name_de}</option>)}
              {scope === "category" && categories.map((c) => <option key={c} value={c}>{c}</option>)}
              {scope === "product" &&
                (products as { id: string; name_de: string }[]).map((p) => <option key={p.id} value={p.id}>{p.name_de}</option>)}
            </select>
          </label>
        )}
        {!needsValue && (
          <Button onClick={() => setEdit(emptyBlock(scope, scopeValue, (scoped.length + 1) * 10))}>
            <Plus className="mr-1 h-4 w-4" /> Neuer Block
          </Button>
        )}
      </div>

      {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}

      {!needsValue && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-medium">Überschrift des Bereichs</p>
          {heading ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <Input className="w-64" placeholder="DE" value={heading.de} onChange={(e) => setHeading({ ...heading, de: e.target.value })} />
              <Input className="w-64" placeholder="EN" value={heading.en} onChange={(e) => setHeading({ ...heading, en: e.target.value })} />
              <Button onClick={saveHeading}>Speichern</Button>
              <Button variant="ghost" onClick={() => setHeading(null)}>Abbrechen</Button>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              {section ? `${section.heading_de} / ${section.heading_en}` : "— geerbt —"}{" "}
              <button className="ml-2 text-walnut underline" onClick={() => setHeading({ de: section?.heading_de ?? "", en: section?.heading_en ?? "" })}>
                bearbeiten
              </button>
            </p>
          )}
        </div>
      )}

      {!needsValue && (
        <div className="rounded-2xl border border-border bg-card">
          <p className="border-b border-border p-4 text-sm font-medium">
            Blöcke auf dieser Ebene ({scoped.length}) — zum Sortieren ziehen oder Pfeile nutzen
          </p>
          {!scoped.length && <p className="p-4 text-sm text-muted-foreground">Noch keine Blöcke auf dieser Ebene.</p>}
          <ul>
            {scoped.map((b, i) => (
              <li
                key={b.id}
                draggable
                onDragStart={() => setDragId(b.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(b.id)}
                className={`flex items-center gap-3 border-b border-border p-3 text-sm last:border-0 ${b.is_active ? "" : "opacity-50"}`}
              >
                <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">
                    {b.hidden && <EyeOff className="mr-1 inline h-3.5 w-3.5" />}
                    {b.internal_name}{" "}
                    {b.required && <span className="rounded bg-destructive/10 px-1.5 text-xs text-destructive">Pflicht</span>}
                    {b.overrides_block_id && <span className="ml-1 rounded bg-accent px-1.5 text-xs">ersetzt geerbten Block</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {b.title_de} · {FIELD_TYPE_LABELS[b.field_type]} · Schlüssel „{b.field_key}"
                  </p>
                </div>
                <Switch checked={b.is_active} onCheckedChange={(c) => patch(b.id, { is_active: c })} aria-label="Aktiv" />
                <button aria-label="Nach oben" onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></button>
                <button aria-label="Nach unten" onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></button>
                <button aria-label="Bearbeiten" onClick={() => setEdit(b)}><Pencil className="h-4 w-4" /></button>
                <button
                  aria-label="Duplizieren"
                  onClick={() => {
                    const { id: _id, ...rest } = b;
                    void _id;
                    setEdit({ ...rest, field_key: `${b.field_key}_2`, internal_name: `${b.internal_name} (Kopie)` });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button aria-label="Löschen" onClick={() => setDel(b)}><Trash2 className="h-4 w-4 text-destructive" /></button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {scope === "product" && product && resolved && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-medium">Ergebnis für dieses Produkt</p>
            <p className="text-xs text-muted-foreground">Anlass: {product.occasion} · Kategorie: {product.category}</p>
            <ul className="mt-3 space-y-2">
              {resolved.map((b) => (
                <li key={b.id} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm">
                  <span className="flex-1">{b.title_de}</span>
                  <span className={`rounded px-1.5 text-xs ${b.source === "product" ? "bg-walnut text-cream" : "bg-accent"}`}>
                    {SOURCE_LABELS[b.source]}
                  </span>
                  {b.source !== "product" && (
                    <>
                      <button className="text-xs underline" onClick={() => overrideFor(b, false)}>überschreiben</button>
                      <button className="text-xs underline" onClick={() => overrideFor(b, true)}>ausblenden</button>
                    </>
                  )}
                </li>
              ))}
              {!resolved.length && <li className="text-sm text-muted-foreground">Keine Personalisierung.</li>}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Vorschau</p>
            <PersonalizationFields key={resolved.map((b) => b.id + b.title_de).join()} product={product} previewBlocks={resolved} />
          </div>
        </div>
      )}

      {scope === "occasion" && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-medium">Neuen Anlass anlegen</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Input className="w-40" placeholder="slug (z. B. einschulung)" value={newOcc.slug} onChange={(e) => setNewOcc({ ...newOcc, slug: e.target.value })} />
            <Input className="w-48" placeholder="Name DE" value={newOcc.name_de} onChange={(e) => setNewOcc({ ...newOcc, name_de: e.target.value })} />
            <Input className="w-48" placeholder="Name EN" value={newOcc.name_en} onChange={(e) => setNewOcc({ ...newOcc, name_en: e.target.value })} />
            <Button onClick={addOccasion}>Hinzufügen</Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Der Slug muss dem Anlass-Feld der Produkte entsprechen.</p>
        </div>
      )}

      {edit && <BlockEditor block={edit} onChange={setEdit} onSave={save} onClose={() => setEdit(null)} />}

      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              „{del?.internal_name}" wird endgültig entfernt. Bestehende Bestellungen bleiben unverändert. Produkt-Überschreibungen dieses Blocks werden ebenfalls gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!del) return;
                const r = await supabase.from("personalization_blocks").delete().eq("id", del.id);
                if (r.error) toast.error(r.error.message);
                else toast.success("Gelöscht");
                setDel(null);
                refresh();
              }}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type Editable = Omit<PersBlock, "id"> & { id?: string };

function BlockEditor({ block, onChange, onSave, onClose }: { block: Editable; onChange: (b: Editable) => void; onSave: () => void; onClose: () => void }) {
  const set = <K extends keyof Editable>(k: K, v: Editable[K]) => onChange({ ...block, [k]: v });
  const pair = (label: string, k: "title" | "description" | "placeholder" | "hint" | "error", area = false) => (
    <div className="grid grid-cols-2 gap-2">
      {(["de", "en"] as const).map((l) => {
        const key = `${k}_${l}` as const;
        const C = area ? Textarea : Input;
        return (
          <label key={l} className="text-xs text-muted-foreground">
            {label} ({l.toUpperCase()})
            <C value={block[key]} onChange={(e: { target: { value: string } }) => set(key, e.target.value)} maxLength={500} />
          </label>
        );
      })}
    </div>
  );
  const setOpt = (i: number, p: Partial<PersOption>) => set("options", block.options.map((o, j) => (j === i ? { ...o, ...p } : o)));
  const preview: PersBlock = { ...block, id: block.id ?? "preview", is_active: true, hidden: false };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{block.id ? "Block bearbeiten" : "Neuer Block"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-muted-foreground">
                Interner Name *
                <Input value={block.internal_name} onChange={(e) => set("internal_name", e.target.value)} />
              </label>
              <label className="text-xs text-muted-foreground">
                Feld-Schlüssel * (z. B. names, gruss)
                <Input value={block.field_key} onChange={(e) => set("field_key", e.target.value)} disabled={!!block.overrides_block_id} />
              </label>
            </div>
            <label className="block text-xs text-muted-foreground">
              Feldtyp
              <select
                className="mt-1 block h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={block.field_type}
                onChange={(e) => set("field_type", e.target.value as PersFieldType)}
              >
                {(Object.keys(FIELD_TYPE_LABELS) as PersFieldType[]).map((t) => (
                  <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </label>
            {pair("Titel *", "title")}
            {pair("Beschreibung", "description", true)}
            {pair("Platzhalter", "placeholder")}
            {pair("Hinweis", "hint")}
            {pair("Fehlermeldung (leer = Standard)", "error")}
            {(block.field_type === "text" || block.field_type === "textarea") && (
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-muted-foreground">
                  Min. Zeichen
                  <Input type="number" value={block.min_length} onChange={(e) => set("min_length", +e.target.value)} />
                </label>
                <label className="text-xs text-muted-foreground">
                  Max. Zeichen
                  <Input type="number" value={block.max_length} onChange={(e) => set("max_length", +e.target.value)} />
                </label>
              </div>
            )}
            {OPTION_TYPES.includes(block.field_type) && (
              <div className="space-y-2 rounded-lg border border-border p-3">
                <p className="text-xs font-medium">
                  Optionen {block.field_type === "font" && "(Wert = CSS-Schriftart, z. B. 'Great Vibes', cursive)"}
                </p>
                {block.options.map((o, i) => (
                  <div key={i} className="flex flex-wrap gap-1">
                    <Input className="w-32" placeholder="Wert" value={o.value} onChange={(e) => setOpt(i, { value: e.target.value })} />
                    <Input className="w-32" placeholder="Label DE" value={o.label_de} onChange={(e) => setOpt(i, { label_de: e.target.value })} />
                    <Input className="w-32" placeholder="Label EN" value={o.label_en} onChange={(e) => setOpt(i, { label_en: e.target.value })} />
                    {block.field_type === "image" && (
                      <Input className="w-56" placeholder="Bild-URL" value={o.image_url ?? ""} onChange={(e) => setOpt(i, { image_url: e.target.value })} />
                    )}
                    <button aria-label="Option entfernen" onClick={() => set("options", block.options.filter((_, j) => j !== i))}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={() => set("options", [...block.options, { value: "", label_de: "", label_en: "" }])}>
                  <Plus className="mr-1 h-3 w-3" /> Option
                </Button>
              </div>
            )}
            <div className="flex gap-6 text-sm">
              <label className="flex items-center gap-2">
                <Switch checked={block.required} onCheckedChange={(c) => set("required", c)} /> Pflichtfeld
              </label>
              <label className="flex items-center gap-2">
                <Switch checked={block.is_active} onCheckedChange={(c) => set("is_active", c)} /> Aktiv
              </label>
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Vorschau (so sieht es der Kunde)</p>
            <PersonalizationFields product={{ id: "" }} previewBlocks={[preview]} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
          <Button onClick={onSave}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
