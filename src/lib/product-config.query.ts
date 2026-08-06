import { listProductConfig } from "@/lib/product-config.functions";

/** Shared query for all size variants + motifs (small table, cached once). */
export const productConfigQueryOptions = {
  queryKey: ["product-config"] as const,
  queryFn: () => listProductConfig(),
  staleTime: 60_000,
};
