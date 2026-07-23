import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: AdminIndex,
});

function AdminIndex() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-walnut">Admin-Panel</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Willkommen. Wählen Sie einen Bereich in der Seitenleiste.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {["Товары", "Главная", "Настройки", "Заказы"].map((s) => (
          <div key={s} className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-serif text-xl">{s}</h2>
            <p className="mt-1 text-sm text-muted-foreground">В разработке.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
