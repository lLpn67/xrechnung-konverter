import type { Metadata } from "next";
import { IMPRESSUM_DATA } from "@/lib/content/impressum";

export const metadata: Metadata = {
  title: "Kontakt | XRechnung-Konverter",
  description: "Kontaktmöglichkeit für den XRechnung-Konverter.",
};

export default function KontaktPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-ink">
      <h1 className="text-2xl font-semibold sm:text-3xl">Kontakt</h1>
      <p className="mt-4 leading-relaxed text-ink/80">
        Fragen, Feedback oder Fehler gefunden? Schreib einfach eine E-Mail:
      </p>
      <p className="mt-4">
        <a
          className="text-lg font-medium text-accent underline"
          href={`mailto:${IMPRESSUM_DATA.email}`}
        >
          {IMPRESSUM_DATA.email}
        </a>
      </p>
    </main>
  );
}
