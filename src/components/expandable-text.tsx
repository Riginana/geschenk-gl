import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useT } from "@/i18n";

/**
 * Renders product/body text clamped to a fixed number of lines until
 * expanded. The toggle button only appears when the text actually overflows
 * the clamped lines (measured after mount), so short descriptions render
 * exactly like a plain paragraph.
 *
 * Clamping is line-based (CSS line-clamp), so the text is never cut in the
 * middle of a line and no fade gradient is needed.
 *
 * The server always renders the collapsed variant, so there is no
 * hydration mismatch — clamping state is derived in useEffect.
 */
export function ExpandableText({
  text,
  collapsedLines = 3,
  className = "",
}: {
  text: string;
  collapsedLines?: number;
  className?: string;
}) {
  const { t } = useT();
  const [expanded, setExpanded] = useState(false);
  const [clippable, setClippable] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // With line-clamp active, scrollHeight exceeds clientHeight when the
    // text overflows the clamped number of lines.
    setClippable(el.scrollHeight - el.clientHeight > 4);
  }, [text, collapsedLines]);

  return (
    <div className={`mt-6 ${className}`}>
      <div
        ref={ref}
        className="whitespace-pre-line text-base leading-relaxed text-foreground/85"
        style={
          expanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: collapsedLines,
                overflow: "hidden",
              }
        }
      >
        {text}
      </div>
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
