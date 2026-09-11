import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, ExternalLink } from "lucide-react";
import {
  adminListOrders,
  adminUpdateOrder,
  type AdminOrderItem,
  type AdminOrderRow,
} from "@/lib/admin-config.functions";
import { CARRIERS, carrierLabel, trackingUrl } from "@/lib/tracking";
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

const STATUS_OPTIONS = [
  { value: "pending", label: "Zahlung offen" },
  { value: "paid", label: "Bezahlt" },
  { value: "shipped", label: "Versendet" },
  { value: "done", label: "Abgeschlossen" },
  { value: "cancelled", label: "Storniert" },
] as const;

function statusLabel(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
}

function OrderCard({ order }: { order: AdminOrderRow }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(order.status);
  const [carrier, setCarrier] = useState(order.tracking_carrier ?? "dhl");
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [saving, setSaving] = useState(false);
  const updateFn = useServerFn(adminUpdateOrder);
  const queryClient = useQueryClient();
  const a = order.address ?? {};
  const link = trackingUrl(order.tracking_carrier, order.tracking_number);

  async function save() {
    setSaving(true);
    try {
      await updateFn({
        data: {
          id: order.id,
          status: status as "pending" | "paid" | "shipped" | "done" | "cancelled",
          tracking_number: tracking,
          tracking_carrier: carrier,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Bestellung aktualisiert");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

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
            {new Date(order.created_at).toLocaleString("de-DE")} · {(order.items ?? []).length}{" "}
            Position(en)
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-medium text-walnut">{formatEUR(order.total_cents)}</p>
          <p className="mt-1 text-xs">
            <span
              className={
                order.status === "pending"
                  ? "rounded-full bg-muted px-2 py-0.5 text-muted-foreground"
                  : order.status === "cancelled"
                    ? "rounded-full bg-destructive/10 px-2 py-0.5 text-destructive"
                    : "rounded-full bg-brass/20 px-2 py-0.5 text-walnut"
              }
            >
              {statusLabel(order.status)}
            </span>
            {order.payment_environment === "sandbox" && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-muted-foreground">Test</span>
            )}
          </p>
          {order.tracking_number && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {carrierLabel(order.tracking_carrier)}: {order.tracking_number}
            </p>
          )}
        </div>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            {[a.firstName, a.lastName].filter(Boolean).join(" ")} · {a.street} {a.houseNumber}, {a.plz}{" "}
            {a.city}, {a.country}
          </p>

          <div className="rounded-lg border border-border p-3">
            <p className="mb-3 text-xs font-medium text-walnut">Status & Sendungsverfolgung</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs text-muted-foreground">
                Status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-muted-foreground">
                Versanddienstleister
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                >
                  {CARRIERS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-muted-foreground">
                Trackingnummer
                <input
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="z. B. 00340434161094015902"
                  className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="rounded-md bg-walnut px-3 py-1.5 text-xs font-medium text-cream disabled:opacity-60"
              >
                {saving ? "Speichert …" : "Speichern"}
              </button>
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-walnut underline"
                >
                  Sendung verfolgen <ExternalLink size={12} />
                </a>
              )}
              {order.shipped_at && (
                <span className="text-xs text-muted-foreground">
                  Versendet am {new Date(order.shipped_at).toLocaleDateString("de-DE")}
                </span>
              )}
            </div>
          </div>

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
