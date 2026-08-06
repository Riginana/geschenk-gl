import { useState } from "react";
import { Check, X } from "lucide-react";
import type { Motif } from "@/lib/product-config";
import { activeMotifs } from "@/lib/product-config";

export function MotifPreviewCard({
  motif,
  selected,
  onSelect,
  onZoom,
}: {
  motif: Motif;
  selected: boolean;
  onSelect: () => void;
  onZoom?: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`group relative flex w-full flex-col overflow-hidden rounded-xl border text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brass ${
        selected ? "border-walnut ring-1 ring-walnut bg-walnut/5" : "border-border bg-cream hover:border-walnut/50"
      }`}
    >
      <span className="relative block aspect-square w-full overflow-hidden bg-linen">
        {motif.preview_image_url ? (
          <img
            src={motif.preview_image_url}
            alt={`Motiv ${motif.number} — ${motif.title}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="grid h-full w-full place-items-center px-3 text-center font-serif text-sm text-muted-foreground">
            Motiv {motif.number}
          </span>
        )}
        {selected && (
          <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-walnut text-cream">
            <Check size={13} />
          </span>
        )}
        {motif.preview_image_url && onZoom && (
          <span
            role="presentation"
            onClick={(e) => {
              e.stopPropagation();
              onZoom();
            }}
            className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] text-walnut opacity-0 transition group-hover:opacity-100"
          >
            Vergrößern
          </span>
        )}
      </span>
      <span className="block px-3 py-2.5">
        <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">
          Motiv {motif.number}
        </span>
        <span className="mt-0.5 block text-sm font-medium text-walnut">{motif.title}</span>
        {motif.description && (
          <span className="mt-1 line-clamp-2 block text-[11px] leading-snug text-muted-foreground">
            {motif.description}
          </span>
        )}
      </span>
    </button>
  );
}

export function CustomMotifTextField({
  value,
  onChange,
  maxLength,
  required,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  required?: boolean;
  error?: string | null;
}) {
  return (
    <label className="mt-4 block">
      <span className="text-xs text-muted-foreground">
        Wunschtext für das Innenmotiv{required ? " *" : ""}
      </span>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        maxLength={maxLength}
        aria-invalid={!!error}
        placeholder="Ihr persönlicher Text …"
        className={`mt-1.5 w-full resize-none rounded-lg border bg-cream px-4 py-2.5 text-sm outline-none focus:border-brass ${
          error ? "border-destructive" : "border-border"
        }`}
      />
      <span className="mt-1 flex items-center justify-between text-[11px]">
        <span className={error ? "text-destructive" : "text-muted-foreground"}>
          {error ?? "Wird innen graviert."}
        </span>
        <span className="text-muted-foreground">
          {value.length}/{maxLength}
        </span>
      </span>
    </label>
  );
}

export function ProductMotifSelector({
  motifs,
  selectedId,
  onSelect,
  error,
}: {
  motifs: Motif[];
  selectedId: string | null;
  onSelect: (m: Motif) => void;
  error?: string | null;
}) {
  const [zoom, setZoom] = useState<Motif | null>(null);
  const list = activeMotifs(motifs);
  if (!list.length) return null;

  return (
    <div className="mt-6 rounded-2xl bg-card p-6 ring-1 ring-border/60">
      <p className="eyebrow mb-3">Motiv auswählen *</p>
      <div
        role="radiogroup"
        aria-label="Motiv auswählen"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {list.map((m) => (
          <MotifPreviewCard
            key={m.id}
            motif={m}
            selected={m.id === selectedId}
            onSelect={() => onSelect(m)}
            onZoom={() => setZoom(m)}
          />
        ))}
      </div>
      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

      {zoom?.preview_image_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Motiv ${zoom.number} — ${zoom.title}`}
          onClick={() => setZoom(null)}
        >
          <button
            type="button"
            aria-label="Schließen"
            onClick={() => setZoom(null)}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-walnut hover:bg-white"
          >
            <X size={18} />
          </button>
          <img
            src={zoom.preview_image_url}
            alt={`Motiv ${zoom.number} — ${zoom.title}`}
            className="max-h-[85vh] w-auto max-w-full rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
}
