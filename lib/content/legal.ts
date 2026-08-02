// Zentrale Stelle für rechtlich relevante Texte auf der Landingpage.
// WICHTIG: Diese Texte sind bewusst vorsichtig formuliert und sollten vor
// Veröffentlichung gegen die aktuelle Fassung des BMF-Schreibens zur
// verpflichtenden E-Rechnung (Wachstumschancengesetz, § 14 UStG) geprüft
// und bei Bedarf durch den exakten Wortlaut ersetzt werden. Ein Sprachmodell
// sollte Fristen/Grenzwerte hier nicht eigenständig "aus dem Kopf"
// aktualisieren – Gesetzestexte ändern sich.

export const LEGAL_TIMELINE = [
  {
    date: "seit 1. Januar 2025",
    text: "Alle inländischen Unternehmen müssen elektronische Rechnungen (E-Rechnung im strukturierten Format) von anderen Unternehmen empfangen und verarbeiten können.",
  },
  {
    date: "ab 1. Januar 2027",
    text: "Unternehmen mit einem Gesamtumsatz über 800.000 € im Vorjahr müssen E-Rechnungen im B2B-Geschäft ausstellen.",
  },
  {
    date: "ab 1. Januar 2028",
    text: "Die Pflicht zur Ausstellung von E-Rechnungen gilt für nahezu alle inländischen B2B-Umsätze, unabhängig vom Umsatz.",
  },
];

export const LEGAL_SOURCE_NOTE =
  "Grundlage: Wachstumschancengesetz und begleitende Schreiben des Bundesministeriums der Finanzen (BMF) zu § 14 UStG. Angaben ohne Gewähr – bitte die jeweils aktuelle Fassung auf bundesfinanzministerium.de prüfen. Diese Seite ersetzt keine Steuerberatung.";
