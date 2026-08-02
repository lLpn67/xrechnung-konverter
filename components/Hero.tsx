export function Hero() {
  return (
    <header className="bg-ink text-white">
      <div className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-20">
        <p className="mb-4 inline-block rounded-full border border-white/20 px-4 py-1 text-sm text-white/80">
          Ohne Anmeldung · Keine Speicherung deiner Daten
        </p>
        <h1 className="text-3xl font-semibold leading-tight sm:text-5xl">
          Kostenlos zur XRechnung — in 2&nbsp;Minuten
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-white/80">
          Erstelle eine standardkonforme XRechnung (UBL, EN&nbsp;16931) direkt im Browser.
          Kein Konto, keine Installation — deine Rechnungsdaten verlassen unseren Server nach
          der Verarbeitung sofort wieder.
        </p>
        <div className="mt-8">
          <a
            href="#tool"
            className="inline-block rounded-md bg-accent px-8 py-3 text-base font-medium text-white transition hover:bg-accent-light"
          >
            Jetzt XRechnung erstellen
          </a>
        </div>
      </div>
    </header>
  );
}
