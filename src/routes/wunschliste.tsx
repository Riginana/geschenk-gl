import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useT } from "@/i18n";
import { useWishlist } from "@/contexts/wishlist";
import { listProducts } from "@/lib/products.functions";
import { ProductCard } from "@/components/product-card";

export const Route = createFileRoute("/wunschliste")({
  head: () => ({
    meta: [
      { title: "Wunschliste | Lieblingsstück Atelier" },
      { name: "description", content: "Ihre Favoriten bei Lieblingsstück Atelier." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData({ queryKey: ["products"], queryFn: () => listProducts() }),
  component: WishlistPage,
});

function WishlistPage() {
  const { t } = useT();
  const { ids } = useWishlist();
  const { data: products } = useSuspenseQuery({ queryKey: ["products"], queryFn: () => listProducts() });
  const items = products.filter((p) => ids.includes(p.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10 lg:py-20">
      <h1 className="font-serif text-4xl text-walnut sm:text-5xl">{t("wishlist.title")}</h1>
      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl bg-linen px-6 py-20 text-center">
          <p className="text-muted-foreground">{t("wishlist.empty")}</p>
          <Link to="/shop" className="mt-6 inline-flex rounded-full bg-walnut px-6 py-3 text-sm font-medium text-cream hover:bg-walnut/90">
            {t("cart.continueShopping")}
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
