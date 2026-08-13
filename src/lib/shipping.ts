/** Shared shipping rules for cart, checkout and server-side pricing. */

export const SHIPPING_METHODS = ["kleinpaket", "paket"] as const;
export const SHIPPING_ZONES = ["de", "eu", "ch"] as const;

export type ShippingMethod = (typeof SHIPPING_METHODS)[number];
export type ShippingZone = (typeof SHIPPING_ZONES)[number];

/** Fixed rates per order in cents. */
export const SHIPPING_RATES_CENTS: Record<ShippingMethod, Record<ShippingZone, number>> = {
  kleinpaket: { de: 390, eu: 849, ch: 1099 },
  paket: { de: 900, eu: 1350, ch: 2200 },
};

/** Free shipping applies to Kleinpaket + Germany from this cart value on. */
export const FREE_SHIPPING_THRESHOLD_CENTS = 5000;

export function isFreeShippingEligible(
  method: ShippingMethod,
  zone: ShippingZone,
  subtotalCents: number,
): boolean {
  return method === "kleinpaket" && zone === "de" && subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS;
}

export function computeShippingCents(
  method: ShippingMethod,
  zone: ShippingZone,
  subtotalCents: number,
): number {
  if (subtotalCents <= 0) return 0;
  if (isFreeShippingEligible(method, zone, subtotalCents)) return 0;
  return SHIPPING_RATES_CENTS[method][zone];
}

export function shippingMethodLabel(method: ShippingMethod, locale: string): string {
  if (locale === "en") {
    return method === "kleinpaket"
      ? "DHL Kleinpaket — Standard"
      : "DHL Paket — Express shipping";
  }
  return method === "kleinpaket"
    ? "DHL Kleinpaket — Standard"
    : "DHL Paket — Schneller Versand";
}

export function shippingZoneLabel(zone: ShippingZone, locale: string): string {
  if (locale === "en") {
    return zone === "de" ? "Germany" : zone === "eu" ? "EU" : "Switzerland";
  }
  return zone === "de" ? "Deutschland" : zone === "eu" ? "EU" : "Schweiz";
}

export function zoneCountryDefault(zone: ShippingZone): string {
  return zone === "de" ? "Deutschland" : zone === "ch" ? "Schweiz" : "";
}
