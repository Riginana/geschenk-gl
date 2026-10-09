import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import JSZip from "jszip";
import Papa from "papaparse";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/slug";
import { adminCreateUploadUrl } from "@/lib/admin.functions";
import {
  adminCheckImportDuplicates,
  adminCreateImportDraft,
  adminFinalizeImportedProduct,
  adminRollbackImportDraft,
} from "@/lib/admin-import.functions";

export const Route = createFileRoute("/admin/import")({
  ssr: false,
  head: () => ({ meta: [{ title: "Import — Admin" }, { name: "robots", content: "noindex" }] }),
  component: ImportPage,
});

const CATEGORIES = ["bilderrahmen", "holzbox", "holzschild", "schiebebox", "holzplatte", "sculpture", "other"];
const IMG_EXT: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
const VID_EXT: Record<string, string> = { mp4: "video/mp4", webm: "video/webm" };
const MAX_IMG = 20 * 1024 * 1024;
const MAX_VID = 100 * 1024 * 1024;

const TEMPLATE =
  "etsy_id,folder,name_de,name_en,description_de,description_en,category,occasion,frame_material,base_price_eur,discount_percent,hero_file\n" +
  '1234567890,etsy-1234567890,"Personalisiertes Geldgeschenk Hochzeit","Personalised wedding money gift","Beschreibung DE","Description EN",bilderrahmen,hochzeit,papier,17.00,30,01.jpg\n';

type MediaFile = { name: string; mime: string; size: number; entry: JSZip.JSZipObject };
type Row = {
  line: number;
  etsy_id: string;
  slug: string;
  name_de: string;
  name_en: string;
  description_de: string;
  description_en: string;
  category: string;
  occasion: string;
  frame_material: "papier" | "holz" | "hdf";
  base_price_cents: number;
  discount_percent: number;
  images: MediaFile[];
  heroIndex: number;
  video: MediaFile | null;
  errors: string[];
  duplicate: boolean;
  status: "bereit" | "läuft" | "fertig" | "fehler" | "übersprungen";
  productId?: string;
  message?: string;
};

function ext(n: string) {
  return n.split(".").pop()?.toLowerCase() ?? "";
}

async function parseZip(file: File): Promise<Row[]> {
  const zip = await JSZip.loadAsync(file);
  const csvEntry = Object.values(zip.files).find((f) => !f.dir && /(^|\/)products\.csv$/i.test(f.name));
  if (!csvEntry) throw new Error("products.csv nicht im ZIP gefunden");
  const root = csvEntry.name.replace(/products\.csv$/i, "");
  const text = (await csvEntry.async("string")).replace(/^\uFEFF/, "");
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim().toLowerCase() });

  const rows: Row[] = [];
  const seenEtsy = new Set<string>();
  const seenSlug = new Set<string>();
  for (const [i, r] of parsed.data.entries()) {
    const errors: string[] = [];
    const g = (k: string) => (r[k] ?? "").trim();
    const etsy_id = g("etsy_id");
    const folder = g("folder") || (etsy_id ? `etsy-${etsy_id}` : "");
    const name_de = g("name_de");
    const description_de = g("description_de");
    const category = g("category").toLowerCase() || "other";
    const fm = g("frame_material").toLowerCase() || "papier";
    const price = Number(g("base_price_eur").replace(",", "."));
    const discount = g("discount_percent") === "" ? 30 : Number(g("discount_percent"));
    const slug = slugify(name_de);

    if (!etsy_id) errors.push("etsy_id fehlt");
    if (!name_de) errors.push("name_de fehlt");
    if (!description_de) errors.push("description_de fehlt");
    if (!g("occasion")) errors.push("occasion fehlt");
    if (!CATEGORIES.includes(category)) errors.push(`Kategorie unbekannt: ${category}`);
    if (!["papier", "holz", "hdf"].includes(fm)) errors.push(`frame_material ungültig: ${fm}`);
    if (!Number.isFinite(price) || price < 0) errors.push("Preis ungültig");
    if (!Number.isInteger(discount) || discount < 0 || discount > 100) errors.push("Rabatt ungültig");
    if (etsy_id && seenEtsy.has(etsy_id)) errors.push("Etsy-ID doppelt in CSV");
    if (slug && seenSlug.has(slug)) errors.push("Name doppelt in CSV");
    seenEtsy.add(etsy_id);
    seenSlug.add(slug);

    const prefix = `${root}${folder}/`;
    const files = Object.values(zip.files)
      .filter((f) => !f.dir && f.name.startsWith(prefix) && !f.name.slice(prefix.length).includes("/") && !/(^|\/)\./.test(f.name))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    const images: MediaFile[] = [];
    let video: MediaFile | null = null;
    for (const f of files) {
      const name = f.name.slice(prefix.length);
      const size = (f as any)._data?.uncompressedSize ?? 0;
      const e = ext(name);
      if (IMG_EXT[e]) {
        if (size > MAX_IMG) errors.push(`${name}: größer als 20 MB`);
        images.push({ name, mime: IMG_EXT[e], size, entry: f });
      } else if (VID_EXT[e]) {
        if (size > MAX_VID) errors.push(`${name}: größer als 100 MB`);
        if (video) errors.push("Mehr als ein Video");
        video = { name, mime: VID_EXT[e], size, entry: f };
      } else {
        errors.push(`${name}: Format nicht unterstützt`);
      }
    }
    if (!folder || files.length === 0) errors.push(`Ordner „${folder}" fehlt oder ist leer`);
    if (images.length === 0) errors.push("Keine Bilder");
    let heroIndex = 0;
    const heroFile = g("hero_file");
    if (heroFile) {
      heroIndex = images.findIndex((m) => m.name === heroFile);
      if (heroIndex < 0) {
        errors.push(`hero_file nicht gefunden: ${heroFile}`);
        heroIndex = 0;
      }
    }

    rows.push({
      line: i + 2,
      etsy_id,
      slug,
      name_de,
      name_en: g("name_en") || name_de,
      description_de,
      description_en: g("description_en") || description_de,
      category,
      occasion: g("occasion").toLowerCase(),
      frame_material: fm as Row["frame_material"],
      base_price_cents: Math.round(price * 100),
      discount_percent: discount,
      images,
      heroIndex,
      video,
      errors,
      duplicate: false,
      status: "bereit",
    });
  }
  return rows;
}

