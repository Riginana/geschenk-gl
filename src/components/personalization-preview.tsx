import { useLayoutEffect, useRef, useState } from "react";

export type PreviewFont = "serif" | "script" | "sans";
export type PreviewColor = "black" | "white" | "gold";

const FONT_CLASS: Record<PreviewFont, string> = {
  serif: "font-serif",
  script: "italic [font-family:'Great_Vibes','Snell_Roundhand','Segoe_Script','Brush_Script_MT',cursive]",
  sans: "font-sans",
};

const COLOR_CLASS: Record<PreviewColor, string> = {
  black: "text-neutral-900 [text-shadow:0_1px_2px_rgba(255,255,255,0.55)]",
  white: "text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.55)]",
  gold: "text-[#c9a24b] [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]",
};

function AutoFitText({
  text,
  maxPx,
  minPx,
  className,
}: {
  text: string;
  maxPx: number;
  minPx: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(maxPx);

  useLayoutEffect(() => {
    setSize(maxPx);
    const el = ref.current;
    if (!el || !text) return;
    let current = maxPx;
    // shrink until it fits on a single line within parent width
    // (parent must be constrained). Multi-line still allowed via wrap.
    const parent = el.parentElement;
    if (!parent) return;
    const maxW = parent.clientWidth;
    // Try up to 20 iterations
    for (let i = 0; i < 20; i++) {
      el.style.fontSize = `${current}px`;
      if (el.scrollWidth <= maxW || current <= minPx) break;
      current -= 1;
    }
    setSize(current);
  }, [text, maxPx, minPx]);

  return (
    <div
      ref={ref}
      style={{ fontSize: `${size}px`, lineHeight: 1.15 }}
      className={className}
    >
      {text}
    </div>
  );
}

export function PersonalizationPreview({
  image,
  alt,
  name,
  date,
  message,
  font,
  color,
  onFontChange,
  onColorChange,
}: {
  image: string;
  alt: string;
  name: string;
  date: string;
  message: string;
  font: PreviewFont;
  color: PreviewColor;
  onFontChange: (f: PreviewFont) => void;
  onColorChange: (c: PreviewColor) => void;
}) {
  const fontClass = FONT_CLASS[font];
  const colorClass = COLOR_CLASS[color];
  const hasAny = name || date || message;

  return (
    <div className="mt-6 rounded-2xl bg-card p-4 ring-1 ring-border/60 sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="eyebrow">Vorschau</p>
        <span className="text-[10px] text-muted-foreground">Live</span>
      </div>

      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-linen ring-1 ring-border">
        <img src={image} alt={alt} className="h-full w-full object-cover" />
        {hasAny && (
          <div className="pointer-events-none absolute inset-x-[8%] bottom-[10%] flex flex-col items-center gap-1 text-center">
            {name && (
              <AutoFitText
                text={name}
                maxPx={34}
                minPx={16}
                className={`w-full truncate ${fontClass} ${colorClass} font-semibold tracking-wide`}
              />
            )}
            {date && (
              <AutoFitText
                text={date}
                maxPx={18}
                minPx={11}
                className={`w-full truncate ${fontClass} ${colorClass}`}
              />
            )}
            {message && (
              <div
                className={`mt-0.5 line-clamp-3 max-w-full text-[11px] leading-snug sm:text-xs ${fontClass} ${colorClass}`}
              >
                {message}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">Schrift</p>
          <div className="flex flex-wrap gap-1.5">
            {(["serif", "script", "sans"] as PreviewFont[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onFontChange(f)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  font === f ? "border-walnut bg-walnut text-cream" : "border-border bg-cream text-walnut"
                }`}
              >
                <span className={FONT_CLASS[f]}>
                  {f === "serif" ? "Klassisch" : f === "script" ? "Handschrift" : "Modern"}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">Farbe</p>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { k: "black", label: "Schwarz", sw: "#111" },
                { k: "white", label: "Weiß", sw: "#fff" },
                { k: "gold", label: "Gold", sw: "#c9a24b" },
              ] as { k: PreviewColor; label: string; sw: string }[]
            ).map(({ k, label, sw }) => (
              <button
                key={k}
                type="button"
                onClick={() => onColorChange(k)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
                  color === k ? "border-walnut bg-walnut text-cream" : "border-border bg-cream text-walnut"
                }`}
              >
                <span
                  className="inline-block h-3 w-3 rounded-full ring-1 ring-border"
                  style={{ background: sw }}
                />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
        Vorschau kann leicht vom finalen handgefertigten Produkt abweichen.
      </p>
    </div>
  );
}
