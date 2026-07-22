export const PROMO = 0.30; // 30% off everything

export const PRICE_BY_FORMAT_CENTS: Record<string, number> = { A5: 0, A4: 300, A3: 600 };
export const PRICE_BY_FRAME_CENTS: Record<string, number> = { papier: 0, kraftpapier: 0, holz: 300 };

export function withPromo(cents: number): number {
  return Math.round(cents * (1 - PROMO));
}
