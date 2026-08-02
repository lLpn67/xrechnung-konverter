import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-white py-10 text-center text-sm text-ink/50">
      <p>
        XRechnung-Konverter · Kein Steuerberatungsangebot · Alle Angaben ohne Gewähr
      </p>
      <p className="mt-1">Wir speichern deine Rechnungsdaten nicht.</p>
      <nav className="mt-4 flex justify-center gap-4">
        <Link href="/impressum" className="underline hover:text-ink/80">
          Impressum
        </Link>
        <Link href="/kontakt" className="underline hover:text-ink/80">
          Kontakt
        </Link>
      </nav>
    </footer>
  );
}
