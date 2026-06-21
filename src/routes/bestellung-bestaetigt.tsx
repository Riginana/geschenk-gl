import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { z } from "zod";
import { useT } from "@/i18n";

export const Route = createFileRoute("/bestellung-bestaetigt")({
  validateSearch: (s) => z.object({ id: z.string().optional() }).parse(s),
  head: () => ({
    meta: [
      { title: "Vielen Dank für Ihre Bestellung! | Lieblingsstück Atelier" },
      { name: "description", content: "Wir haben Ihre Bestellung erhalten." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { t } = useT();
  const { id } = Route.useSearch();

  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brass/20 text-walnut"
      >
        <Check size={36} strokeWidth={2} />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="mt-8 font-serif text-4xl text-walnut sm:text-5xl"
      >
        {t("success.title")}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 text-base text-muted-foreground"
      >
        {t("success.text")}
      </motion.p>
      {id && (
        <p className="mt-6 text-sm">
          {t("success.orderNo")}: <span className="font-mono text-walnut">{id.slice(0, 8).toUpperCase()}</span>
        </p>
      )}
      <Link to="/shop" className="mt-10 inline-flex rounded-full bg-walnut px-6 py-3 text-sm font-medium text-cream hover:bg-walnut/90">
        {t("success.cta")}
      </Link>
    </div>
  );
}
