import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatEUR, useT } from "@/i18n";
import { listProducts } from "@/lib/products.functions";
import { matchesSearch, normalizeQuery } from "@/lib/product-search";
import { useDebounce } from "@/hooks/use-debounce";
import { catalogFromPrice } from "@/lib/catalog-pricing";
import { productConfigQueryOptions } from "@/lib/product-config.query";
import { framePricesQueryOptions, holzplattePricesQueryOptions } from "@/lib/catalog-pricing.query";
import { imageFor } from "@/lib/product-images";

export function HeaderSearch({ autoFocus, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
  const { t, locale } = useT();
  const navigate = useNavigate();
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const q = useDebounce(value, 300);
  const hasQuery = normalizeQuery(q).length > 0;

  const { data: products } = useQuery({
    queryKey: ["products"] as const,
    queryFn: () => listProducts(),
    enabled: hasQuery,
  });
  const { data: config } = useQuery({ ...productConfigQueryOptions, enabled: hasQuery });
  const { data: framePrices } = useQuery({ ...framePricesQueryOptions, enabled: hasQuery });
  const { data: holzplattePrices } = useQuery({ ...holzplattePricesQueryOptions, enabled: hasQuery });

  const results = useMemo(
    () => (hasQuery && products ? products.filter((p) => matchesSearch(p, q)).slice(0, 5) : []),
    [products, q, hasQuery],
  );

  useEffect(() => setActive(-1), [q]);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const submit = () => {
    const s = value.trim();
    setOpen(false);
    navigate({ to: "/shop", search: s ? { search: s } : {} });
    onDone?.();
  };

  const goProduct = (id: string) => {
    setOpen(false);
    setValue("");
    navigate({ to: "/product/$id", params: { id } });
    onDone?.();
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      if (!open) onDone?.();
    } else if (e.key === "ArrowDown" && results.length) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp" && results.length) {
      e.preventDefault();
      setActive((a) => (a <= 0 ? results.length - 1 : a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && active >= 0 && results[active]) goProduct(results[active].id);
      else submit();
    }
  };

  const showDropdown = open && hasQuery && products !== undefined;

  return (
    <div ref={wrapRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="relative"
      >
        <button
          type="submit"
          aria-label={t("search.submit")}
          className="absolute left-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-walnut/70 transition hover:text-walnut"
        >
          <Search size={16} />
        </button>
        <Input
          type="search"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={t("search.placeholder")}
          aria-label={t("search.label")}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-autocomplete="list"
          className="h-10 rounded-full border-border bg-card/60 pl-9 pr-9 text-sm text-walnut placeholder:text-muted-foreground focus-visible:ring-brass [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            aria-label={t("search.clear")}
            onClick={() => {
              setValue("");
              setOpen(false);
            }}
            className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition hover:text-walnut"
          >
            <X size={14} />
          </button>
        )}
      </form>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl bg-card shadow-lg ring-1 ring-border">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              {t("search.none")} „{q.trim()}"
            </p>
          ) : (
            <ul id={listId} role="listbox" className="py-1">
              {results.map((p, i) => {
                const name = locale === "de" ? p.name_de : p.name_en;
                const price = catalogFromPrice(p, {
                  sizes: config?.sizes,
                  motifs: config?.motifs,
                  framePrices,
                  holzplattePrices,
                }).finalCents;
                return (
                  <li key={p.id} role="option" aria-selected={i === active}>
                    <Link
                      to="/product/$id"
                      params={{ id: p.id }}
                      onClick={() => {
                        setOpen(false);
                        setValue("");
                        onDone?.();
                      }}
                      onMouseEnter={() => setActive(i)}
                      className={`flex items-center gap-3 px-3 py-2 transition ${i === active ? "bg-linen" : "hover:bg-linen"}`}
                    >
                      <img
                        src={p.images?.[0] || imageFor(p.occasion)}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-border"
                      />
                      <span className="line-clamp-1 flex-1 text-sm text-walnut">{name}</span>
                      <span className="shrink-0 text-sm font-medium text-walnut">{formatEUR(price, locale)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <button
            type="button"
            onClick={submit}
            className="block w-full border-t border-border px-4 py-2.5 text-left text-xs uppercase tracking-widest text-walnut transition hover:bg-linen"
          >
            {t("search.showAll")}
          </button>
        </div>
      )}
    </div>
  );
}
