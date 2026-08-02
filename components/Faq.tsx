const FAQ_ITEMS = [
  {
    question: "Was ist der Unterschied zwischen XRechnung und ZUGFeRD?",
    answer:
      "Beide erfüllen den europäischen Standard EN 16931. XRechnung ist ein reines XML-Format (keine visuelle Darstellung), ZUGFeRD kombiniert dasselbe strukturierte XML mit einem lesbaren PDF (PDF/A-3 mit eingebettetem XML). Für den Empfang durch die öffentliche Verwaltung wird meist XRechnung verlangt, im B2B-Bereich akzeptieren viele auch ZUGFeRD.",
  },
  {
    question: "Wer ist ab wann betroffen?",
    answer:
      "Die Pflicht zum Empfang gilt bereits seit 2025 für alle inländischen Unternehmen. Die Pflicht zum Ausstellen greift stufenweise: ab 2027 für Unternehmen mit mehr als 800.000 € Vorjahresumsatz, ab 2028 für nahezu alle. Details im Abschnitt oben.",
  },
  {
    question: "Ist die erzeugte Datei GoBD-konform?",
    answer:
      "Das Tool erzeugt ein strukturiertes XML nach dem XRechnung-Standard. GoBD-Konformität betrifft zusätzlich die revisionssichere Aufbewahrung (Archivierung) der Rechnung über die gesetzliche Frist – das übernimmt dieses kostenlose Tool bewusst nicht. Für laufende Archivierung ist unser kommendes Abo-Produkt gedacht.",
  },
  {
    question: "Werden meine Rechnungsdaten gespeichert?",
    answer:
      "Nein. Die Formulardaten werden nur zur Erzeugung der XML-Datei verarbeitet und danach nicht dauerhaft gespeichert. Es gibt kein Nutzerkonto und keine Datenbank für Rechnungsinhalte.",
  },
  {
    question: "Kann ich mich auf die Konformität der erzeugten XML verlassen?",
    answer:
      "Das Tool prüft die wichtigsten Pflichtfelder nach EN 16931. Es ersetzt jedoch keine vollständige Schema-Validierung (z. B. durch den offiziellen KoSIT-Validator) und keine Steuerberatung. Bitte prüfe die erzeugte Datei vor dem Versand.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="bg-white py-16">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-2xl font-semibold text-ink sm:text-3xl">Häufige Fragen</h2>
        <div className="mt-8 divide-y divide-ink/10">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-left font-medium text-ink">
                {item.question}
                <span className="ml-4 shrink-0 text-accent transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-ink/70">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
