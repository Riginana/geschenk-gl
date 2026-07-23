import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  adminListProducts,
  adminUpdateProduct,
  adminBulkSetActive,
  type AdminProductRow,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/products/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Товары — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminProductsList,
});

function AdminProductsList() {
  const navigate = useNavigate();
  const list = useServerFn(adminListProducts);
  const update = useServerFn(adminUpdateProduct);
  const bulk = useServerFn(adminBulkSetActive);

  const [rows, setRows] = useState<AdminProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [fOccasion, setFOccasion] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [fActive, setFActive] = useState<"all" | "1" | "0">("all");

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
      if (fActive === "1" && !r.is_active) return false;
      if (fActive === "0" && r.is_active) return false;
      if (q && !(r.name_de?.toLowerCase().includes(q) || r.name_en?.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [rows, search, fOccasion, fCategory, fActive]);

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
      toast.success(`${selected.size} обновлено`);
      setSelected(new Set());
      reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Fehler");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-3xl text-walnut">Товары</h1>
        <div className="text-sm text-muted-foreground">
          Всего: {rows.length} • Показано: {filtered.length}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4">
        <input
          className="min-w-[220px] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Поиск по названию/slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={fOccasion}
          onChange={(e) => setFOccasion(e.target.value)}
        >
          <option value="">Все поводы</option>
          {occasions.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={fCategory}
          onChange={(e) => setFCategory(e.target.value)}
        >
          <option value="">Все категории</option>
          {categories.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={fActive}
          onChange={(e) => setFActive(e.target.value as any)}
        >
          <option value="all">Все статусы</option>
          <option value="1">Только опубликованные</option>
          <option value="0">Только черновики</option>
        </select>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-border bg-accent/40 px-4 py-2 text-sm">
          <span>Выбрано: {selected.size}</span>
          <button className="rounded-md bg-walnut px-3 py-1 text-cream" onClick={() => bulkToggle(true)}>
            Veröffentlichen
          </button>
          <button className="rounded-md border border-border px-3 py-1" onClick={() => bulkToggle(false)}>
            Entwurf
          </button>
          <button className="ml-auto text-xs text-muted-foreground underline" onClick={() => setSelected(new Set())}>
            Сбросить
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
              <th className="w-16 px-3 py-2">Фото</th>
              <th className="px-3 py-2">Название</th>
              <th className="px-3 py-2">Повод</th>
              <th className="px-3 py-2">Категория</th>
              <th className="px-3 py-2">Цена €</th>
              <th className="px-3 py-2">Скидка %</th>
              <th className="px-3 py-2">Статус</th>
              <th className="px-3 py-2">Best</th>
              <th className="px-3 py-2">Feat</th>
              <th className="px-3 py-2">Stock</th>
              <th className="px-3 py-2">Sort</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={13} className="px-3 py-6 text-center text-muted-foreground">Загрузка…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={13} className="px-3 py-6 text-center text-muted-foreground">Нет товаров</td></tr>
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
                  <Link
                    to="/admin/products/$id"
                    params={{ id: r.id }}
                    className="rounded-md border border-border px-3 py-1 text-xs hover:bg-accent"
                  >
                    Bearbeiten
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
