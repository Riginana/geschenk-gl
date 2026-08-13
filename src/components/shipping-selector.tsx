import { formatEUR, useT } from "@/i18n";
import { useCart } from "@/contexts/cart";
import {
  SHIPPING_METHODS,
  SHIPPING_RATES_CENTS,
  SHIPPING_ZONES,
  shippingMethodLabel,
  shippingZoneLabel,
  type ShippingMethod,
  type ShippingZone,
} from "@/lib/shipping";

type Props = { onZoneChange?: (zone: ShippingZone) => void };

/** Radio buttons for shipping method + delivery zone, shared by cart and checkout. */
export function ShippingSelector({ onZoneChange }: Props) {
  const { locale } = useT();
  const { shippingMethod, shippingZone, setShippingMethod, setShippingZone, subtotalCents } =
    useCart();
  const isEn = locale === "en";

  const free = (m: ShippingMethod) =>
    m === "kleinpaket" && shippingZone === "de" && subtotalCents >= 5000;

  return (
    <div className="space-y-4">
      <div>
        <span className="eyebrow">{isEn ? "Delivery country" : "Lieferland"}</span>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {SHIPPING_ZONES.map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => {
                setShippingZone(z);
                onZoneChange?.(z);
              }}
              className={`rounded-full border px-3 py-2 text-xs transition ${
                shippingZone === z
                  ? "border-walnut bg-walnut/5 font-medium text-walnut"
                  : "border-border bg-cream text-muted-foreground"
              }`}
            >
              {shippingZoneLabel(z, locale)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="eyebrow">{isEn ? "Shipping method" : "Versandart"}</span>
        <div className="mt-2 space-y-2">
          {SHIPPING_METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setShippingMethod(m)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                shippingMethod === m ? "border-walnut bg-walnut/5" : "border-border bg-cream"
              }`}
            >
              <span className="font-medium text-walnut">{shippingMethodLabel(m, locale)}</span>
              <span className="shrink-0 text-muted-foreground">
                {free(m)
                  ? isEn
                    ? "Free"
                    : "Kostenlos"
                  : formatEUR(SHIPPING_RATES_CENTS[m][shippingZone], locale)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Progress hint towards the free-shipping threshold (Kleinpaket + Germany only). */
export function FreeShippingProgress() {
  const { locale } = useT();
  const { shippingMethod, shippingZone, subtotalCents } = useCart();
  const isEn = locale === "en";

  if (shippingMethod !== "kleinpaket" || shippingZone !== "de" || subtotalCents <= 0) return null;

  if (subtotalCents >= 5000)
    return (
      <p className="rounded-lg bg-brass/15 px-3 py-2 text-xs font-medium text-walnut">
        {isEn ? "Free shipping unlocked" : "Versandkostenfrei"} 🎉
      </p>
    );

  const missing = 5000 - subtotalCents;
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {isEn
          ? `Only ${formatEUR(missing, locale)} to go for free shipping!`
          : `Noch ${formatEUR(missing, locale)} bis zum kostenlosen Versand!`}
      </p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-brass transition-all"
          style={{ width: `${Math.min(100, (subtotalCents / 5000) * 100)}%` }}
        />
      </div>
    </div>
  );
}
