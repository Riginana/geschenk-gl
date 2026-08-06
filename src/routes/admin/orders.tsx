import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { adminListOrders, type AdminOrderItem, type AdminOrderRow } from "@/lib/admin-config.functions";
import { formatEUR } from "@/i18n";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [
      { title: "Bestellungen | DigiNutz Admin" },
      { name: "description", content: "Bestellübersicht mit Größen, Motiven und Personalisierung." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: OrdersPage,
});

function copy(text: string) {
  void navigator.clipboard.writeText(text).then(
    () => toast.success("Kopiert"),
    () => toast.error("Kopieren fehlgeschlagen"),
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="shrink-0 text-xs font-medium text-walnut">{label}:</span>
      <span className="min-w-0 flex-1 break-words text-xs text-foreground/85">{value}</span>
      <button
        type="button"
        onClick={() => copy(value)}
        aria-label={`${label} kopieren`}
        className="shrink-0 text-muted-foreground hover:text-walnut"
      >
        <Copy size={13} />
      </button>
    </div>
  );
}

function ItemCard({ item }: { item: AdminOrderItem }) {
  const p = item.personalization ?? {};
  const unit = item.unitPriceCents ?? 0;
  const qty = item.qty ?? 1;
  return (
    <li className="rounded-lg border border-border p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium text-walnut">
          {qty}× {item.name}
        </p>
        <p className="shrink-0 text-sm text-walnut">{formatEUR(unit * qty)}</p>
      </div>
      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        {p.sizeLabel && (
          <p>
            <span className="font-medium text-walnut">Größe:</span> {p.sizeLabel}
            {p.dimensions ? ` — ${p.dimensions}` : ""}
          </p>
        )}
        {p.motifTitle && (
          <p>
            <span className="font-medium text-walnut">Motiv:</span>{" "}
            {p.motifNumber ? `Motiv ${p.motifNumber} — ` : ""}
            {p.motifTitle}
          </p>
        )}
        {p.motifText && (
          <p>
            <span className="font-medium text-walnut">Motivtext:</span> {p.motifText}
          </p>
        )}
        <p>
          <span className="font-medium text-walnut">Einzelpreis:</span> {formatEUR(unit)}
        </p>
      </div>
      <div className="mt-2 space-y-1">
        {p.customMotifText && <CopyField label="Wunschtext" value={p.customMotifText} />}
        {p.names && <CopyField label="Name(n)" value={p.names} />}
        {p.date && <CopyField label="Datum" value={p.date} />}
        {p.message && <CopyField label="Nachricht" value={p.message} />}
      </div>
    </li>
  );
}

function OrderCard({ order }: { order: AdminOrderRow }) {
  const [open, setOpen] = useState(false);
  const a = order.address ?? {};
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <div>
          <p className="font-medium text-walnut">{order.email}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleString("de-DE")} · {order.status} ·{" "}
            {(order.items ?? []).length} Position(en)
          </p>
        </div>
        <p className="shrink-0 font-medium text-walnut">{formatEUR(order.total_cents)}</p>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            {[a.firstName, a.lastName].filter(Boolean).join(" ")} · {a.street} {a.houseNumber}, {a.plz}{" "}
            {a.city}, {a.country}
          </p>
          <ul className="space-y-3">
            {(order.items ?? []).map((it, i) => (
              <ItemCard key={i} item={it} />
            ))}
          </ul>
          <div className="text-xs text-muted-foreground">
            Zwischensumme {formatEUR(order.subtotal_cents)} · Versand {formatEUR(order.shipping_cents)} ·{" "}
            {order.shipping_method} · {order.payment_method}
          </div>
        </div>
      )}
    </div>
  );
}

function OrdersPage() {
  const listFn = useServerFn(adminListOrders);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => listFn(),
  });

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-walnut">Bestellungen</h1>
      {isLoading && <p className="text-sm text-muted-foreground">Lade …</p>}
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
      <div className="space-y-3">
        {(data ?? []).map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
        {data && !data.length && <p className="text-sm text-muted-foreground">Noch keine Bestellungen.</p>}
      </div>
    </div>
  );
}
