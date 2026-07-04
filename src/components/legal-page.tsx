import type { ReactNode } from "react";
import { useT } from "@/i18n";

export function LegalPage({
  title,
  titleEn,
  children,
  childrenEn,
}: {
  title: string;
  titleEn?: string;
  children: ReactNode;
  childrenEn?: ReactNode;
}) {
  const { locale } = useT();
  const isEn = locale === "en" && (titleEn || childrenEn);
  const shownTitle = isEn && titleEn ? titleEn : title;
  const shownChildren = isEn && childrenEn ? childrenEn : children;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
      <h1 className="font-serif text-4xl text-walnut sm:text-5xl">{shownTitle}</h1>
      <div className="prose mt-8 max-w-none text-sm text-foreground/85 [&_h2]:font-serif [&_h2]:text-walnut [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3">
        {shownChildren}
      </div>
      {locale === "en" && (
        <p className="mt-8 rounded-lg border border-border/60 bg-linen/60 p-4 text-xs text-muted-foreground">
          This English text is provided for convenience only. The binding legal
          version is the German original.
        </p>
      )}
    </div>
  );
}
