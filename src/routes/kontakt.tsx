import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Facebook, Instagram, Mail, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/i18n";
import { submitContact } from "@/lib/contact.functions";
import { Reveal } from "@/components/reveal";
import { CONTACT } from "@/config/contact";


export const Route = createFileRoute("/kontakt")({
  head: () => ({
    meta: [
      { title: "Kontakt | DigiNutz" },
      { name: "description", content: "Kontaktieren Sie uns für Sonderwünsche, Fragen oder individuelle Gestaltung." },
      { property: "og:title", content: "Kontakt — DigiNutz" },
      { property: "og:url", content: "/kontakt" },
    ],
    links: [{ rel: "canonical", href: "/kontakt" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t } = useT();
  const send = useServerFn(submitContact);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      await send({ data: { name, email, phone, message } });
      setSent(true);
      setName(""); setEmail(""); setPhone(""); setMessage("");
      toast.success(t("contact.success"));
    } catch (err) {
      console.error("[kontakt] submit failed", err);
      toast.error("Fehler", { description: "Bitte versuchen Sie es erneut." });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
      <Reveal>
        <div className="text-center">
          <p className="eyebrow">{t("nav.contact")}</p>
          <h1 className="mt-3 font-serif text-4xl text-walnut sm:text-6xl">{t("contact.title")}</h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">{t("contact.intro")}</p>
        </div>
      </Reveal>

      <div className="mt-14 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-2xl bg-card p-6 ring-1 ring-border/60 sm:p-8">
          <form onSubmit={submit} className="space-y-5">
            <Input label={t("contact.name")} value={name} onChange={setName} required maxLength={120} />
            <Input label={t("contact.email")} type="email" value={email} onChange={setEmail} required maxLength={255} />
            <Input label={t("contact.phone")} value={phone} onChange={setPhone} maxLength={40} />
            <label className="block">
              <span className="eyebrow">{t("contact.message")}</span>
              <textarea
                rows={6}
                required
                maxLength={2000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-2 w-full resize-none rounded-lg border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-brass"
              />
            </label>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={pending}
              className="rounded-full bg-walnut px-7 py-3 text-sm font-medium text-cream hover:bg-walnut/90 disabled:opacity-60"
            >
              {pending ? "..." : t("contact.send")}
            </motion.button>
            {sent && <p className="text-sm text-brass">{t("contact.success")}</p>}
          </form>
        </div>

        <aside className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-linen/60 p-6 ring-1 ring-border">
            <h3 className="eyebrow">Atelier</h3>
            <div className="mt-4 space-y-3 text-sm text-walnut">
              
              <p className="flex items-center gap-3"><Mail size={16} className="text-brass" /> <a href={`mailto:${CONTACT.email}`} className="hover:text-brass">{CONTACT.email}</a></p>
              <p className="flex items-center gap-3"><Phone size={16} className="text-brass" /> <a href={`tel:${CONTACT.phoneTel}`} className="hover:text-brass">{CONTACT.phoneDisplay}</a></p>
              <p className="text-xs text-muted-foreground">{t("contact.hours")}</p>
            </div>
            <h3 className="eyebrow mt-6">{t("contact.follow")}</h3>
            <div className="mt-4 flex gap-3">
              <a href={CONTACT.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid h-10 w-10 place-items-center rounded-full bg-card ring-1 ring-border hover:bg-brass/10"><Instagram size={16} /></a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="grid h-10 w-10 place-items-center rounded-full bg-card ring-1 ring-border hover:bg-brass/10"><Facebook size={16} /></a>
              <a href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="grid h-10 w-10 place-items-center rounded-full bg-card ring-1 ring-border hover:bg-brass/10"><MessageCircle size={16} /></a>
            </div>

          </div>

          <div className="overflow-hidden rounded-2xl ring-1 ring-border">
            <iframe
              title="Map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=13.37%2C52.51%2C13.42%2C52.53&layer=mapnik"
              className="block h-64 w-full"
              loading="lazy"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Input({
  label, value, onChange, type = "text", required, maxLength,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; maxLength?: number }) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-brass"
      />
    </label>
  );
}