function ImportPage() {
  const checkDup = useServerFn(adminCheckImportDuplicates);
  const createDraft = useServerFn(adminCreateImportDraft);
  const finalize = useServerFn(adminFinalizeImportedProduct);
  const rollback = useServerFn(adminRollbackImportDraft);
  const createUpload = useServerFn(adminCreateUploadUrl);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const update = (line: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.line === line ? { ...r, ...patch } : r)));

  const onFile = async (file: File) => {
    setLoading(true);
    setRows([]);
    try {
      const parsed = await parseZip(file);
      const dup = await checkDup({ data: { slugs: parsed.map((r) => r.slug).filter(Boolean), etsyIds: parsed.map((r) => r.etsy_id).filter(Boolean) } });
      const ds = new Set(dup.slugs);
      const de = new Set(dup.etsyIds);
      setRows(
        parsed.map((r) => {
          const duplicate = de.has(r.etsy_id) || ds.has(r.slug);
          return duplicate ? { ...r, duplicate, status: "übersprungen", message: "Existiert bereits" } : r;
        }),
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const errorCount = rows.filter((r) => r.errors.length > 0).length;
  const todo = rows.filter((r) => !r.duplicate && r.errors.length === 0 && r.status !== "fertig");

  const uploadOne = async (productId: string, m: MediaFile, kind: "image" | "video") => {
    const blob = await m.entry.async("blob");
    const file = new File([blob], m.name, { type: m.mime });
    const signed = await createUpload({ data: { product_id: productId, filename: m.name, content_type: m.mime, kind, size: file.size } });
    const { error } = await supabase.storage.from(signed.bucket).uploadToSignedUrl(signed.path, signed.token, file, { contentType: m.mime });
    if (error) throw new Error(`${m.name}: ${error.message}`);
    return signed.publicUrl as string;
  };

  const runImport = async () => {
    setRunning(true);
    for (const r of todo) {
      update(r.line, { status: "läuft", message: "Entwurf wird erstellt…" });
      let productId: string | undefined;
      try {
        const { etsy_id, slug, name_de, name_en, description_de, description_en, category, occasion, frame_material, base_price_cents, discount_percent } = r;
        productId = (await createDraft({ data: { etsy_id, slug, name_de, name_en, description_de, description_en, category, occasion, frame_material, base_price_cents, discount_percent } })).id;
        const urls: string[] = new Array(r.images.length);
        let done = 0;
        for (let i = 0; i < r.images.length; i += 3) {
          await Promise.all(
            r.images.slice(i, i + 3).map(async (m, j) => {
              urls[i + j] = await uploadOne(productId!, m, "image");
              done++;
              update(r.line, { message: `Bilder ${done}/${r.images.length}` });
            }),
          );
        }
        let videoUrl: string | null = null;
        if (r.video) {
          update(r.line, { message: "Video wird hochgeladen…" });
          videoUrl = await uploadOne(productId, r.video, "video");
        }
        await finalize({ data: { product_id: productId, images: urls.map((url) => ({ url, alt: name_de })), hero_index: r.heroIndex, video_url: videoUrl } });
        update(r.line, { status: "fertig", productId, message: "Entwurf erstellt" });
      } catch (e) {
        if (productId) await rollback({ data: { product_id: productId } }).catch(() => {});
        update(r.line, { status: "fehler", message: (e as Error).message });
      }
    }
    setRunning(false);
    toast.success("Import abgeschlossen – Produkte sind als Entwurf gespeichert");
  };

  const copyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(TEMPLATE);
      toast.success("Vorlage in die Zwischenablage kopiert");
    } catch {
      toast.error("Kopieren nicht möglich – bitte Text manuell markieren");
    }
  };

  return (
    <div>
      <h1 className="font-serif text-3xl text-walnut">Produkt-Import</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        ZIP mit <code>products.csv</code> und einem Ordner pro Produkt (Bilder 01.jpg, 02.jpg … und optional ein Video). Bilder JPG/PNG/WebP bis 20 MB, Video MP4/WebM bis 100 MB.
        Alle Produkte werden als <strong>Entwurf (inaktiv)</strong> angelegt – Veröffentlichung manuell unter Produkte.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          href="/products-vorlage.csv"
          download="products.csv"
          target="_blank"
          rel="noopener"
          className="rounded-full border border-border px-4 py-2 text-sm hover:bg-accent"
        >
          CSV-Vorlage herunterladen
        </a>
        <label className="cursor-pointer rounded-full bg-walnut px-4 py-2 text-sm text-cream hover:bg-walnut/90">
          {loading ? "ZIP wird gelesen…" : "ZIP auswählen"}
          <input type="file" accept=".zip,application/zip" className="hidden" disabled={loading || running} onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </label>
        {rows.length > 0 && (
          <button
            onClick={runImport}
            disabled={running || errorCount > 0 || todo.length === 0}
            className="rounded-full bg-walnut px-4 py-2 text-sm text-cream hover:bg-walnut/90 disabled:opacity-50"
          >
            {running ? "Import läuft…" : `${todo.length} Produkte als Entwurf importieren`}
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Lädt nicht in der Vorschau? Öffnen Sie /admin/import direkt auf diginutz.de oder kopieren Sie die Vorlage unten.
      </p>
      <details className="mt-2 max-w-3xl rounded-lg border border-border p-3 text-sm">
        <summary className="cursor-pointer text-muted-foreground">Vorlage anzeigen</summary>
        <pre className="mt-2 overflow-x-auto whitespace-pre rounded bg-muted p-2 text-xs">{TEMPLATE}</pre>
        <button onClick={copyTemplate} className="mt-2 rounded-full border border-border px-3 py-1 text-xs hover:bg-accent">
          In Zwischenablage kopieren
        </button>
      </details>

      {rows.length > 0 && (
        <p className="mt-4 text-sm">
          {rows.length} Zeilen · {errorCount} mit Fehlern · {rows.filter((r) => r.duplicate).length} Duplikate (werden übersprungen)
          {errorCount > 0 && <span className="text-destructive"> – bitte Fehler im ZIP korrigieren und neu laden.</span>}
        </p>
      )}

      {rows.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Zeile</th>
                <th className="px-3 py-2">Bild</th>
                <th className="px-3 py-2">Name / Etsy-ID</th>
                <th className="px-3 py-2">Kategorie</th>
                <th className="px-3 py-2">Preis</th>
                <th className="px-3 py-2">Medien</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.line} className={`border-t border-border align-top ${r.errors.length ? "bg-destructive/10" : ""}`}>
                  <td className="px-3 py-2">{r.line}</td>
                  <td className="px-3 py-2"><Thumb file={r.images[r.heroIndex]} /></td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{r.name_de || "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.etsy_id} · /{r.slug}</div>
                  </td>
                  <td className="px-3 py-2">
                    {r.category}
                    {r.category === "bilderrahmen" && <div className="text-xs text-muted-foreground">{r.frame_material}</div>}
                  </td>
                  <td className="px-3 py-2">{(r.base_price_cents / 100).toFixed(2)} € · −{r.discount_percent}%</td>
                  <td className="px-3 py-2">{r.images.length} Bilder{r.video ? " · 1 Video" : ""}</td>
                  <td className="px-3 py-2">
                    {r.errors.length > 0 ? (
                      <ul className="list-disc pl-4 text-xs text-destructive">{r.errors.map((e) => <li key={e}>{e}</li>)}</ul>
                    ) : (
                      <div className="text-xs">
                        <div className={r.status === "fehler" ? "text-destructive" : ""}>{r.status}</div>
                        {r.message && <div className="text-muted-foreground">{r.message}</div>}
                        {r.productId && (
                          <Link to="/admin/products/$id" params={{ id: r.productId }} className="text-walnut underline">
                            Entwurf öffnen
                          </Link>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Thumb({ file }: { file?: MediaFile }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!file) return;
    let url: string | null = null;
    file.entry.async("blob").then((b) => setSrc((url = URL.createObjectURL(b))));
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [file]);
  return src ? <img src={src} alt="" className="h-12 w-12 rounded object-cover" /> : <div className="h-12 w-12 rounded bg-muted" />;
}
