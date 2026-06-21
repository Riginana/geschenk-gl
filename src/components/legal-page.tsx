import type { ReactNode } from "react";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
      <h1 className="font-serif text-4xl text-walnut sm:text-5xl">{title}</h1>
      <div className="prose mt-8 max-w-none text-sm text-foreground/85 [&_h2]:font-serif [&_h2]:text-walnut [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3">
        {children}
      </div>
      <p className="mt-12 rounded-xl border border-dashed border-border bg-card p-4 text-xs text-muted-foreground">
        Diese Seite enthält Platzhalter-Inhalte. Bitte ergänzen Sie hier den von Ihrem Anwalt freigegebenen Rechtstext.
      </p>
    </div>
  );
}
