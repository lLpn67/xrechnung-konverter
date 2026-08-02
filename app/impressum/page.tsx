import type { Metadata } from "next";
import {
  DISPUTE_RESOLUTION_TEXT,
  DISPUTE_RESOLUTION_URL,
  IMPRESSUM_DATA,
  LIABILITY_TEXT,
  isAddressComplete,
} from "@/lib/content/impressum";

export const metadata: Metadata = {
  title: "Impressum | XRechnung-Konverter",
  description: "Angaben gemäß § 5 DDG.",
};

export default function ImpressumPage() {
  const addressComplete = isAddressComplete();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-ink">
      <h1 className="text-2xl font-semibold sm:text-3xl">Impressum</h1>
      <p className="mt-2 text-sm text-ink/60">Angaben gemäß § 5 DDG (vormals TMG)</p>

      {!addressComplete && process.env.NODE_ENV !== "production" && (
        <div className="mt-6 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          <strong>Nur im Dev-Modus sichtbar:</strong> Straße/Hausnummer und/oder Postleitzahl
          fehlen noch in <code>lib/content/impressum.ts</code>. Diese Seite erfüllt ohne
          vollständige ladungsfähige Anschrift nicht die Anforderungen des § 5 DDG und sollte vor
          einem öffentlichen Launch vervollständigt werden.
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Angaben zur Person</h2>
        <p className="mt-2 leading-relaxed">
          {IMPRESSUM_DATA.name}
          <br />
          {IMPRESSUM_DATA.street || "[Straße und Hausnummer werden nachgereicht]"}
          <br />
          {IMPRESSUM_DATA.postcode || "[PLZ wird nachgereicht]"} {IMPRESSUM_DATA.city}
          <br />
          {IMPRESSUM_DATA.country}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Kontakt</h2>
        <p className="mt-2">
          E-Mail:{" "}
          <a className="text-accent underline" href={`mailto:${IMPRESSUM_DATA.email}`}>
            {IMPRESSUM_DATA.email}
          </a>
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Streitschlichtung</h2>
        <p className="mt-2 leading-relaxed">
          {DISPUTE_RESOLUTION_TEXT[0]}{" "}
          <a
            className="text-accent underline"
            href={DISPUTE_RESOLUTION_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {DISPUTE_RESOLUTION_URL}
          </a>
        </p>
        <p className="mt-2 leading-relaxed">{DISPUTE_RESOLUTION_TEXT[1]}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Haftungshinweis</h2>
        {LIABILITY_TEXT.map((paragraph) => (
          <p key={paragraph} className="mt-2 leading-relaxed">
            {paragraph}
          </p>
        ))}
      </section>
    </main>
  );
}
