import { useMemo } from "react";
import data from "@/data/products.json";

export function EtsyProducts() {
  const products = useMemo(() => data.products ?? [], []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10 lg:py-20">
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {products.map((product) => {
          const image = product.images?.[0]?.medium ?? product.images?.[0]?.full;
          const price = product.price?.toFixed(2);

          return (
            <a
              key={product.listing_id}
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-border/60 transition-shadow duration-300 hover:shadow-[0_24px_50px_-24px_rgba(60,40,20,0.25)]"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-linen">
                {image ? (
                  <img
                    src={image}
                    alt={product.title}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">
                    Kein Bild
                  </div>
                )}
              </div>
              <div className="space-y-1 px-4 py-4">
                <h3 className="line-clamp-2 font-serif text-base text-walnut">
                  {product.title}
                </h3>
                <p className="text-sm font-medium text-foreground">
                  {price} {product.currency}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default EtsyProducts;
