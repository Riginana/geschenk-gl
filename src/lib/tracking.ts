export const CARRIERS = [
  { value: "dhl", label: "DHL" },
  { value: "dhl_express", label: "DHL Express" },
  { value: "hermes", label: "Hermes" },
  { value: "dpd", label: "DPD" },
  { value: "other", label: "Andere" },
] as const;

export type CarrierValue = (typeof CARRIERS)[number]["value"];

export function carrierLabel(carrier?: string | null): string {
  return CARRIERS.find((c) => c.value === carrier)?.label ?? "Versand";
}

/** Public tracking URL for a carrier + shipment number (null when not linkable). */
export function trackingUrl(carrier?: string | null, number?: string | null): string | null {
  const nr = (number ?? "").trim();
  if (!nr) return null;
  const code = encodeURIComponent(nr);
  switch (carrier) {
    case "dhl":
    case "dhl_express":
      return `https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=${code}`;
    case "hermes":
      return `https://www.myhermes.de/empfangen/sendungsverfolgung/sendungsinformation/#${code}`;
    case "dpd":
      return `https://tracking.dpd.de/status/de_DE/parcel/${code}`;
    default:
      return null;
  }
}
