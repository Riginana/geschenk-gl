const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

/** Shown only while the payment test environment is active. */
export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
        Zahlungen sind für diesen Build noch nicht freigeschaltet.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full border-b border-brass/40 bg-brass/15 px-4 py-2 text-center text-sm text-walnut">
        Testmodus: Alle Zahlungen in der Vorschau sind Testzahlungen (Karte 4242 4242 4242 4242).
      </div>
    );
  }
  return null;
}
