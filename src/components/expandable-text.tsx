import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useT } from "@/i18n";

/**
 * Renders product/body text that is clipped to a maximum height until
 * expanded. The toggle button only appears when the text actually overflows
 * the collapsed height (measured after mount), so short descriptions render
 * exactly like a plain paragraph.
 *
 * The server always renders the collapsed variant, so there is no
 * hydration mismatch — clipping state is derived in useEffect.
 */
export function ExpandableText({
  text,
  maxCollapsedHeight = 144,
  className = "",
}: {
  text: string;
  maxCollapsedHeight?: number;
  className?: string;
}) {
  const { t } = useT();
  const [expanded, setExpanded] = useState(false);
  const [clippable, setClippable] = useState(false);
  const [fullHeight, setFullHeight] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setFullHeight(el.scrollHeight);
    setClippable(el.scrollHeight - maxCollapsedHeight > 4);
  }, [text, maxCollapsedHeight]);

  return (
    <div className={`relative mt-6 ${className}`}>
      <div
        ref={ref}
        className="overflow-hidden whitespace-pre-line text-base leading-relaxed text-foreground/85 transition-[max-height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ maxHeight: expanded ? `${fullHeight ?? 9999}px` : `${maxCollapsedHeight}px` }}
      >
        {text}
      </div>
      {!expanded && clippable && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent" />
      )}
      {clippable && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-walnut transition hover:text-brass"
          aria-expanded={expanded}
        >
          {expanded ? t("product.showLess") : t("product.showMore")}
          <ChevronDown
            size={15}
            className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </div>
  );
}
