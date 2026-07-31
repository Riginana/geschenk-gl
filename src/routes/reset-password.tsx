import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Passwort zurücksetzen — DigiNutz" },
      {
        name: "description",
        content: "Neues Passwort für den geschützten DigiNutz-Adminbereich festlegen.",
      },
      { property: "og:title", content: "Passwort zurücksetzen — DigiNutz" },
      {
        property: "og:description",
        content: "Neues Passwort für den geschützten DigiNutz-Adminbereich festlegen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    let recoveryConfirmed =
      window.sessionStorage.getItem("diginutz-password-recovery") === "pending";
    const searchParams = new URLSearchParams(window.location.search);
    const hasRecoveryUrl =
      window.location.hash.includes("type=recovery") ||
      searchParams.get("type") === "recovery" ||
      searchParams.has("token_hash") ||
      searchParams.has("code");

    if (hasRecoveryUrl) {
      recoveryConfirmed = true;
      window.sessionStorage.setItem("diginutz-password-recovery", "pending");
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        recoveryConfirmed = true;
        window.sessionStorage.setItem("diginutz-password-recovery", "pending");
        if (active) setStatus("ready");
      }
    });

    const prepareRecovery = async () => {
      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (active) setStatus("invalid");
          return;
        }
        recoveryConfirmed = true;
        window.history.replaceState({}, "", "/reset-password");
      }

      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (!error && data.session && recoveryConfirmed) {
        setStatus("ready");
      } else {
        setStatus("invalid");
      }
    };

    void prepareRecovery();
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Mindestens 8 Zeichen.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwörter stimmen nicht überein.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    window.sessionStorage.removeItem("diginutz-password-recovery");
    toast.success("Passwort aktualisiert.");
    navigate({ to: "/admin", replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="font-serif text-3xl text-walnut">Neues Passwort</h1>
        {status === "checking" ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Recovery-Link wird geprüft…
          </p>
        ) : status === "invalid" ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Dieser Link ist ungültig oder abgelaufen. Fordern Sie bitte einen neuen Link an.
            </p>
            <Link
              to="/admin/login"
              className="inline-flex items-center justify-center rounded-full bg-walnut px-5 py-2.5 text-sm font-medium text-cream hover:bg-walnut/90"
            >
              Zur Admin-Anmeldung
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium">Neues Passwort</label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-walnut"
              />
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium">Passwort bestätigen</label>
              <input
                id="confirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-walnut"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-walnut px-5 py-2.5 text-sm font-medium text-cream hover:bg-walnut/90 disabled:opacity-50"
            >
              {loading ? "Speichern…" : "Passwort speichern"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
