import { listFramePrices } from "@/lib/frame-prices.functions";
import { listHolzplattePrices } from "@/lib/holzplatte-prices.functions";

/** Shared query for the frame price grid (small table, cached once). */
export const framePricesQueryOptions = {
  queryKey: ["frame-prices"] as const,
  queryFn: () => listFramePrices(),
  staleTime: 60_000,
};

/** Shared query for Holzplatte prices (small table, cached once). */
export const holzplattePricesQueryOptions = {
  queryKey: ["holzplatte-prices"] as const,
  queryFn: () => listHolzplattePrices(),
  staleTime: 60_000,
};
