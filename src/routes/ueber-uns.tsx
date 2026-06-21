import { createFileRoute } from "@tanstack/react-router";
import atelier from "@/assets/atelier.jpg";
import { Reveal } from "@/components/reveal";
import { useT } from "@/i18n";

export const Route = createFileRoute("/ueber-uns")({
  head: () => ({
    meta: [
      { title: "Über uns — Unsere Werkstatt | Lieblingsstück Atelier" },
      { name: "description", content: "Lernen Sie unsere kleine Werkstatt kennen — Handarbeit, Materialien und unsere Geschichte." },
      { property: "og:title", content: "Über uns — Lieblingsstück Atelier" },
      { property: "og:url", content: "/ueber-uns" },
    ],
    links: [{ rel: "canonical", href: "/ueber-uns" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useT();
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
      <Reveal>
        <div className="text-center">
          <p className="eyebrow">{t("atelier.eyebrow")}</p>
          <h1 className="mt-3 font-serif text-4xl text-walnut sm:text-6xl">{t("about.title")}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground">{t("about.intro")}</p>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-14 overflow-hidden rounded-2xl shadow-xl ring-1 ring-border">
          <img src={atelier} alt="Unsere Werkstatt" loading="lazy" width={1400} height={1000} className="block h-auto w-full" />
        </div>
      </Reveal>

      <div className="mt-16 grid gap-10 md:grid-cols-3">
        {[
          { t: "Handgefertigt", d: "Jedes Stück wird in unserer Werkstatt von Hand zugeschnitten, lackiert und veredelt." },
          { t: "Faire Materialien", d: "Wir verwenden Eichenholz aus nachhaltiger Forstwirtschaft und hochwertiges Kraftpapier." },
          { t: "Persönlich", d: "Sie erreichen uns direkt — wir gehen auf Wünsche und Sonderanfertigungen gerne ein." },
        ].map((b, i) => (
          <Reveal key={b.t} delay={i * 0.05}>
            <div className="rounded-2xl bg-card p-6 ring-1 ring-border/60">
              <h3 className="font-serif text-xl text-walnut">{b.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
