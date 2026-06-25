import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { useT } from "@/i18n";
import { listProducts } from "@/lib/products.functions";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { Reveal } from "@/components/reveal";

const searchSchema = z.object({
  occasion: z.string().optional(),
  material: z.enum(["holz", "papier", "kraftpapier"]).optional(),
  format: z.enum(["A5", "A4", "A3"]).optional(),
  sort: z.enum(["popular", "new", "price_asc", "price_desc"]).optional(),
});


export const Route = createFileRoute("/shop")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Shop — Personalisierte Geldgeschenke | DigiNutz" },
      { name: "description", content: "Stöbern Sie durch unsere handgefertigten Geldgeschenke für jeden Anlass — Hochzeit, Geburtstag, Geburt, Konfirmation und mehr." },
      { property: "og:title", content: "Shop — Personalisierte Geldgeschenke" },
      { property: "og:url", content: "/shop" },
    ],
    links: [{ rel: "canonical", href: "/shop" }],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({ queryKey: ["products"], queryFn: () => listProducts() }),
  component: ShopPage,
});

const OCCASIONS = ["hochzeit", "geburtstag", "geburt", "taufe", "kommunion", "konfirmation", "firmung", "abitur", "ruhestand", "weihnachten", "einzug", "mutterschutz", "ostern", "jugendweihe", "fuehrerschein", "einschulung", "sonstiges"] as const;

function ShopPage() {
  const { t } = useT();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: products } = useSuspenseQuery({ queryKey: ["products"], queryFn: () => listProducts() });
  const [openFilters, setOpenFilters] = useState(false);

  const filtered = useMemo(() => {
    let arr = products.slice();
    if (search.occasion) arr = arr.filter((p) => p.occasion === search.occasion);
    if (search.material) arr = arr.filter((p) => p.material === search.material);
    if (search.format) arr = arr.filter((p) => (p.formats ?? []).includes(search.format!));
    switch (search.sort) {
      case "price_asc":
        arr.sort((a, b) => a.base_price_cents - b.base_price_cents);
        break;
      case "price_desc":
        arr.sort((a, b) => b.base_price_cents - a.base_price_cents);
        break;
      case "new":
        arr.sort((a, b) => (a.badge === "neu" ? -1 : 1));
        break;
      case "popular":
      default:
        arr.sort((a, b) => (a.badge === "bestseller" ? -1 : 1));
        break;
    }
    return arr;
  }, [products, search]);

  const update = (patch: Partial<typeof search>) => navigate({ search: (prev: typeof search) => ({ ...prev, ...patch }) });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10 lg:py-20">
      <Reveal>
        <div className="text-center">
          <p className="eyebrow">{t("nav.shop")}</p>
          <h1 className="mt-2 font-serif text-4xl text-walnut sm:text-5xl">{t("shop.title")}</h1>
        </div>
      </Reveal>

      <div className="mt-10 flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-64 lg:shrink-0">
          <button
            className="flex w-full items-center justify-between rounded-full border border-border bg-card px-5 py-3 text-sm font-medium text-walnut lg:hidden"
            onClick={() => setOpenFilters((v) => !v)}
          >
            Filter {openFilters ? "−" : "+"}
          </button>
          <div className={`${openFilters ? "block" : "hidden"} mt-4 space-y-6 lg:block lg:mt-0`}>
            <FilterGroup label={t("shop.filterOccasion")}>
              <FilterChip active={!search.occasion} onClick={() => update({ occasion: undefined })}>{t("shop.all")}</FilterChip>
              {OCCASIONS.map((o) => (
                <FilterChip key={o} active={search.occasion === o} onClick={() => update({ occasion: o })}>
                  {t(`occasions.${o}`)}
                </FilterChip>
              ))}
            </FilterGroup>
            <FilterGroup label={t("shop.filterMaterial")}>
              <FilterChip active={!search.material} onClick={() => update({ material: undefined })}>{t("shop.all")}</FilterChip>
              <FilterChip active={search.material === "holz"} onClick={() => update({ material: "holz" })}>{t("shop.holz")}</FilterChip>
              <FilterChip active={search.material === "papier"} onClick={() => update({ material: "papier" })}>{t("shop.papier")}</FilterChip>
              <FilterChip active={search.material === "kraftpapier"} onClick={() => update({ material: "kraftpapier" })}>{t("shop.kraftpapier")}</FilterChip>
            </FilterGroup>

            <FilterGroup label={t("shop.filterFormat")}>
              <FilterChip active={!search.format} onClick={() => update({ format: undefined })}>{t("shop.all")}</FilterChip>
              {(["A5", "A4", "A3"] as const).map((f) => (
                <FilterChip key={f} active={search.format === f} onClick={() => update({ format: f })}>{f}</FilterChip>
              ))}
            </FilterGroup>
          </div>
        </aside>

        <div className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{filtered.length} Produkte</p>
            <select
              value={search.sort ?? "popular"}
              onChange={(e) => update({ sort: e.target.value as any })}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm text-walnut outline-none focus:border-brass"
            >
              <option value="popular">{t("shop.sortPopular")}</option>
              <option value="new">{t("shop.sortNew")}</option>
              <option value="price_asc">{t("shop.sortPriceAsc")}</option>
              <option value="price_desc">{t("shop.sortPriceDesc")}</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-2xl bg-linen px-6 py-12 text-center text-muted-foreground">{t("shop.empty")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p, i) => (
                <Reveal key={p.id} delay={(i % 6) * 0.04}>
                  <ProductCard p={p} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-3">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-xs transition ${
        active
          ? "border-walnut bg-walnut text-cream"
          : "border-border bg-card text-walnut hover:border-walnut/40"
      }`}
    >
      {children}
    </button>
  );
}
