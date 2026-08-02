import { LEGAL_SOURCE_NOTE, LEGAL_TIMELINE } from "@/lib/content/legal";

export function LegalExplainer() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-2xl font-semibold text-ink sm:text-3xl">
          Warum das jetzt schon wichtig wird
        </h2>
        <p className="mt-3 max-w-2xl text-ink/70">
          Die E-Rechnungspflicht kommt stufenweise. Wer sich frühzeitig mit dem Format
          vertraut macht, spart sich später Stress unter Zeitdruck.
        </p>
        <ol className="mt-8 space-y-6 border-l-2 border-accent/30 pl-6">
          {LEGAL_TIMELINE.map((item) => (
            <li key={item.date} className="relative">
              <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-accent" />
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">
                {item.date}
              </p>
              <p className="mt-1 text-ink/90">{item.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-sm text-ink/50">{LEGAL_SOURCE_NOTE}</p>
      </div>
    </section>
  );
}
